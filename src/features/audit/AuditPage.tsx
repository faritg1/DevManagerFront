import React, { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Download, History } from 'lucide-react';
import {
    auditService, platformService, usersService,
    type ChangeLogAction, type ChangeLogEntry, type ChangeLogFilter, type ChangeLogPage, type PlatformOrganization,
} from '../../shared/api';
import { exportToCsv, type CsvColumn } from '../../shared/export';
import { asUtc, formatDateTime, today } from '../../shared/format';
import { usePermission, type PagedFilter } from '../../shared/hooks';
import {
    Badge, Button, Card, EmptyState, Input, LoadingBlock, PageContainer, PageHeader, Pager, Select,
    TABLE_CLASS, TBODY_CLASS, TD_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS, type BadgeVariant,
} from '../../shared/ui';

/** Backend AuditService.EntityNames (class name → Spanish label), for the entity filter. */
const ENTITY_TYPES: Record<string, string> = {
    Organization: 'Organización', User: 'Usuario', Role: 'Rol', UserRole: 'Rol de usuario',
    Permission: 'Permiso', RolePermission: 'Permiso de rol', UserPermission: 'Permiso de usuario',
    Associate: 'Asociado', MembershipPeriod: 'Periodo de vinculación', DataPolicyVersion: 'Política de datos',
    DataConsent: 'Consentimiento', EducationProgram: 'Programa educativo', EducationEnrollment: 'Inscripción',
    ArcoRequest: 'Solicitud ARCO', AssociateCompetency: 'Competencia', GoverningBody: 'Órgano',
    GoverningBodyMember: 'Miembro de órgano', GoverningBodyMinutes: 'Acta', GeneralAssembly: 'Asamblea',
    AssemblyVote: 'Votación', SurplusDistribution: 'Distribución de excedentes', Compensation: 'Compensación',
    PilaContribution: 'Aporte PILA', WelfareProgram: 'Programa de bienestar', WelfareRequest: 'Solicitud de bienestar',
    SolidarityFund: 'Fondo de solidaridad', WelfareAid: 'Auxilio', MedicalExam: 'Examen médico',
    WorkAccident: 'Accidente de trabajo', OccupationalRisk: 'Riesgo laboral', SupersolidariaReport: 'Reporte Supersolidaria',
    Certification: 'Certificación', EmployeeProfile: 'Perfil de empleado', EmployeeSkill: 'Habilidad de empleado',
    Skill: 'Habilidad', SkillEvaluation: 'Evaluación de habilidad', Project: 'Proyecto',
    ProjectApplication: 'Postulación', ProjectAssignment: 'Asignación', ProjectParticipation: 'Participación',
    ProjectRole: 'Rol de proyecto', ProjectSkillRequirement: 'Requisito de habilidad', RecommendationRule: 'Regla de recomendación',
    AgentAction: 'Acción del agente', AgentConfiguration: 'Configuración del agente',
};
const ENTITY_OPTIONS = Object.entries(ENTITY_TYPES).sort(([, a], [, b]) => a.localeCompare(b, 'es'));

const ACTIONS: Record<ChangeLogAction, [string, BadgeVariant]> = {
    Created: ['Creado', 'success'],
    Updated: ['Actualizado', 'info'],
    Deleted: ['Eliminado', 'danger'],
};
const actionLabel = (a: string) => ACTIONS[a as ChangeLogAction]?.[0] ?? a;

const DAY_MS = 86_400_000;
/** A yyyy-MM-dd input as the UTC instant its day starts in Colombia (UTC-5, no DST). */
const colombiaDayStart = (d: string) => new Date(`${d}T00:00:00-05:00`).getTime();

interface Filters { entityType: string; actorId: string; entityId: string; from: string; to: string; organizationId: string }
const EMPTY: Filters = { entityType: '', actorId: '', entityId: '', from: '', to: '', organizationId: '' };

const toQuery = (f: Filters, page: number): ChangeLogFilter => ({
    entityType: f.entityType || undefined,
    actorId: f.actorId || undefined,
    entityId: f.entityId.trim() || undefined,
    from: f.from ? new Date(colombiaDayStart(f.from)).toISOString() : undefined,
    // The API's `to` is exclusive: the start of the next Colombian day includes the whole chosen day.
    to: f.to ? new Date(colombiaDayStart(f.to) + DAY_MS).toISOString() : undefined,
    organizationId: f.organizationId || undefined,
    page,
});

const diffText = (e: ChangeLogEntry) => e.changes.map((c) => `${c.field}: ${c.old ?? '—'} → ${c.new ?? '—'}`).join(' | ');

const EXPORT_COLUMNS: CsvColumn<ChangeLogEntry>[] = [
    { header: 'Fecha', value: (e) => formatDateTime(asUtc(e.createdAt)) },
    { header: 'Quién', value: (e) => e.actorName },
    { header: 'Suplantado por', value: (e) => e.impersonatorName },
    { header: 'Acción', value: (e) => actionLabel(e.action) },
    { header: 'Entidad', value: (e) => e.entityTypeName },
    { header: 'Registro', value: (e) => e.entityId },
    { header: 'Cambios', value: diffText },
];

// ponytail: export walks the API pages (20 rows each) up to 1000 rows; add a server-side export if audits grow past that.
const EXPORT_MAX_PAGES = 50;

/** General change history of the organization (any org for the super admin): who created, changed or deleted what. */
export const AuditPage: React.FC = () => {
    const { isSuperAdmin } = usePermission();
    const [filters, setFilters] = useState<Filters>(EMPTY);
    const [page, setPage] = useState(1);
    const [data, setData] = useState<ChangeLogPage | null>(null);
    const [failed, setFailed] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
    const [actors, setActors] = useState<{ id: string; fullName: string }[]>([]);
    const [exporting, setExporting] = useState(false);

    const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        // Another organization has other users: the actor filter no longer applies.
        setFilters((f) => ({ ...f, [key]: value, ...(key === 'organizationId' ? { actorId: '' } : {}) }));
        setPage(1);
    };

    useEffect(() => {
        if (isSuperAdmin) platformService.listOrganizations().then((r) => setOrganizations(r.data ?? []), () => setOrganizations([]));
    }, [isSuperAdmin]);

    useEffect(() => {
        const load = filters.organizationId ? platformService.listUsers(filters.organizationId) : usersService.getAll();
        load.then((r) => setActors(r.data ?? []), () => setActors([]));
    }, [filters.organizationId]);

    useEffect(() => {
        setFailed(false);
        // Debounced: the entity id is typed
        const id = setTimeout(() => {
            setData(null);
            auditService.getChanges(toQuery(filters, page)).then((r) => setData(r.data), () => setFailed(true));
        }, 300);
        return () => clearTimeout(id);
    }, [filters, page]);

    const toggle = (id: string) => setExpanded((s) => {
        const next = new Set(s);
        if (!next.delete(id)) next.add(id);
        return next;
    });

    const exportAll = async () => {
        setExporting(true);
        try {
            const rows: ChangeLogEntry[] = [];
            for (let p = 1; p <= EXPORT_MAX_PAGES; p++) {
                const { data: chunk } = await auditService.getChanges(toQuery(filters, p));
                rows.push(...(chunk?.items ?? []));
                if (!chunk || rows.length >= chunk.total || chunk.items.length === 0) break;
            }
            exportToCsv(rows, EXPORT_COLUMNS, `auditoria-${today()}`);
        } catch {
            // el listener global muestra el error
        } finally {
            setExporting(false);
        }
    };

    const pager: PagedFilter<unknown> | null = data && {
        query: '',
        setQuery: () => {},
        page: data.page,
        setPage,
        pageItems: data.items,
        filtered: data.items,
        total: data.total,
        pageCount: Math.max(1, Math.ceil(data.total / data.pageSize)),
        pageSize: data.pageSize,
    };

    return (
        <PageContainer>
            <PageHeader
                icon={<History className="text-primary" size={26} aria-hidden="true" />}
                title="Auditoría"
                description="Quién creó, modificó o eliminó cada registro y cuándo, del más reciente al más antiguo."
                actions={
                    <Button variant="outline" size="sm" icon={Download} isLoading={exporting} disabled={!data?.total || exporting} onClick={exportAll}>
                        Exportar
                    </Button>
                }
            />

            <Card padding="none" className="overflow-hidden">
                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-border-dark">
                    {isSuperAdmin && (
                        <Select label="Organización" value={filters.organizationId} onChange={set('organizationId')}>
                            <option value="">Mi organización</option>
                            {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </Select>
                    )}
                    <Select label="Entidad" value={filters.entityType} onChange={set('entityType')}>
                        <option value="">Todas las entidades</option>
                        {ENTITY_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    <Select label="Quién" value={filters.actorId} onChange={set('actorId')}>
                        <option value="">Todos los usuarios</option>
                        {actors.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </Select>
                    <Input label="Id del registro" value={filters.entityId} onChange={set('entityId')} placeholder="Id exacto" />
                    <Input label="Desde" type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} />
                    <Input label="Hasta" type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} />
                </div>

                {failed ? (
                    <EmptyState title="No se pudo cargar el historial de cambios" />
                ) : !data || !pager ? (
                    <LoadingBlock label="Cargando historial…" />
                ) : data.total === 0 ? (
                    <EmptyState icon={History} title="Sin cambios con este filtro" description="Prueba con otras fechas, entidad o usuario." />
                ) : (<>
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH_CLASS}>Fecha</th>
                                    <th className={TH_CLASS}>Quién</th>
                                    <th className={TH_CLASS}>Acción</th>
                                    <th className={TH_CLASS}>Entidad</th>
                                    <th className={TH_CLASS}>Registro</th>
                                    <th className={TH_CLASS}>Cambios</th>
                                </tr>
                            </thead>
                            <tbody className={TBODY_CLASS}>
                                {data.items.map((e) => {
                                    const open = expanded.has(e.id);
                                    const [label, variant] = ACTIONS[e.action] ?? [e.action, 'default'];
                                    return (
                                        <Fragment key={e.id}>
                                            <tr className={TR_CLASS}>
                                                <td className={TD_CLASS}>{formatDateTime(asUtc(e.createdAt))}</td>
                                                <td className={TD_CLASS}>
                                                    {e.actorName}
                                                    {e.impersonatorUserId && (
                                                        <span className="mt-1 block"><Badge variant="warning">vía suplantación por {e.impersonatorName}</Badge></span>
                                                    )}
                                                </td>
                                                <td className={TD_CLASS}><Badge variant={variant}>{label}</Badge></td>
                                                <td className={TD_CLASS}>{e.entityTypeName}</td>
                                                <td className={`${TD_CLASS} font-mono text-xs`} title={e.entityId}>{e.entityId.slice(0, 8)}</td>
                                                <td className={TD_CLASS}>
                                                    {e.changes.length === 0 ? (
                                                        <span className="text-slate-500 dark:text-slate-400">—</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle(e.id)}
                                                            aria-expanded={open}
                                                            aria-controls={`diff-${e.id}`}
                                                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                                        >
                                                            {open ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                                                            {open ? 'Ocultar' : 'Ver'} {e.changes.length} {e.changes.length === 1 ? 'campo' : 'campos'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {open && (
                                                <tr id={`diff-${e.id}`}>
                                                    <td colSpan={6} className={`${TD_CLASS} bg-slate-50 whitespace-normal dark:bg-white/5`}>
                                                        <ul className="space-y-1 text-sm">
                                                            {e.changes.map((c) => (
                                                                <li key={c.field} className="break-words">
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{c.field}</span>:{' '}
                                                                    <span className="text-rose-700 line-through dark:text-rose-400">{c.old ?? '—'}</span>
                                                                    {' → '}
                                                                    <span className="text-emerald-700 dark:text-emerald-400">{c.new ?? '—'}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pager pager={pager} />
                </>)}
            </Card>
        </PageContainer>
    );
};
