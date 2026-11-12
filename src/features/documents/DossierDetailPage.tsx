import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Archive, Download, FilePlus2, Lock, Pencil } from 'lucide-react';
import { documentsService, readImpersonation, type ApiError, type DossierDetail, type DossierItem } from '../../shared/api';
import { ROUTES } from '../../shared/config/constants';
import { useNotification } from '../../shared/context';
import { exportToCsv, type CsvColumn } from '../../shared/export';
import { asUtc, formatDateTime, today } from '../../shared/format';
import { useConfirm, usePermission } from '../../shared/hooks';
import { Badge, Button, Card, EmptyState, LoadingBlock, PageContainer, PageHeader } from '../../shared/ui';
import { errorText, needsLocalToast } from '../associates/labels';
import { DossierFormDialog } from './components/DossierFormDialog';
import { DossierItemDialog } from './components/DossierItemDialog';
import { Fact } from './DocumentDetailPage';
import {
    DISPOSITION, DOSSIER_STAGE, DOSSIER_STATUS, PERMISSIONS,
    dossierSection, dossierSeries, dossierSubseries, formatSize, retentionText, saveBlob, shortDate,
} from './labels';

/** Index of the dossier: an internal report of its documents by position. */
const INDEX_COLUMNS: CsvColumn<DossierItem>[] = [
    { header: 'Posición', value: (i) => i.position },
    { header: 'Título', value: (i) => i.title },
    { header: 'Tipo documental', value: (i) => i.documentaryTypeName },
    { header: 'Fecha del documento', value: (i) => shortDate(i.documentDate) },
    { header: 'Archivo', value: (i) => i.fileName },
    { header: 'Tamaño', value: (i) => formatSize(i.sizeBytes) },
    { header: 'Incorporado por', value: (i) => i.createdByName },
    { header: 'Fecha de incorporación', value: (i) => formatDateTime(asUtc(i.createdAt)) },
];

/** One dossier: its data, its stage and dates once closed, and its documents. The buttons only guide; the API decides. */
export const DossierDetailPage: React.FC = () => {
    const { id = '' } = useParams<{ id: string }>();
    const canManage = usePermission().has(PERMISSIONS.DOSSIERS_MANAGE);
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    const impersonating = !!readImpersonation();

    const [loaded, setLoaded] = useState<DossierDetail | null>(null);
    const [failure, setFailure] = useState<'missing' | 'failed' | null>(null);
    const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState('');
    const [editing, setEditing] = useState(false);
    // undefined closed, null a new document, a document to correct it.
    const [itemForm, setItemForm] = useState<DossierItem | null | undefined>(undefined);

    const refresh = () => setReload((n) => n + 1);

    useEffect(() => {
        let live = true;
        setFailure(null);
        documentsService.dossier(id).then(
            (r) => { if (live) setLoaded(r.data); },
            (e: ApiError) => { if (live) setFailure(e.status === 404 ? 'missing' : 'failed'); },
        );
        return () => { live = false; };
    }, [id, reload]);

    if (failure) {
        return (
            <PageContainer>
                <PageHeader title="Expediente" backTo={ROUTES.DOSSIERS} backLabel="Expedientes" />
                <Card>
                    {failure === 'missing'
                        ? <EmptyState title="Expediente no encontrado" description="No existe o no tienes acceso a él." />
                        : <EmptyState title="No se pudo cargar el expediente" action={<Button variant="outline" size="sm" onClick={refresh}>Reintentar</Button>} />}
                </Card>
            </PageContainer>
        );
    }

    // A previous dossier stays in state while another one loads.
    const dossier = loaded?.id === id ? loaded : null;
    if (!dossier) return <PageContainer><LoadingBlock label="Cargando expediente…" /></PageContainer>;

    const open = dossier.status === 'Open';
    const [statusLabel, statusVariant] = DOSSIER_STATUS[dossier.status];

    const close = async () => {
        const yes = await confirm({
            title: `Cerrar ${dossier.code}`,
            message: 'Se calculan sus fechas de retención con los tiempos que la serie tiene hoy. No se puede deshacer: un expediente cerrado no se reabre ni recibe más documentos.',
            confirmText: 'Cerrar expediente',
            cancelText: 'Cancelar',
        });
        if (!yes || busy) return;
        setBusy('close');
        try {
            await documentsService.closeDossier(id);
            showNotification({ type: 'success', message: 'Expediente cerrado' });
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setBusy('');
            // Either way: a 409 means the dossier changed under the user.
            refresh();
        }
    };

    const download = async (item: DossierItem) => {
        setBusy(`file-${item.id}`);
        try {
            saveBlob(await documentsService.downloadDossierItem(id, item.id), item.fileName);
        } catch (e) {
            // readApiError raises no toast on a 404.
            if (needsLocalToast(e)) showNotification({ type: 'error', message: 'El archivo no está disponible' });
        } finally {
            setBusy('');
        }
    };

    return (
        <PageContainer>
            <PageHeader
                icon={<Archive className="shrink-0 text-primary" size={24} aria-hidden="true" />}
                title={`${dossier.code} · ${dossier.title}`}
                backTo={ROUTES.DOSSIERS}
                backLabel="Expedientes"
                // The primary action goes last: rightmost on desktop and a full-width row on a phone.
                actions={<>
                    {canManage && <Button variant="outline" icon={Pencil} onClick={() => setEditing(true)}>Editar</Button>}
                    {canManage && open && !impersonating && <Button variant="outline" icon={Lock} isLoading={busy === 'close'} onClick={close}>Cerrar expediente</Button>}
                    {canManage && open && <Button icon={FilePlus2} onClick={() => setItemForm(null)}>Incorporar documento</Button>}
                </>}
            />

            <Card className="mb-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Fact label="Estado"><Badge variant={statusVariant}>{statusLabel}</Badge></Fact>
                    <Fact label="Sección">{dossierSection(dossier)}</Fact>
                    <Fact label="Serie">{dossierSeries(dossier)}</Fact>
                    <Fact label="Subserie">{dossierSubseries(dossier) || '—'}</Fact>
                    <Fact label="Responsable">{dossier.ownerName ?? '—'}</Fact>
                    <Fact label="Fecha de apertura">{shortDate(dossier.openedOn)}</Fact>
                    <div className="sm:col-span-2">
                        <Fact label="Ubicación física">{dossier.physicalLocation ?? '—'}</Fact>
                    </div>
                    {open ? (
                        <div className="sm:col-span-2 lg:col-span-4">
                            <Fact label="Retención de la serie">
                                {retentionText(dossier.retention) ?? 'Sin retención definida'}
                                {dossier.retention?.inherited && <Badge className="ml-2">Heredada de la serie</Badge>}
                            </Fact>
                        </div>
                    ) : <>
                        <Fact label="Etapa">{dossier.stage ? DOSSIER_STAGE[dossier.stage] : '—'}</Fact>
                        <Fact label="Fecha de cierre">{shortDate(dossier.closedOn) || '—'}</Fact>
                        <Fact label="Cerrado por">{dossier.closedByName ?? '—'}</Fact>
                        <Fact label="Gestión hasta">{shortDate(dossier.managementUntil) || '—'}</Fact>
                        <Fact label="Central hasta">{shortDate(dossier.centralUntil) || '—'}</Fact>
                        <Fact label="Disposición final">{dossier.finalDisposition ? DISPOSITION[dossier.finalDisposition] : '—'}</Fact>
                    </>}
                </dl>
            </Card>

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-border-dark">
                    <h2 className="text-lg leading-7 font-bold text-slate-900 dark:text-white">Documentos</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={Download}
                        disabled={dossier.items.length === 0}
                        onClick={() => exportToCsv(dossier.items, INDEX_COLUMNS, `indice-${dossier.code}-${today()}`)}
                    >
                        Índice del expediente
                    </Button>
                </div>
                {dossier.items.length === 0 ? (
                    <EmptyState title="Aún no hay documentos" description={canManage && open ? 'Incorpora el primero: el expediente no se puede cerrar vacío.' : undefined} />
                ) : (
                    <ul aria-label="Documentos del expediente" className="divide-y divide-slate-100 dark:divide-border-dark">
                        {dossier.items.map((item) => (
                            <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1 space-y-1 break-words text-sm">
                                    <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                        <span className="min-w-0 break-words">{item.position}. {item.title}</span>
                                        {item.documentaryTypeName && <Badge variant="info">{item.documentaryTypeName}</Badge>}
                                    </p>
                                    <p className="text-slate-700 dark:text-slate-200">Fecha del documento: {shortDate(item.documentDate)}</p>
                                    <p className="text-[13px] leading-[18px] text-slate-500 dark:text-slate-400">
                                        {item.fileName} · {formatSize(item.sizeBytes)} · Incorporó {item.createdByName ?? '—'}, {formatDateTime(asUtc(item.createdAt))}
                                    </p>
                                </div>
                                <div className="grid shrink-0 grid-cols-2 gap-2 [&>*]:w-full [&>*:last-child:nth-child(odd)]:col-span-2 sm:flex sm:[&>*]:w-auto lg:justify-end">
                                    <Button variant="outline" size="sm" icon={Download} aria-label={`Descargar documento ${item.position}`} isLoading={busy === `file-${item.id}`} onClick={() => download(item)}>
                                        Descargar
                                    </Button>
                                    {canManage && open && (
                                        <Button variant="outline" size="sm" icon={Pencil} aria-label={`Corregir documento ${item.position}`} onClick={() => setItemForm(item)}>Corregir</Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {editing && (
                <DossierFormDialog dossier={dossier} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />
            )}

            {itemForm !== undefined && (
                <DossierItemDialog
                    dossier={dossier}
                    item={itemForm}
                    onClose={() => setItemForm(undefined)}
                    onSaved={() => { setItemForm(undefined); refresh(); }}
                />
            )}
        </PageContainer>
    );
};
