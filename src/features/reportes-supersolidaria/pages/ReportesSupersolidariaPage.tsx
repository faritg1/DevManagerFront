import React, { useState, useEffect } from 'react';
import {
    FileBarChart2, Loader2, AlertCircle, Plus, Send, CheckCircle2,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { reportesSupersolidariaService } from '../../../shared/api';
import type { ReporteSupersolidariaDto, CreateReporteDto } from '../../../shared/api/types';

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const tipoReporteLabel: Record<string, string> = {
    'Trimestral': 'Trimestral',
    'Semestral': 'Semestral',
    'Anual': 'Anual',
};

export const ReportesSupersolidariaPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';

    const [reportes, setReportes] = useState<ReporteSupersolidariaDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [genOpen, setGenOpen] = useState(false);
    const [genForm, setGenForm] = useState<CreateReporteDto>({
        organizationId: '',
        periodo: new Date().toISOString().slice(0, 10),
        tipoReporte: 'Trimestral',
    });
    const [genLoading, setGenLoading] = useState(false);

    const loadData = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await reportesSupersolidariaService.getReportesByOrganizacion(orgId);
            if (res.success && res.data) setReportes(res.data);
            else { setReportes([]); setError(res.message || 'Sin reportes'); }
        } catch {
            setReportes([]);
            setError('Error de conexión al cargar reportes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [orgId]);

    const handleGenerar = async () => {
        setGenLoading(true);
        try {
            const res = await reportesSupersolidariaService.generarReporte({ ...genForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Reporte generado' });
                setGenOpen(false);
                setGenForm({ organizationId: orgId, periodo: new Date().toISOString().slice(0, 10), tipoReporte: 'Trimestral' });
                loadData();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo generar el reporte' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setGenLoading(false);
        }
    };

    const handleEnviar = async (reporteId: string) => {
        try {
            const res = await reportesSupersolidariaService.marcarEnviado(reporteId);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Reporte marcado como enviado' });
                loadData();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo marcar como enviado' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const enviados = reportes.filter(r => r.enviado).length;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Reportes Supersolidaria
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Reportes integrales para la Superintendencia de la Economía Solidaria.
                    </p>
                </div>
                <Button icon={Plus} onClick={() => { setGenForm(f => ({ ...f, organizationId: orgId })); setGenOpen(true); }}>
                    Generar Reporte
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard title="Reportes" value={reportes.length} icon={FileBarChart2} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Enviados" value={enviados} icon={Send} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Período</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tipo</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Creado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Enviado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Fecha envío</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                            ) : reportes.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay reportes generados</td></tr>
                            ) : (
                                reportes.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatDate(r.periodo)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="info">{tipoReporteLabel[r.tipoReporte] || r.tipoReporte}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(r.createdAt).toLocaleDateString('es-ES')}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={r.enviado ? 'success' : 'warning'} dot>{r.enviado ? 'Enviado' : 'Pendiente'}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(r.fechaEnvio)}</td>
                                        <td className="px-6 py-4">
                                            {!r.enviado && (
                                                <Button size="sm" icon={Send} onClick={() => handleEnviar(r.id)}>Enviar</Button>
                                            )}
                                            {r.enviado && <CheckCircle2 size={18} className="text-emerald-500" />}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal generar */}
            <Modal
                isOpen={genOpen}
                onClose={() => setGenOpen(false)}
                title="Generar Reporte Supersolidaria"
                icon={<FileBarChart2 className="text-blue-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleGenerar} isLoading={genLoading}>Generar</Button>
                        <Button variant="outline" onClick={() => setGenOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Período *" value={genForm.periodo} onChange={(e) => setGenForm(f => ({ ...f, periodo: e.target.value }))} />
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo de reporte</label>
                        <select
                            value={genForm.tipoReporte || 'Trimestral'}
                            onChange={(e) => setGenForm(f => ({ ...f, tipoReporte: e.target.value }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value="Trimestral">Trimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Anual">Anual</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReportesSupersolidariaPage;
