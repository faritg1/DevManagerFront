import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, FileText, Pencil, Send, Share2, Upload, XCircle } from 'lucide-react';
import {
    documentsService, readImpersonation, type ApiError, type DocumentDetail, type DocumentRead, type DocumentVersion, type PendingRead,
} from '../../shared/api';
import { ROUTES } from '../../shared/config/constants';
import { useAuth, useNotification } from '../../shared/context';
import { asUtc, formatDate, formatDateTime } from '../../shared/format';
import { useConfirm, usePermission } from '../../shared/hooks';
import {
    Badge, Button, Card, EmptyState, LoadingBlock, Modal, PageContainer, PageHeader, Textarea,
    TABLE_CLASS, TBODY_CLASS, TD_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS,
} from '../../shared/ui';
import { errorText, needsLocalToast } from '../associates/labels';
import { DistributeDialog } from './components/DistributeDialog';
import { VersionFormDialog } from './components/VersionFormDialog';
import { PERMISSIONS, STATUS, formatSize, retentionText, seriesLabel } from './labels';

const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
};

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
);

/** One document: its versions and the flow each permission allows. The buttons only guide; the API decides. */
export const DocumentDetailPage: React.FC = () => {
    const { id = '' } = useParams<{ id: string }>();
    const [search] = useSearchParams();
    const linkedVersion = search.get('version');
    const { has } = usePermission();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    const canCreate = has(PERMISSIONS.CREATE);
    const canApprove = has(PERMISSIONS.APPROVE);
    const canDistribute = has(PERMISSIONS.DISTRIBUTE);
    const impersonating = !!readImpersonation();

    const [loaded, setLoaded] = useState<DocumentDetail | null>(null);
    const [failure, setFailure] = useState<'missing' | 'failed' | null>(null);
    const [pending, setPending] = useState<PendingRead | null>(null);
    const [reads, setReads] = useState<DocumentRead[] | null>(null);
    const [readsFailed, setReadsFailed] = useState(false);
    const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState('');
    // undefined closed, null a new version, a version to correct it.
    const [versionForm, setVersionForm] = useState<DocumentVersion | null | undefined>(undefined);
    const [rejecting, setRejecting] = useState<DocumentVersion | null>(null);
    const [comment, setComment] = useState('');
    const [distributing, setDistributing] = useState(false);

    const refresh = () => setReload((n) => n + 1);

    useEffect(() => {
        let live = true;
        setFailure(null);
        documentsService.get(id).then(
            (r) => { if (live) setLoaded(r.data); },
            (e: ApiError) => { if (live) setFailure(e.status === 404 ? 'missing' : 'failed'); },
        );
        documentsService.pendingReads().then(
            (r) => { if (live) setPending(r.data?.find((p) => p.documentId === id) ?? null); },
            () => { if (live) setPending(null); },
        );
        if (canDistribute) {
            setReadsFailed(false);
            documentsService.reads(id).then(
                (r) => { if (live) setReads(r.data ?? []); },
                () => { if (live) setReadsFailed(true); },
            );
        }
        return () => { live = false; };
    }, [id, reload, canDistribute]);

    /** Reloads either way: a 409 means the version changed under the user. */
    const act = async (key: string, call: () => Promise<unknown>, message: string): Promise<boolean> => {
        if (busy) return false;
        setBusy(key);
        try {
            await call();
            showNotification({ type: 'success', message });
            return true;
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
            return false;
        } finally {
            setBusy('');
            refresh();
        }
    };

    const approve = async (v: DocumentVersion) => {
        const yes = await confirm({
            title: `Aprobar versión ${v.versionNumber}`,
            message: 'Pasa a ser la vigente y la anterior queda obsoleta. No se puede deshacer.',
            confirmText: 'Aprobar',
            cancelText: 'Cancelar',
        });
        if (yes) await act(`approve-${v.id}`, () => documentsService.approve(id, v.id), 'Versión aprobada');
    };

    const reject = async () => {
        if (rejecting && await act('reject', () => documentsService.reject(id, rejecting.id, comment), 'Versión devuelta a Borrador')) setRejecting(null);
    };

    const download = async (v: DocumentVersion) => {
        setBusy(`file-${v.id}`);
        try {
            saveBlob(await documentsService.download(id, v.id), v.fileName);
        } catch (e) {
            // readApiError raises no toast on a 404.
            if (needsLocalToast(e)) showNotification({ type: 'error', message: 'El archivo no está disponible' });
        } finally {
            setBusy('');
        }
    };

    if (failure) {
        return (
            <PageContainer>
                <PageHeader title="Documento" backTo={ROUTES.DOCUMENTS} backLabel="Listado maestro" />
                <Card>
                    {failure === 'missing'
                        ? <EmptyState title="Documento no encontrado" description="No existe o no tienes acceso a él." />
                        : <EmptyState title="No se pudo cargar el documento" action={<Button variant="outline" size="sm" onClick={refresh}>Reintentar</Button>} />}
                </Card>
            </PageContainer>
        );
    }

    // A previous document stays in state while another one loads.
    const doc = loaded?.id === id ? loaded : null;
    if (!doc) return <PageContainer><LoadingBlock label="Cargando documento…" /></PageContainer>;

    const current = doc.versions.find((v) => v.status === 'Approved');
    const hasOpenVersion = doc.versions.some((v) => v.status === 'Draft' || v.status === 'InReview');
    const staleLink = !!linkedVersion && linkedVersion !== current?.id && !doc.versions.some((v) => v.id === linkedVersion && v.status !== 'Obsolete');
    const confirmedCount = reads?.filter((r) => r.confirmedAt).length ?? 0;

    return (
        <PageContainer>
            <PageHeader
                icon={<FileText className="shrink-0 text-primary" size={24} aria-hidden="true" />}
                title={`${doc.code} · ${doc.title}`}
                backTo={ROUTES.DOCUMENTS}
                backLabel="Listado maestro"
                actions={<>
                    {canCreate && !hasOpenVersion && <Button icon={Upload} onClick={() => setVersionForm(null)}>Subir versión</Button>}
                    {canDistribute && current && <Button variant="outline" icon={Share2} onClick={() => setDistributing(true)}>Distribuir</Button>}
                </>}
            />

            {staleLink && (
                <Card className="mb-4 border-orange-200 dark:border-orange-500/30">
                    <p role="status" className="text-sm text-slate-800 dark:text-slate-100">
                        La versión de este enlace ya no está vigente{current ? `. La vigente es la ${current.versionNumber}.` : '.'}
                    </p>
                </Card>
            )}

            <Card className="mb-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Fact label="Tipo">{doc.type}</Fact>
                    <Fact label="Proceso">{doc.process}</Fact>
                    <Fact label="Responsable">{doc.ownerName ?? '—'}</Fact>
                    <Fact label="Fecha de revisión">{formatDate(doc.reviewDate)}</Fact>
                    <Fact label="Serie">{seriesLabel(doc) || 'Sin clasificar'}</Fact>
                    {doc.classificationNodeId && (
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Fact label="Retención">
                                {retentionText(doc.retention) ?? 'Sin retención definida'}
                                {doc.retention?.inherited && <Badge className="ml-2">Heredada de la serie</Badge>}
                            </Fact>
                        </div>
                    )}
                </dl>
            </Card>

            <Card padding="none" className="mb-4 overflow-hidden">
                <h2 className="border-b border-slate-200 px-4 py-3 text-lg leading-7 font-bold text-slate-900 sm:px-5 dark:border-border-dark dark:text-white">Versiones</h2>
                {doc.versions.length === 0 ? (
                    <EmptyState title="Aún no hay versiones" description={canCreate ? 'Sube la primera para enviarla a revisión.' : undefined} />
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-border-dark">
                        {doc.versions.map((v) => {
                            const [label, variant] = STATUS[v.status];
                            return (
                                <li
                                    key={v.id}
                                    aria-current={v.id === linkedVersion ? 'true' : undefined}
                                    className={`relative flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between ${v.id === linkedVersion ? 'bg-primary/5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary' : ''}`}
                                >
                                    <div className="min-w-0 flex-1 space-y-1 break-words text-sm">
                                        <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                            Versión {v.versionNumber} <Badge variant={variant}>{label}</Badge>
                                        </p>
                                        <p className="text-slate-700 dark:text-slate-200">{v.changeSummary}</p>
                                        <p className="text-[13px] leading-[18px] text-slate-500 dark:text-slate-400">
                                            {v.fileName} · {formatSize(v.sizeBytes)} · Elaboró {v.elaboratedByName ?? '—'}, {formatDateTime(asUtc(v.createdAt))}
                                        </p>
                                        {v.approvedAt && (
                                            <p className="text-[13px] leading-[18px] text-slate-500 dark:text-slate-400">Aprobó {v.approvedByName ?? '—'}, {formatDateTime(asUtc(v.approvedAt))}</p>
                                        )}
                                        {v.rejectionComment && (
                                            <p className="text-[13px] leading-[18px] text-rose-700 dark:text-rose-400">
                                                Rechazó {v.rejectedByName ?? '—'}{v.rejectedAt ? `, ${formatDateTime(asUtc(v.rejectedAt))}` : ''}: {v.rejectionComment}
                                            </p>
                                        )}
                                    </div>
                                    {/* Primary actions first in the DOM: on top on mobile and leftmost on desktop, so visual order matches focus order. */}
                                    <div className="grid shrink-0 grid-cols-2 gap-2 [&>*]:w-full [&>*:first-child]:col-span-2 [&>*:last-child:nth-child(even)]:col-span-2 sm:flex sm:flex-wrap sm:[&>*]:w-auto lg:justify-end">
                                        {canCreate && v.status === 'Draft' && (
                                            <Button size="sm" icon={Send} isLoading={busy === `submit-${v.id}`} onClick={() => act(`submit-${v.id}`, () => documentsService.submit(id, v.id), 'Versión enviada a revisión')}>
                                                Enviar a revisión
                                            </Button>
                                        )}
                                        {canApprove && !impersonating && v.status === 'InReview' && <>
                                            {v.elaboratedByUserId !== user?.id && (
                                                <Button variant="success" size="sm" icon={CheckCircle2} aria-label={`Aprobar v${v.versionNumber}`} isLoading={busy === `approve-${v.id}`} onClick={() => approve(v)}>
                                                    Aprobar
                                                </Button>
                                            )}
                                            <Button variant="danger" size="sm" icon={XCircle} aria-label={`Rechazar v${v.versionNumber}`} onClick={() => { setComment(''); setRejecting(v); }}>
                                                Rechazar
                                            </Button>
                                        </>}
                                        {!impersonating && pending?.versionId === v.id && (
                                            <Button size="sm" icon={CheckCircle2} isLoading={busy === 'read'} onClick={() => act('read', () => documentsService.confirmRead(id, v.id), 'Lectura confirmada')}>
                                                Confirmar lectura
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" icon={Download} aria-label={`Descargar v${v.versionNumber}`} isLoading={busy === `file-${v.id}`} onClick={() => download(v)}>
                                            Descargar
                                        </Button>
                                        {canCreate && v.status === 'Draft' && (
                                            <Button variant="outline" size="sm" icon={Pencil} aria-label={`Corregir v${v.versionNumber}`} onClick={() => setVersionForm(v)}>Corregir</Button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            {canDistribute && (
                <Card padding="none" className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-border-dark">
                        <h2 className="text-lg leading-7 font-bold text-slate-900 dark:text-white">Lecturas</h2>
                        {!!reads?.length && <span className="text-sm text-slate-500 dark:text-slate-400">{confirmedCount} de {reads.length} confirmaron</span>}
                    </div>
                    {readsFailed ? (
                        <EmptyState title="No se pudieron cargar las lecturas" />
                    ) : !reads ? (
                        <LoadingBlock label="Cargando lecturas…" />
                    ) : reads.length === 0 ? (
                        <EmptyState title="Sin destinatarios" description={current ? 'Distribuye el documento para pedir su lectura.' : 'Se cuentan sobre la versión vigente.'} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={TABLE_CLASS}>
                                <thead className={THEAD_CLASS}>
                                    <tr><th className={TH_CLASS}>Destinatario</th><th className={TH_CLASS}>Confirmó</th></tr>
                                </thead>
                                <tbody className={TBODY_CLASS}>
                                    {reads.map((r) => (
                                        <tr key={r.userId} className={TR_CLASS}>
                                            <td className={TD_CLASS}>{r.userName}</td>
                                            <td className={TD_CLASS}>{r.confirmedAt ? formatDateTime(asUtc(r.confirmedAt)) : <Badge variant="warning">Pendiente</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {versionForm !== undefined && (
                <VersionFormDialog
                    documentId={id}
                    version={versionForm}
                    onClose={() => setVersionForm(undefined)}
                    onSaved={() => { setVersionForm(undefined); refresh(); }}
                />
            )}

            {distributing && (
                <DistributeDialog documentId={id} onClose={() => setDistributing(false)} onSaved={() => { setDistributing(false); refresh(); }} />
            )}

            <Modal
                isOpen={!!rejecting}
                onClose={() => setRejecting(null)}
                onSubmit={reject}
                title={`Rechazar versión ${rejecting?.versionNumber ?? ''}`}
                footer={<>
                    <Button type="submit" variant="danger" isLoading={busy === 'reject'}>Rechazar</Button>
                    <Button variant="ghost" onClick={() => setRejecting(null)}>Cancelar</Button>
                </>}
            >
                <Textarea label="Comentario" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} required />
            </Modal>
        </PageContainer>
    );
};
