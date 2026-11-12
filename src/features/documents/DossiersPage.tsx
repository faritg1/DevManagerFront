import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, Download, Pencil, Plus } from 'lucide-react';
import { documentsService, type DossierFilter, type DossierListItem, type DossierStatus } from '../../shared/api';
import { dossierDetailPath } from '../../shared/config/constants';
import { exportToCsv, type CsvColumn } from '../../shared/export';
import { today } from '../../shared/format';
import { usePermission } from '../../shared/hooks';
import {
    Badge, Button, Card, EmptyState, IconButton, Input, PageContainer, PageHeader, Select, SkeletonRows,
    TABLE_CLASS, TBODY_CLASS, TD_ACTIONS_CLASS, TD_CLASS, THEAD_CLASS, TH_ACTIONS_CLASS, TH_CLASS, TR_CLASS,
} from '../../shared/ui';
import { DossierFormDialog } from './components/DossierFormDialog';
import {
    CODE_LINK_CLASS, DISPOSITION, DOSSIER_STAGE, DOSSIER_STATUS, PERMISSIONS,
    dossierNodeLabel, dossierSection, dossierSeries, dossierSubseries, seriesOptions, shortDate, stageText,
} from './labels';
import { loadClassification, useRows } from './useRows';

// Tighter cells so the table fits beside the sidebar at 1280 px; long text is cut with "…" (full value in `title`).
const TD = `${TD_CLASS} md:!px-3 md:first:!pl-5 md:last:!pr-5`;
const TH = `${TH_CLASS} !px-3 first:!pl-5 last:!pr-5`;

/** Inventory of dossiers: an internal report over the filtered list. */
const INVENTORY_COLUMNS: CsvColumn<DossierListItem>[] = [
    { header: 'Código', value: (d) => d.code },
    { header: 'Título', value: (d) => d.title },
    { header: 'Sección', value: dossierSection },
    { header: 'Serie', value: dossierSeries },
    { header: 'Subserie', value: dossierSubseries },
    { header: 'Fecha inicial', value: (d) => shortDate(d.firstDocumentDate) },
    { header: 'Fecha final', value: (d) => shortDate(d.lastDocumentDate) },
    { header: 'Documentos', value: (d) => d.itemCount },
    { header: 'Estado', value: (d) => DOSSIER_STATUS[d.status][0] },
    { header: 'Etapa', value: (d) => (d.stage ? DOSSIER_STAGE[d.stage] : '') },
    { header: 'Ubicación física', value: (d) => d.physicalLocation },
    { header: 'Gestión hasta', value: (d) => shortDate(d.managementUntil) },
    { header: 'Central hasta', value: (d) => shortDate(d.centralUntil) },
    { header: 'Disposición', value: (d) => (d.finalDisposition ? DISPOSITION[d.finalDisposition] : '') },
];

const EMPTY = { q: '', series: '', status: '' };

const toQuery = (f: typeof EMPTY): DossierFilter => ({
    q: f.q.trim() || undefined,
    series: f.series || undefined,
    status: (f.status as DossierStatus) || undefined,
});

/** The organization's dossiers: the API filters them, and whoever has the permission sees them all. */
export const DossiersPage: React.FC = () => {
    const { has } = usePermission();
    const canManage = has(PERMISSIONS.DOSSIERS_MANAGE);
    // `?estado=` opens the list already filtered: the card of the module home links here.
    const [search] = useSearchParams();
    const [filters, setFilters] = useState(() => ({ ...EMPTY, status: search.get('estado') ?? '' }));
    // The series come from the chart, which the dossiers permission also reads.
    const series = seriesOptions(useRows(loadClassification, true) ?? []);
    const [rows, setRows] = useState<DossierListItem[] | null>(null);
    const [failed, setFailed] = useState(false);
    // undefined closed, null new, a row to edit it.
    const [editing, setEditing] = useState<DossierListItem | null | undefined>(undefined);
    const [reload, setReload] = useState(0);

    const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { value } = e.target;
        setFilters((f) => ({ ...f, [key]: value }));
    };

    useEffect(() => {
        let live = true;
        // Debounced: the search is typed
        const id = setTimeout(() => {
            setRows(null);
            setFailed(false);
            documentsService.dossiers(toQuery(filters)).then(
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
                icon={<Archive className="shrink-0 text-primary" size={24} aria-hidden="true" />}
                title="Expedientes"
                description="Los documentos de cada trámite agrupados por serie, con su estado y sus fechas de retención."
                actions={<>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={Download}
                        disabled={!rows?.length}
                        onClick={() => exportToCsv(rows ?? [], INVENTORY_COLUMNS, `inventario-expedientes-${today()}`)}
                    >
                        Inventario de expedientes
                    </Button>
                    {canManage && <Button icon={Plus} onClick={() => setEditing(null)}>Nuevo expediente</Button>}
                </>}
            />

            <Card padding="none" className="overflow-hidden">
                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-border-dark">
                    <Input label="Buscar" value={filters.q} onChange={set('q')} placeholder="Código o título" />
                    <Select label="Serie" value={filters.series} onChange={set('series')}>
                        <option value="">Todas las series</option>
                        {series.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </Select>
                    <Select label="Estado" value={filters.status} onChange={set('status')}>
                        <option value="">Todos los estados</option>
                        {Object.entries(DOSSIER_STATUS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
                    </Select>
                </div>

                {failed ? (
                    <EmptyState title="No se pudieron cargar los expedientes" />
                ) : !rows ? (
                    <SkeletonRows />
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon={Archive}
                        title={filtered ? 'Sin expedientes con este filtro' : 'Aún no hay expedientes'}
                        description={filtered ? 'Prueba con otro código, título, serie o estado.' : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH}>Código</th>
                                    <th className={TH}>Título y serie</th>
                                    <th className={TH}>Responsable</th>
                                    <th className={`${TH} text-right`}>Documentos</th>
                                    <th className={`${TH} whitespace-normal`}>Estado y etapa</th>
                                    {canManage && <th className={`${TH_ACTIONS_CLASS} !px-3 last:!pr-5`}>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className={TBODY_CLASS}>
                                {rows.map((d) => (
                                    <tr key={d.id} className={TR_CLASS}>
                                        <td className={TD}>
                                            <Link className={CODE_LINK_CLASS} to={dossierDetailPath(d.id)}>{d.code}</Link>
                                        </td>
                                        {/* Title and series share a two-line cell, and so do status and stage: the table fits at 1280 px. */}
                                        <td className={TD}>
                                            <span className="block md:max-w-[15rem] md:truncate 2xl:max-w-[24rem]" title={d.title}>{d.title}</span>
                                            <span className="block text-xs text-slate-600 md:max-w-[15rem] md:truncate 2xl:max-w-[24rem] dark:text-slate-400" title={dossierNodeLabel(d)}>{dossierNodeLabel(d)}</span>
                                        </td>
                                        <td className={TD}><span className="block max-w-[7rem] truncate 2xl:max-w-[12rem]" title={d.ownerName ?? undefined}>{d.ownerName ?? '—'}</span></td>
                                        <td className={`${TD} text-right tabular-nums`}>{d.itemCount}</td>
                                        <td className={`${TD} whitespace-normal`}>
                                            <Badge variant={DOSSIER_STATUS[d.status][1]}>{DOSSIER_STATUS[d.status][0]}</Badge>
                                            {d.stage && <span className="mt-1 block min-w-[8rem] max-w-[11rem] text-xs text-slate-600 dark:text-slate-400">{stageText(d)}</span>}
                                        </td>
                                        {canManage && (
                                            <td className={`${TD} text-right ${TD_ACTIONS_CLASS}`}>
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
                <DossierFormDialog
                    dossier={editing}
                    onClose={() => setEditing(undefined)}
                    onSaved={() => { setEditing(undefined); setReload((n) => n + 1); }}
                />
            )}
        </PageContainer>
    );
};
