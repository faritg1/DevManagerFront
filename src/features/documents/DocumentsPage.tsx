import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Pencil, Plus } from 'lucide-react';
import {
    documentsService, type DocumentFilter, type DocumentListItem, type DocumentVersionStatus, type PendingRead,
} from '../../shared/api';
import { documentDetailPath } from '../../shared/config/constants';
import { type CsvColumn } from '../../shared/export';
import { asUtc, formatDate, formatDateTime } from '../../shared/format';
import { usePermission } from '../../shared/hooks';
import {
    Badge, Button, Card, EmptyState, ExportButton, IconButton, Input, LoadingBlock, PageContainer, PageHeader, Select,
    TABLE_CLASS, TBODY_CLASS, TD_CLASS, TD_TRUNCATE_CLASS, THEAD_CLASS, TH_ACTIONS_CLASS, TH_CLASS, TR_CLASS,
} from '../../shared/ui';
import { DocumentFormDialog } from './components/DocumentFormDialog';
import { PERMISSIONS, STATUS } from './labels';

const currentLabel = (d: DocumentListItem) => (d.currentVersionNumber == null ? '' : `v${d.currentVersionNumber}`);

const EXPORT_COLUMNS: CsvColumn<DocumentListItem>[] = [
    { header: 'Código', value: (d) => d.code },
    { header: 'Título', value: (d) => d.title },
    { header: 'Tipo', value: (d) => d.type },
    { header: 'Proceso', value: (d) => d.process },
    { header: 'Responsable', value: (d) => d.ownerName },
    { header: 'Versión vigente', value: currentLabel },
    { header: 'Fecha de aprobación', value: (d) => (d.approvedAt ? formatDateTime(asUtc(d.approvedAt)) : '') },
    { header: 'Aprobador', value: (d) => d.approvedByName },
    { header: 'Versión en curso', value: (d) => (d.openVersionStatus ? STATUS[d.openVersionStatus][0] : '') },
    { header: 'Fecha de revisión', value: (d) => (d.reviewDate ? formatDate(d.reviewDate) : '') },
];

const EMPTY = { q: '', type: '', process: '', status: '' };

const toQuery = (f: typeof EMPTY): DocumentFilter => ({
    q: f.q.trim() || undefined,
    type: f.type.trim() || undefined,
    process: f.process.trim() || undefined,
    status: (f.status as DocumentVersionStatus) || undefined,
});

/** Master list of the organization's documents: the API filters it and applies what the user may see. */
export const DocumentsPage: React.FC = () => {
    const { has } = usePermission();
    const canCreate = has(PERMISSIONS.CREATE);
    const [filters, setFilters] = useState(EMPTY);
    const [rows, setRows] = useState<DocumentListItem[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [pending, setPending] = useState<PendingRead[]>([]);
    // undefined closed, null new, a row to edit it.
    const [editing, setEditing] = useState<DocumentListItem | null | undefined>(undefined);
    const [reload, setReload] = useState(0);

    const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { value } = e.target;
        setFilters((f) => ({ ...f, [key]: value }));
    };

    useEffect(() => {
        documentsService.pendingReads().then((r) => setPending(r.data ?? []), () => setPending([]));
    }, []);

    useEffect(() => {
        let live = true;
        // Debounced: three of the filters are typed
        const id = setTimeout(() => {
            setRows(null);
            setFailed(false);
            documentsService.list(toQuery(filters)).then(
                (r) => { if (live) setRows(r.data ?? []); },
                () => { if (live) setFailed(true); },
            );
        }, 300);
        return () => { live = false; clearTimeout(id); };
    }, [filters, reload]);

    const filtered = Object.values(filters).some(Boolean);

    return (
        <PageContainer>
            <PageHeader
                icon={<FolderOpen className="text-primary" size={26} aria-hidden="true" />}
                title="Documentos"
                description="Listado maestro: versión vigente, quién la aprobó y qué está en curso."
                actions={<>
                    <ExportButton rows={rows ?? []} columns={EXPORT_COLUMNS} filename="documentos" />
                    {canCreate && <Button size="sm" icon={Plus} onClick={() => setEditing(null)}>Nuevo documento</Button>}
                </>}
            />

            {pending.length > 0 && (
                <Card className="mb-4 border-orange-200 dark:border-orange-500/30">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                        Tienes {pending.length} {pending.length === 1 ? 'documento' : 'documentos'} por confirmar
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                        {pending.map((p) => (
                            <li key={p.versionId} className="break-words">
                                <Link className="text-primary hover:underline" to={`${documentDetailPath(p.documentId)}?version=${p.versionId}`}>
                                    {p.code} v{p.versionNumber}: {p.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <Card padding="none" className="overflow-hidden">
                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-border-dark">
                    <Input label="Buscar" value={filters.q} onChange={set('q')} placeholder="Código o título" />
                    <Input label="Tipo" value={filters.type} onChange={set('type')} />
                    <Input label="Proceso" value={filters.process} onChange={set('process')} />
                    <Select label="Estado" value={filters.status} onChange={set('status')}>
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
                    </Select>
                </div>

                {failed ? (
                    <EmptyState title="No se pudieron cargar los documentos" />
                ) : !rows ? (
                    <LoadingBlock label="Cargando documentos…" />
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon={FolderOpen}
                        title={filtered ? 'Sin documentos con este filtro' : 'Aún no hay documentos'}
                        description={filtered ? 'Prueba con otro código, tipo, proceso o estado.' : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH_CLASS}>Código</th>
                                    <th className={TH_CLASS}>Título</th>
                                    <th className={TH_CLASS}>Tipo</th>
                                    <th className={TH_CLASS}>Proceso</th>
                                    <th className={TH_CLASS}>Responsable</th>
                                    <th className={TH_CLASS}>Vigente</th>
                                    <th className={TH_CLASS}>Aprobación</th>
                                    <th className={TH_CLASS}>En curso</th>
                                    {canCreate && <th className={TH_ACTIONS_CLASS}>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className={TBODY_CLASS}>
                                {rows.map((d) => (
                                    <tr key={d.id} className={TR_CLASS}>
                                        <td className={TD_CLASS}>
                                            <Link className="font-semibold text-primary hover:underline" to={documentDetailPath(d.id)}>{d.code}</Link>
                                        </td>
                                        <td className={TD_CLASS}><span className={TD_TRUNCATE_CLASS} title={d.title}>{d.title}</span></td>
                                        <td className={TD_CLASS}><span className={TD_TRUNCATE_CLASS} title={d.type}>{d.type}</span></td>
                                        <td className={TD_CLASS}><span className={TD_TRUNCATE_CLASS} title={d.process}>{d.process}</span></td>
                                        <td className={TD_CLASS}>{d.ownerName ?? '—'}</td>
                                        <td className={TD_CLASS}>{currentLabel(d) || '—'}</td>
                                        <td className={TD_CLASS}>
                                            {d.approvedAt ? <>{formatDate(asUtc(d.approvedAt))}<span className="block text-xs text-slate-500 dark:text-slate-400">{d.approvedByName}</span></> : '—'}
                                        </td>
                                        <td className={TD_CLASS}>
                                            {d.openVersionStatus ? <Badge variant={STATUS[d.openVersionStatus][1]}>{STATUS[d.openVersionStatus][0]}</Badge> : '—'}
                                        </td>
                                        {canCreate && (
                                            <td className={`${TD_CLASS} text-right`}>
                                                <IconButton icon={Pencil} label={`Editar ${d.code}`} onClick={() => setEditing(d)} />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {editing !== undefined && (
                <DocumentFormDialog
                    document={editing}
                    onClose={() => setEditing(undefined)}
                    onSaved={() => { setEditing(undefined); setReload((n) => n + 1); }}
                />
            )}
        </PageContainer>
    );
};
