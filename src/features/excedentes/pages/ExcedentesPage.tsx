import React, { useState, useEffect } from 'react';
import { Coins, Calculator, CheckCircle2, PiggyBank } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, Pager, SearchInput, StatCard, PageContainer, PageHeader, TABLE_CLASS, THEAD_CLASS, TH_CLASS, TBODY_CLASS, TD_CLASS, TH_ACTIONS_CLASS, TR_CLASS, TableActions, EmptyState, LoadingBlock } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { usePagedFilter, usePermission } from '../../../shared/hooks';
import { excedentesService } from '../../../shared/api';
import type { SurplusDistributionDto, CalculateSurplusRequest } from '../../../shared/api/types';
import { formatDate, currency } from '../../../shared/format';
import { AskAiButton } from '../../ai/AskAiButton';

const emptyCalc = (): CalculateSurplusRequest => ({ period: new Date().toISOString().slice(0, 10), totalSurplus: 0 });

export const ExcedentesPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { has } = usePermission();
    const canApprove = has('menu.solidarity.surplus.approve');

    const [distributions, setDistributions] = useState<SurplusDistributionDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [calcOpen, setCalcOpen] = useState(false);
    const [calcForm, setCalcForm] = useState<CalculateSurplusRequest>(emptyCalc);

    const [approving, setApproving] = useState<SurplusDistributionDto | null>(null);
    const [revaluation, setRevaluation] = useState<number | null>(null);
    const [cooperativeReturn, setCooperativeReturn] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const pager = usePagedFilter(distributions, {
        searchFields: e => [formatDate(e.period), e.approvedByAssembly ? 'Aprobada' : 'Pendiente', e.notes],
    });

    /** Runs a modal submit with the button in loading state, ignoring repeat submits. */
    const submitting = (fn: () => Promise<void>) => async () => {
        if (saving) return;
        setSaving(true);
        try { await fn(); } finally { setSaving(false); }
    };

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

    const handleCalculate = submitting(async () => {
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
    });


    const handleApprove = submitting(async () => {
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
    });


    const approvedCount = distributions.filter(e => e.approvedByAssembly).length;
    const totalSurplus = distributions.reduce((s, e) => s + e.totalSurplus, 0);

    return (
        <PageContainer>
            <PageHeader
                title="Excedentes Cooperativos"
                description="Distribución de excedentes según Ley 79 (reserva, educación y solidaridad)."
                actions={<><AskAiButton moduleKey="surplus" />{has('menu.solidarity.surplus.calculate') && (
                    <Button icon={Calculator} onClick={() => { setCalcForm(emptyCalc()); setCalcOpen(true); }}>
                        Calcular Distribución
                    </Button>
                )}</>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Distribuciones" value={distributions.length} icon={Coins} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Aprobadas" value={approvedCount} icon={CheckCircle2} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="Total excedentes" value={currency(totalSurplus)} icon={PiggyBank} iconColor="text-purple-500" iconBgColor="bg-purple-100 dark:bg-purple-500/10" />
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className={`${TD_CLASS} border-b border-slate-200 dark:border-border-dark flex justify-end`}>
                    <SearchInput pager={pager} label="Buscar por período o estado" />
                </div>
                <div className="overflow-x-auto">
                    <table className={TABLE_CLASS}>
                        <thead className={THEAD_CLASS}>
                            <tr>
                                <th className={TH_CLASS}>Período</th>
                                <th className={TH_CLASS}>Total excedentes</th>
                                <th className={TH_CLASS}>Reserva</th>
                                <th className={TH_CLASS}>Educación</th>
                                <th className={TH_CLASS}>Solidaridad</th>
                                <th className={TH_CLASS}>Remanente</th>
                                <th className={TH_CLASS}>Estado</th>
                                {canApprove && <th className={TH_ACTIONS_CLASS}>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className={TBODY_CLASS}>
                            {isLoading ? (
                                <tr><td colSpan={8}><LoadingBlock /></td></tr>
                            ) : pager.total === 0 ? (
                                <tr><td colSpan={8}><EmptyState title={pager.query ? 'Ninguna distribución coincide con la búsqueda' : 'No hay distribuciones de excedentes'} /></td></tr>
                            ) : (
                                pager.pageItems.map(e => (
                                    <tr key={e.id} className={TR_CLASS}>
                                        <td className={TD_CLASS}>
                                            <p className="font-bold text-slate-900 dark:text-white">{formatDate(e.period)}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(e.createdAt)}</p>
                                        </td>
                                        <td className={`${TD_CLASS} font-bold text-slate-900 dark:text-white`}>{currency(e.totalSurplus)}</td>
                                        <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{currency(e.protectionReserve)}</td>
                                        <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{currency(e.educationFund)}</td>
                                        <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{currency(e.solidarityFund)}</td>
                                        <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{currency(e.remainder)}</td>
                                        <td className={TD_CLASS}>
                                            <Badge variant={e.approvedByAssembly ? 'success' : 'warning'} dot>
                                                {e.approvedByAssembly ? 'Aprobada' : 'Pendiente'}
                                            </Badge>
                                        </td>
                                        {canApprove && (
                                            <TableActions>
                                                {!e.approvedByAssembly && (
                                                    <Button size="sm" variant="outline" onClick={() => { setApproving(e); setRevaluation(null); setCooperativeReturn(null); }}>
                                                        Aprobar en Asamblea
                                                    </Button>
                                                )}
                                            </TableActions>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pager pager={pager} />
            </Card>

            <Modal
                isOpen={calcOpen}
                onClose={() => setCalcOpen(false)}
                onSubmit={handleCalculate}
                title="Calcular Distribución de Excedentes"
                icon={<Calculator className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Calcular</Button>
                        <Button variant="outline" onClick={() => setCalcOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Período *" required value={calcForm.period} onChange={(e) => setCalcForm(f => ({ ...f, period: e.target.value }))} />
                    <Input type="number" label="Total excedentes *" required min={0.01} step="any" value={calcForm.totalSurplus} onChange={(e) => setCalcForm(f => ({ ...f, totalSurplus: Number(e.target.value) }))} />
                    <Input label="Observaciones" value={calcForm.notes || ''} onChange={(e) => setCalcForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={!!approving}
                onClose={() => setApproving(null)}
                onSubmit={handleApprove}
                title="Aprobar en Asamblea General"
                icon={<CheckCircle2 className="text-emerald-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Aprobar</Button>
                        <Button variant="outline" onClick={() => setApproving(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Remanente a distribuir: <span className="font-bold text-slate-900 dark:text-white">{approving ? currency(approving.remainder) : ''}</span>
                    </p>
                    <Input type="number" step="any" label="Revalorización de aportes" value={revaluation ?? ''} onChange={(e) => setRevaluation(e.target.value ? Number(e.target.value) : null)} />
                    <Input type="number" step="any" label="Retorno cooperativo" value={cooperativeReturn ?? ''} onChange={(e) => setCooperativeReturn(e.target.value ? Number(e.target.value) : null)} />
                </div>
            </Modal>
        </PageContainer>
    );
};

