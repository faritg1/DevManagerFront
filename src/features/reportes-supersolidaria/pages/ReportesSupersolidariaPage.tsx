import React, { useState, useEffect } from 'react';
import { FileBarChart2, Loader2, Plus, Send, CheckCircle2, Eye } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard, PageContainer, PageHeader, SELECT_CLASS } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { reportesSupersolidariaService } from '../../../shared/api';
import type {
    ComplianceDto,
    GenerateSupersolidariaReportRequest,
    SocialBalanceReportDto,
    SupersolidariaReportDto,
    SupersolidariaReportType,
} from '../../../shared/api/types';
import { formatDate } from '../../../shared/format';

const REPORT_TYPE_LABEL: Record<SupersolidariaReportType, string> = { 1: 'Trimestral', 2: 'Anual' };

/** Secciones congeladas (JSON camelCase) al generar el reporte. */
interface AssociatesSection {
    total: number; active: number; suspended: number; applicants: number; withdrawn: number;
    activeDuringPeriod: number; admittedInPeriod: number; withdrawnInPeriod: number;
}
interface ComplianceSection {
    status: ComplianceDto;
    pendingMedicalExams: number; accidentsInPeriod: number; investigationsCompletedInPeriod: number;
    activeRisks: number; activeGoverningBodies: number; latestSurplusPeriod?: string; latestSurplusApprovedByAssembly: boolean;
}

const parse = <T,>(json: string | null | undefined): T | null => {
    if (!json) return null;
    try { return JSON.parse(json) as T; } catch { return null; }
};

const emptyForm = (): GenerateSupersolidariaReportRequest => ({ period: new Date().toISOString().slice(0, 10), reportType: 1 });

export const ReportesSupersolidariaPage: React.FC = () => {
    const { showNotification } = useNotification();
    const isAdmin = useIsAdmin();

    const [reports, setReports] = useState<SupersolidariaReportDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [genOpen, setGenOpen] = useState(false);
    const [genForm, setGenForm] = useState<GenerateSupersolidariaReportRequest>(emptyForm);
    const [genLoading, setGenLoading] = useState(false);

    const [viewing, setViewing] = useState<SupersolidariaReportDto | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await reportesSupersolidariaService.getAll();
            setReports(res.success && res.data ? res.data : []);
        } catch {
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleGenerate = async () => {
        setGenLoading(true);
        try {
            const res = await reportesSupersolidariaService.generate({
                period: genForm.period,
                reportType: genForm.reportType,
                ...(genForm.notes?.trim() ? { notes: genForm.notes.trim() } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Reporte generado' });
                setGenOpen(false);
                setGenForm(emptyForm());
                loadData();
            }
        } catch {
            // el listener global muestra el error
        } finally {
            setGenLoading(false);
        }
    };

    const handleSend = async (id: string) => {
        try {
            const res = await reportesSupersolidariaService.markSent(id);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Reporte marcado como enviado' });
                loadData();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const sentCount = reports.filter(r => r.isSent).length;
    const balance = parse<SocialBalanceReportDto>(viewing?.socialBalanceJson);
    const associates = parse<AssociatesSection>(viewing?.associatesJson);
    const compliance = parse<ComplianceSection>(viewing?.complianceJson);

    return (
        <PageContainer>
            <PageHeader
                title="Reportes Supersolidaria"
                description="Reportes integrales para la Superintendencia de la Economía Solidaria."
                actions={isAdmin && (
                    <Button icon={Plus} onClick={() => { setGenForm(emptyForm()); setGenOpen(true); }}>
                        Generar Reporte
                    </Button>
                )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard title="Reportes" value={reports.length} icon={FileBarChart2} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Enviados" value={sentCount} icon={Send} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Período</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tipo</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Creado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Fecha envío</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay reportes generados</td></tr>
                            ) : (
                                reports.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatDate(r.period)} – {formatDate(r.periodEnd)}</td>
                                        <td className="px-6 py-4"><Badge variant="info">{REPORT_TYPE_LABEL[r.reportType] ?? r.reportType}</Badge></td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(r.createdAt).toLocaleDateString('es-ES')}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={r.isSent ? 'success' : 'warning'} dot>{r.isSent ? 'Enviado' : 'Pendiente'}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(r.sentAt)}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Button size="sm" variant="outline" icon={Eye} onClick={() => setViewing(r)}>Ver</Button>
                                            {isAdmin && !r.isSent && (
                                                <Button size="sm" icon={Send} onClick={() => handleSend(r.id)}>Enviar</Button>
                                            )}
                                            {r.isSent && <CheckCircle2 size={18} className="text-emerald-500" />}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={genOpen}
                onClose={() => setGenOpen(false)}
                title="Generar Reporte Supersolidaria"
                icon={<FileBarChart2 className="text-blue-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleGenerate} isLoading={genLoading}>Generar</Button>
                        <Button variant="outline" onClick={() => setGenOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Inicio del período *" value={genForm.period} onChange={(e) => setGenForm(f => ({ ...f, period: e.target.value }))} />
                    <p className="text-xs text-slate-500 -mt-2 dark:text-slate-400">Trimestral: 1 de enero, abril, julio u octubre. Anual: 1 de enero.</p>
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo de reporte</label>
                        <select
                            value={genForm.reportType}
                            onChange={(e) => setGenForm(f => ({ ...f, reportType: Number(e.target.value) as SupersolidariaReportType }))}
                            className={`${SELECT_CLASS} w-full mt-2`}
                        >
                            <option value={1}>Trimestral</option>
                            <option value={2}>Anual</option>
                        </select>
                    </div>
                    <Input label="Observaciones" value={genForm.notes ?? ''} onChange={(e) => setGenForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={!!viewing}
                onClose={() => setViewing(null)}
                title={viewing ? `Reporte ${REPORT_TYPE_LABEL[viewing.reportType]} ${formatDate(viewing.period)}` : ''}
                icon={<FileBarChart2 className="text-blue-500" size={20} />}
                size="lg"
            >
                <div className="space-y-5 text-sm">
                    {associates && (
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white mb-2">Asociados</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div><p className="text-slate-500 dark:text-slate-400">Total</p><p className="font-bold">{associates.total}</p></div>
                                <div><p className="text-slate-500 dark:text-slate-400">Activos</p><p className="font-bold">{associates.active}</p></div>
                                <div><p className="text-slate-500 dark:text-slate-400">Admitidos en el período</p><p className="font-bold">{associates.admittedInPeriod}</p></div>
                                <div><p className="text-slate-500 dark:text-slate-400">Retirados en el período</p><p className="font-bold">{associates.withdrawnInPeriod}</p></div>
                            </div>
                        </div>
                    )}
                    {compliance?.status && (
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white mb-2">Cumplimiento · {compliance.status.overallStatus} ({compliance.status.overallCoverage}%)</p>
                            <ul className="space-y-1 text-xs">
                                {compliance.status.areas.map(a => (
                                    <li key={a.name}>
                                        <Badge variant={a.compliant ? 'success' : 'danger'}>{a.compliant ? 'Cumple' : 'No cumple'}</Badge>{' '}
                                        <span className="font-bold">{a.name}</span> — {a.applicableRule}{a.detail ? `: ${a.detail}` : ''}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-slate-500 mt-2 dark:text-slate-400">
                                Exámenes pendientes: {compliance.pendingMedicalExams} · Accidentes: {compliance.accidentsInPeriod} · Riesgos activos: {compliance.activeRisks} · Órganos activos: {compliance.activeGoverningBodies}
                            </p>
                        </div>
                    )}
                    {balance && (
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white mb-2">Balance social</p>
                            <ul className="space-y-1 text-xs">
                                {balance.dimensions.map(d => (
                                    <li key={d.name}><span className="font-bold">{d.name}</span>: {d.coverage}% (meta {d.target}%)</li>
                                ))}
                            </ul>
                            {balance.executiveSummary && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{balance.executiveSummary}</p>}
                        </div>
                    )}
                    {viewing?.notes && <p className="text-xs text-slate-500 dark:text-slate-400">Observaciones: {viewing.notes}</p>}
                </div>
            </Modal>
        </PageContainer>
    );
};

