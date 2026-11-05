import React, { useEffect, useState } from 'react';
import { Clock, Download } from 'lucide-react';
import { projectsService, workItemsService, type ProjectResponse, type TimeReportResponse, type TimeReportTotal } from '../../shared/api';
import { formatDate, formatNumber, today } from '../../shared/format';
import { usePermission } from '../../shared/hooks';
import {
    Button, Card, EmptyState, Input, LoadingBlock, PageContainer, PageHeader, Select,
    TABLE_CLASS, TBODY_CLASS, TD_CLASS, TD_TRUNCATE_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS,
} from '../../shared/ui';

const TotalsCard: React.FC<{ title: string; rows: TimeReportTotal[] }> = ({ title, rows }) => (
    <Card padding="none">
        <table className={TABLE_CLASS} aria-label={title}>
            <thead className={THEAD_CLASS}>
                <tr><th className={TH_CLASS}>{title}</th><th className={`${TH_CLASS} text-right`}>Horas</th></tr>
            </thead>
            <tbody className={TBODY_CLASS}>
                {rows.map((t) => (
                    <tr key={t.id} className={TR_CLASS}>
                        <td className={TD_CLASS}>{t.name}</td>
                        <td className={`${TD_CLASS} text-right font-semibold`}>{formatNumber(t.hours, 2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Card>
);

/** Hours logged per date, person and project; with the reports permission (or admin) every member's, otherwise the caller's own. */
export const TimeReportPage: React.FC = () => {
    const { has, isAdmin } = usePermission();
    const canSeeAll = isAdmin || has('menu.platform.activities.reports');
    const [from, setFrom] = useState(() => `${today().slice(0, 8)}01`);
    const [to, setTo] = useState(today);
    const [projectId, setProjectId] = useState('');
    const [userId, setUserId] = useState('');
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    /** People seen in the last report without a person filter: the options of that filter. */
    const [people, setPeople] = useState<TimeReportTotal[]>([]);
    /** undefined = loading, null = failed. */
    const [report, setReport] = useState<TimeReportResponse | null | undefined>(undefined);
    const [exporting, setExporting] = useState(false);

    const query = { from, to, projectId: projectId || undefined, userId: userId || undefined };

    useEffect(() => {
        projectsService.getAll().then((r) => setProjects(r.data ?? []), () => setProjects([]));
    }, []);

    const load = () => {
        if (!from || !to) return;
        setReport(undefined);
        workItemsService.timeReport(query).then((r) => {
            setReport(r.data);
            if (!userId) setPeople(r.data.byUser);
        }, () => setReport(null));
    };
    useEffect(load, [from, to, projectId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const exportCsv = async () => {
        setExporting(true);
        try {
            const url = URL.createObjectURL(await workItemsService.exportTimeReport(query));
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-horas-${from}-${to}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch { /* the API error already raised the global toast */ } finally {
            setExporting(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                icon={<Clock size={28} className="text-primary" />}
                title="Reporte de horas"
                description={canSeeAll ? 'Horas registradas por persona y proyecto en el rango de fechas.' : 'Tus horas registradas por proyecto en el rango de fechas.'}
                actions={<Button variant="outline" icon={Download} isLoading={exporting} disabled={!report?.entries.length} onClick={exportCsv}>Exportar CSV</Button>}
            />

            <Card className="mb-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Input label="Desde" type="date" required max={to || undefined} value={from} onChange={(e) => setFrom(e.target.value)} />
                    <Input label="Hasta" type="date" required min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} />
                    <Select label="Proyecto" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                        <option value="">Todos los proyectos</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                    {canSeeAll && (
                        <Select label="Persona" value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="">Todas las personas</option>
                            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    )}
                </div>
            </Card>

            {report === undefined ? (
                <LoadingBlock label="Cargando horas…" />
            ) : report === null ? (
                <EmptyState title="No se pudo cargar el reporte" action={<Button variant="outline" onClick={load}>Reintentar</Button>} />
            ) : report.entries.length === 0 ? (
                <EmptyState icon={Clock} title="No hay horas registradas en este rango" description="Prueba con otras fechas o filtros." />
            ) : (<>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                    Total: <strong data-testid="time-report-total">{formatNumber(report.totalHours, 2)} h</strong>
                </p>
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                    {canSeeAll && <TotalsCard title="Por persona" rows={report.byUser} />}
                    <TotalsCard title="Por proyecto" rows={report.byProject} />
                </div>
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS} aria-label="Registros de horas">
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH_CLASS}>Fecha</th>
                                    {canSeeAll && <th className={TH_CLASS}>Persona</th>}
                                    <th className={TH_CLASS}>Proyecto</th>
                                    <th className={TH_CLASS}>Actividad</th>
                                    <th className={`${TH_CLASS} text-right`}>Horas</th>
                                    <th className={TH_CLASS}>Nota</th>
                                </tr>
                            </thead>
                            <tbody className={TBODY_CLASS}>
                                {report.entries.map((e) => (
                                    <tr key={e.id} className={TR_CLASS}>
                                        <td className={TD_CLASS}>{formatDate(e.workDate.slice(0, 10))}</td>
                                        {canSeeAll && <td className={TD_CLASS}>{e.userName}</td>}
                                        <td className={TD_CLASS}>{e.projectName}</td>
                                        <td className={TD_CLASS}>
                                            <span className="font-mono text-xs font-semibold">{e.workItemKey}</span>{' '}
                                            <span className={TD_TRUNCATE_CLASS} title={e.workItemTitle}>{e.workItemTitle}</span>
                                        </td>
                                        <td className={`${TD_CLASS} text-right font-semibold`}>{formatNumber(e.hours, 2)}</td>
                                        <td className={TD_CLASS}><span className={TD_TRUNCATE_CLASS} title={e.note ?? undefined}>{e.note ?? '—'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </>)}
        </PageContainer>
    );
};
