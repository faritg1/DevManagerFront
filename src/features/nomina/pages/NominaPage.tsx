import React, { useState, useEffect } from 'react';
import { Plus, Calculator, FileSpreadsheet } from 'lucide-react';
import { Card, Button, Input, Modal, PageContainer, PageHeader } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { nominaService, associatesService } from '../../../shared/api';
import type {
    AssociateDto,
    CompensationDto,
    CompensationModel,
    CreateCompensationRequest,
    PilaContributionDto,
} from '../../../shared/api/types';
import { currency, today } from '../../../shared/format';

const MODEL_LABEL: Record<CompensationModel, string> = {
    1: 'Días por tarifa',
    2: 'Fijo mensual',
    3: 'Por proyecto',
};

const selectClass = 'h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none';

const emptyForm = (userId = ''): CreateCompensationRequest => ({ userId, period: today(), model: 1, baseValue: 0 });

export const NominaPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [associates, setAssociates] = useState<AssociateDto[]>([]);

    const [compUserId, setCompUserId] = useState('');
    const [compYear, setCompYear] = useState(new Date().getFullYear());
    const [compensations, setCompensations] = useState<CompensationDto[]>([]);
    const [compLoading, setCompLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateCompensationRequest>(emptyForm());

    const [pilaYear, setPilaYear] = useState(new Date().getFullYear());
    const [pilaMonth, setPilaMonth] = useState(new Date().getMonth() + 1);
    const [sheet, setSheet] = useState<PilaContributionDto[]>([]);
    const [pilaLoading, setPilaLoading] = useState(false);
    const [pilaUserId, setPilaUserId] = useState('');
    const [pilaIncome, setPilaIncome] = useState<number>(0);
    const [pilaRisk, setPilaRisk] = useState(1);
    const [pilaResult, setPilaResult] = useState<PilaContributionDto | null>(null);
    const [pilaError, setPilaError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin) {
            setCompUserId(user?.id ?? '');
            return;
        }
        associatesService.getAll().then(res => {
            const list = res.success && res.data ? res.data : [];
            setAssociates(list);
            if (list[0]) {
                setCompUserId(list[0].userId);
                setPilaUserId(list[0].userId);
            }
        }).catch(() => setAssociates([]));
    }, [isAdmin, user?.id]);

    const nameOf = (userId: string) => associates.find(a => a.userId === userId)?.fullName || userId;

    const loadCompensations = async () => {
        if (!compUserId) return;
        setCompLoading(true);
        try {
            const res = await nominaService.getCompensations(compUserId, compYear);
            setCompensations(res.success && res.data ? res.data : []);
        } catch {
            setCompensations([]);
        } finally {
            setCompLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin && compUserId) loadCompensations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, compUserId]);

    const loadSheet = async () => {
        setPilaLoading(true);
        try {
            const res = await nominaService.getPilaSheet(pilaYear, pilaMonth);
            setSheet(res.success && res.data ? res.data : []);
        } catch {
            setSheet([]);
        } finally {
            setPilaLoading(false);
        }
    };

    const handleCreate = async () => {
        const payload: CreateCompensationRequest = {
            userId: createForm.userId,
            period: createForm.period,
            model: createForm.model,
            baseValue: createForm.baseValue,
            ...(createForm.model === 1 ? { dailyRate: createForm.dailyRate } : {}),
            ...(createForm.notes?.trim() ? { notes: createForm.notes.trim() } : {}),
        };
        try {
            const res = await nominaService.createCompensation(payload);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Compensación creada' });
                setCreateOpen(false);
                setCompUserId(payload.userId);
                setCompYear(new Date(payload.period).getFullYear());
                loadCompensations();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleCalculatePila = async () => {
        if (!pilaUserId) return;
        setPilaError(null);
        try {
            const res = await nominaService.calculatePila({
                userId: pilaUserId,
                period: new Date(pilaYear, pilaMonth - 1, 1).toISOString().slice(0, 10),
                income: pilaIncome,
                arlRiskLevel: pilaRisk,
            });
            setPilaResult(res.success ? res.data : null);
        } catch (err) {
            setPilaResult(null);
            const e = err as { errorCode?: string; message?: string };
            if (e?.errorCode === 'MINIMUM_WAGE_NOT_CONFIGURED') {
                setPilaError(e.message || 'No hay SMMLV configurado para el año; no se puede calcular el IBC.');
            }
        }
    };

    const isDaysByRate = createForm.model === 1;

    return (
        <PageContainer>
            <PageHeader
                title="Nómina Solidaria"
                description="Compensación de asociados (CTAs) y aportes PILA."
                actions={isAdmin && (
                    <Button icon={Plus} onClick={() => { setCreateForm(emptyForm(compUserId)); setCreateOpen(true); }}>
                        Nueva Compensación
                    </Button>
                )}
            />

            <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <FileSpreadsheet className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isAdmin ? 'Compensación' : 'Mi compensación'}</h2>
                    </div>
                    <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 mb-4`}>
                        {isAdmin && (
                            <select value={compUserId} onChange={(e) => setCompUserId(e.target.value)} className={selectClass}>
                                <option value="">Seleccionar asociado</option>
                                {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                            </select>
                        )}
                        <Input type="number" value={compYear} onChange={(e) => setCompYear(Number(e.target.value))} placeholder="Año" />
                        <Button variant="outline" onClick={loadCompensations} disabled={!compUserId || compLoading}>
                            {compLoading ? 'Cargando...' : 'Consultar'}
                        </Button>
                    </div>
                    {compensations.length > 0 ? (
                        <div className="space-y-3">
                            {compensations.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{MODEL_LABEL[c.model] ?? 'Modelo'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(c.period).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(c.calculatedValue)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {c.model === 1 ? `${c.baseValue} días × ${currency(c.dailyRate ?? 0)}` : `Base: ${currency(c.baseValue)}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !compLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Sin registros de compensación para la selección.</p>
                    )}
                </Card>

                {isAdmin && (
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <Calculator className="text-primary" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Planilla PILA</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <Input type="number" value={pilaYear} onChange={(e) => setPilaYear(Number(e.target.value))} placeholder="Año" />
                            <Input type="number" value={pilaMonth} onChange={(e) => setPilaMonth(Number(e.target.value))} min={1} max={12} placeholder="Mes" />
                            <Button variant="outline" onClick={loadSheet} disabled={pilaLoading}>
                                {pilaLoading ? 'Cargando...' : 'Planilla'}
                            </Button>
                        </div>

                        <div className="border-t border-slate-200 dark:border-[#233948] pt-4 mt-2">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Calcular aporte individual ({pilaMonth}/{pilaYear})</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <select value={pilaUserId} onChange={(e) => setPilaUserId(e.target.value)} className={selectClass}>
                                    <option value="">Asociado</option>
                                    {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                                </select>
                                <Input type="number" value={pilaIncome} onChange={(e) => setPilaIncome(Number(e.target.value))} placeholder="Ingreso del mes" />
                            </div>
                            <div className="flex items-end gap-3">
                                <Input type="number" value={pilaRisk} onChange={(e) => setPilaRisk(Number(e.target.value))} min={1} max={5} placeholder="Nivel riesgo ARL" />
                                <Button onClick={handleCalculatePila} disabled={!pilaUserId || pilaIncome <= 0}>Calcular</Button>
                            </div>

                            {pilaError && (
                                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
                                    {pilaError}
                                </div>
                            )}

                            {pilaResult && (
                                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div><p className="text-xs text-slate-500 dark:text-slate-400">IBC</p><p className="font-bold">{currency(pilaResult.contributionBase)}</p></div>
                                    <div><p className="text-xs text-slate-500 dark:text-slate-400">Salud</p><p className="font-bold">{currency(pilaResult.healthContribution)}</p></div>
                                    <div><p className="text-xs text-slate-500 dark:text-slate-400">Pensión</p><p className="font-bold">{currency(pilaResult.pensionContribution)}</p></div>
                                    <div><p className="text-xs text-slate-500 dark:text-slate-400">ARL</p><p className="font-bold">{currency(pilaResult.arlContribution)}</p></div>
                                    <div className="col-span-2 sm:col-span-4"><p className="text-xs text-slate-500 dark:text-slate-400">Total</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(pilaResult.total)}</p></div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {isAdmin && sheet.length > 0 && (
                <Card padding="none" className="overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Asociado</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">IBC</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Salud</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Pensión</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">ARL</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                                {sheet.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{nameOf(p.userId)}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{currency(p.contributionBase)}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{currency(p.healthContribution)}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{currency(p.pensionContribution)}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{currency(p.arlContribution)}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{currency(p.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Nueva Compensación"
                icon={<Plus className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreate} disabled={!createForm.userId || createForm.baseValue <= 0 || (isDaysByRate && !(createForm.dailyRate && createForm.dailyRate > 0))}>Guardar</Button>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select value={createForm.userId} onChange={(e) => setCreateForm(f => ({ ...f, userId: e.target.value }))} className={selectClass}>
                        <option value="">Asociado *</option>
                        {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                    </select>
                    <Input type="date" label="Período *" value={createForm.period} onChange={(e) => setCreateForm(f => ({ ...f, period: e.target.value }))} />
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Modelo *</label>
                        <select
                            value={createForm.model}
                            onChange={(e) => setCreateForm(f => ({ ...f, model: Number(e.target.value) as CompensationModel }))}
                            className={`w-full mt-2 ${selectClass}`}
                        >
                            {([1, 2, 3] as CompensationModel[]).map(m => <option key={m} value={m}>{MODEL_LABEL[m]}</option>)}
                        </select>
                    </div>
                    <Input
                        type="number"
                        label={isDaysByRate ? 'Días trabajados *' : 'Valor *'}
                        value={createForm.baseValue}
                        onChange={(e) => setCreateForm(f => ({ ...f, baseValue: Number(e.target.value) }))}
                    />
                    {isDaysByRate && (
                        <Input
                            type="number"
                            label="Tarifa diaria *"
                            value={createForm.dailyRate ?? ''}
                            onChange={(e) => setCreateForm(f => ({ ...f, dailyRate: e.target.value ? Number(e.target.value) : undefined }))}
                        />
                    )}
                    <Input label="Observaciones" value={createForm.notes ?? ''} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
            </Modal>
        </PageContainer>
    );
};

