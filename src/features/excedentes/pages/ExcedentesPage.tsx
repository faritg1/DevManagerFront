import React, { useState, useEffect } from 'react';
import { Coins, Loader2, Calculator, CheckCircle2, PiggyBank } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { excedentesService } from '../../../shared/api';
import type { SurplusDistributionDto, CalculateSurplusRequest } from '../../../shared/api/types';

const currency = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const emptyCalc = (): CalculateSurplusRequest => ({ period: new Date().toISOString().slice(0, 10), totalSurplus: 0 });

export const ExcedentesPage: React.FC = () => {
    const { showNotification } = useNotification();
    const isAdmin = useIsAdmin();

    const [distributions, setDistributions] = useState<SurplusDistributionDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [calcOpen, setCalcOpen] = useState(false);
    const [calcForm, setCalcForm] = useState<CalculateSurplusRequest>(emptyCalc);

    const [approving, setApproving] = useState<SurplusDistributionDto | null>(null);
    const [revaluation, setRevaluation] = useState<number | null>(null);
    const [cooperativeReturn, setCooperativeReturn] = useState<number | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await excedentesService.getAll();
            setDistributions(res.success && res.data ? res.data : []);
        } catch {
            setDistributions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCalculate = async () => {
        try {
            const res = await excedentesService.calculate({
                period: calcForm.period,
                totalSurplus: calcForm.totalSurplus,
                ...(calcForm.notes?.trim() ? { notes: calcForm.notes.trim() } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Distribución de excedentes calculada' });
                setCalcOpen(false);
                setCalcForm(emptyCalc());
                loadData();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleApprove = async () => {
        if (!approving) return;
        try {
            const res = await excedentesService.approve(approving.id, {
                ...(revaluation != null ? { revaluation } : {}),
                ...(cooperativeReturn != null ? { cooperativeReturn } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Distribución aprobada en Asamblea' });
                setApproving(null);
                setRevaluation(null);
                setCooperativeReturn(null);
                loadData();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const approvedCount = distributions.filter(e => e.approvedByAssembly).length;
    const totalSurplus = distributions.reduce((s, e) => s + e.totalSurplus, 0);

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
                {isAdmin && (
                    <Button icon={Calculator} onClick={() => { setCalcForm(emptyCalc()); setCalcOpen(true); }}>
                        Calcular Distribución
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Distribuciones" value={distributions.length} icon={Coins} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Aprobadas" value={approvedCount} icon={CheckCircle2} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="Total excedentes" value={currency(totalSurplus)} icon={PiggyBank} iconColor="text-purple-500" iconBgColor="bg-purple-100 dark:bg-purple-500/10" />
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
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Remanente</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                {isAdmin && <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Acción</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                            ) : distributions.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay distribuciones de excedentes</td></tr>
                            ) : (
                                distributions.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">{formatDate(e.period)}</p>
                                            <p className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleDateString('es-ES')}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{currency(e.totalSurplus)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.protectionReserve)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.educationFund)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.solidarityFund)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(e.remainder)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={e.approvedByAssembly ? 'success' : 'warning'} dot>
                                                {e.approvedByAssembly ? 'Aprobada' : 'Pendiente'}
                                            </Badge>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4">
                                                {!e.approvedByAssembly && (
                                                    <Button size="sm" variant="outline" onClick={() => { setApproving(e); setRevaluation(null); setCooperativeReturn(null); }}>
                                                        Aprobar en Asamblea
                                                    </Button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={calcOpen}
                onClose={() => setCalcOpen(false)}
                title="Calcular Distribución de Excedentes"
                icon={<Calculator className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleCalculate} disabled={calcForm.totalSurplus <= 0}>Calcular</Button>
                        <Button variant="outline" onClick={() => setCalcOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Período *" value={calcForm.period} onChange={(e) => setCalcForm(f => ({ ...f, period: e.target.value }))} />
                    <Input type="number" label="Total excedentes *" value={calcForm.totalSurplus} onChange={(e) => setCalcForm(f => ({ ...f, totalSurplus: Number(e.target.value) }))} />
                    <Input label="Observaciones" value={calcForm.notes || ''} onChange={(e) => setCalcForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={!!approving}
                onClose={() => setApproving(null)}
                title="Aprobar en Asamblea General"
                icon={<CheckCircle2 className="text-emerald-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleApprove}>Aprobar</Button>
                        <Button variant="outline" onClick={() => setApproving(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Remanente a distribuir: <span className="font-bold text-slate-900 dark:text-white">{approving ? currency(approving.remainder) : ''}</span>
                    </p>
                    <Input type="number" label="Revalorización de aportes" value={revaluation ?? ''} onChange={(e) => setRevaluation(e.target.value ? Number(e.target.value) : null)} />
                    <Input type="number" label="Retorno cooperativo" value={cooperativeReturn ?? ''} onChange={(e) => setCooperativeReturn(e.target.value ? Number(e.target.value) : null)} />
                </div>
            </Modal>
        </div>
    );
};

export default ExcedentesPage;
