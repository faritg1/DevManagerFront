import React, { useState, useEffect } from 'react';
import {
    Coins, Loader2, AlertCircle, Calculator, CheckCircle2, PiggyBank,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { excedentesService } from '../../../shared/api';
import type { ExcedenteDto, CreateExcedenteDto } from '../../../shared/api/types';

const currency = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

export const ExcedentesPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';

    const [excedentes, setExcedentes] = useState<ExcedenteDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calcular
    const [calcOpen, setCalcOpen] = useState(false);
    const [calcForm, setCalcForm] = useState<CreateExcedenteDto>({
        organizationId: '',
        periodo: new Date().toISOString().slice(0, 10),
        totalExcedentes: 0,
        observaciones: '',
    });

    // Aprobar
    const [aprobando, setAprobando] = useState<ExcedenteDto | null>(null);
    const [revalorizacion, setRevalorizacion] = useState<number | null>(null);
    const [retorno, setRetorno] = useState<number | null>(null);

    const loadData = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await excedentesService.getByOrganizacion(orgId);
            if (res.success && res.data) setExcedentes(res.data);
            else { setExcedentes([]); setError(res.message || 'Sin excedentes'); }
        } catch {
            setExcedentes([]);
            setError('Error de conexión al cargar excedentes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [orgId]);

    const handleCalcular = async () => {
        try {
            const res = await excedentesService.calcularDistribucion({ ...calcForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Distribución de excedentes calculada' });
                setCalcOpen(false);
                setCalcForm({ organizationId: orgId, periodo: new Date().toISOString().slice(0, 10), totalExcedentes: 0, observaciones: '' });
                loadData();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo calcular la distribución' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleAprobar = async () => {
        if (!aprobando) return;
        try {
            const res = await excedentesService.aprobarDistribucion(aprobando.id, revalorizacion, retorno);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Distribución aprobada en Asamblea' });
                setAprobando(null);
                setRevalorizacion(null);
                setRetorno(null);
                loadData();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo aprobar la distribución' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const aprobados = excedentes.filter(e => e.aprobadoPorAsamblea).length;
    const totalExcedentes = excedentes.reduce((s, e) => s + e.totalExcedentes, 0);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Excedentes Cooperativos
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Distribución de excedentes según Ley 79 (reserva, educación y solidaridad).
                    </p>
                </div>
                <Button icon={Calculator} onClick={() => { setCalcForm(f => ({ ...f, organizationId: orgId })); setCalcOpen(true); }}>
                    Calcular Distribución
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Distribuciones" value={excedentes.length} icon={Coins} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Aprobadas" value={aprobados} icon={CheckCircle2} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="Total excedentes" value={currency(totalExcedentes)} icon={PiggyBank} iconColor="text-purple-500" iconBgColor="bg-purple-100 dark:bg-purple-500/10" />
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Período</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Total excedentes</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Reserva</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Educación</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Solidaridad</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                            ) : excedentes.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay distribuciones de excedentes</td></tr>
                            ) : (
                                excedentes.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">{formatDate(e.periodo)}</p>
                                            <p className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleDateString('es-ES')}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{currency(e.totalExcedentes)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.reservaProteccionAportes)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.fondoEducacion)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.fondoSolidaridad)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={e.aprobadoPorAsamblea ? 'success' : 'warning'} dot>
                                                {e.aprobadoPorAsamblea ? 'Aprobada' : 'Pendiente'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {!e.aprobadoPorAsamblea && (
                                                <Button size="sm" variant="outline" onClick={() => { setAprobando(e); setRevalorizacion(null); setRetorno(null); }}>
                                                    Aprobar en Asamblea
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal calcular */}
            <Modal
                isOpen={calcOpen}
                onClose={() => setCalcOpen(false)}
                title="Calcular Distribución de Excedentes"
                icon={<Calculator className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleCalcular}>Calcular</Button>
                        <Button variant="outline" onClick={() => setCalcOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Período *" value={calcForm.periodo} onChange={(e) => setCalcForm(f => ({ ...f, periodo: e.target.value }))} />
                    <Input type="number" label="Total excedentes *" value={calcForm.totalExcedentes} onChange={(e) => setCalcForm(f => ({ ...f, totalExcedentes: Number(e.target.value) }))} />
                    <Input label="Observaciones" value={calcForm.observaciones || ''} onChange={(e) => setCalcForm(f => ({ ...f, observaciones: e.target.value }))} />
                </div>
            </Modal>

            {/* Modal aprobar */}
            <Modal
                isOpen={!!aprobando}
                onClose={() => setAprobando(null)}
                title="Aprobar en Asamblea General"
                icon={<CheckCircle2 className="text-emerald-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleAprobar}>Aprobar</Button>
                        <Button variant="outline" onClick={() => setAprobando(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total excedentes: <span className="font-bold text-slate-900 dark:text-white">{aprobando ? currency(aprobando.totalExcedentes) : ''}</span>
                    </p>
                    <Input type="number" label="Revalorización de aportes" value={revalorizacion ?? ''} onChange={(e) => setRevalorizacion(e.target.value ? Number(e.target.value) : null)} />
                    <Input type="number" label="Retorno cooperativo" value={retorno ?? ''} onChange={(e) => setRetorno(e.target.value ? Number(e.target.value) : null)} />
                </div>
            </Modal>
        </div>
    );
};

export default ExcedentesPage;
