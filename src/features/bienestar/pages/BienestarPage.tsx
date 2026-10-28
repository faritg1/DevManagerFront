import React, { useState, useEffect } from 'react';
import { Heart, Plus, Loader2, Calculator, Wallet, HandCoins, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard, PageContainer, PageHeader } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { bienestarService, associatesService } from '../../../shared/api';
import type {
    AidType,
    AssociateDto,
    CreateWelfareProgramRequest,
    CreateWelfareRequestRequest,
    SolidarityFundDto,
    WelfareAidDto,
    WelfareProgramDto,
    WelfareRequestDto,
} from '../../../shared/api/types';

const currency = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const today = () => new Date().toISOString().slice(0, 10);

const AID_TYPE_LABEL: Record<AidType, string> = {
    1: 'Auxilio económico',
    2: 'Beca educativa',
    3: 'Crédito blando',
    4: 'Auxilio funerario',
    5: 'Apoyo vivienda',
    99: 'Otro',
};

const statusBadge = (status: number) => {
    switch (status) {
        case 2: return <Badge variant="success">Aprobada</Badge>;
        case 3: return <Badge variant="danger">Rechazada</Badge>;
        case 4: return <Badge variant="info">Entregada</Badge>;
        default: return <Badge variant="warning">Pendiente</Badge>;
    }
};

const selectClass = 'h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none';

const emptyProgram = (): CreateWelfareProgramRequest => ({ name: '', budget: 0, startDate: today() });
const emptyRequest = (): CreateWelfareRequestRequest => ({ aidType: 1, requestedAmount: 0, reason: '', requiredDate: today() });

type Resolve = { request: WelfareRequestDto; action: 'aprobar' | 'rechazar' | 'entregar' };

export const BienestarPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [associates, setAssociates] = useState<AssociateDto[]>([]);

    const [programs, setPrograms] = useState<WelfareProgramDto[]>([]);
    const [progLoading, setProgLoading] = useState(false);
    const [programOpen, setProgramOpen] = useState(false);
    const [programForm, setProgramForm] = useState<CreateWelfareProgramRequest>(emptyProgram);

    const [requestOpen, setRequestOpen] = useState(false);
    const [requestForm, setRequestForm] = useState<CreateWelfareRequestRequest>(emptyRequest);

    const [pending, setPending] = useState<WelfareRequestDto[]>([]);

    const [lookupUserId, setLookupUserId] = useState('');
    const [requests, setRequests] = useState<WelfareRequestDto[]>([]);
    const [aids, setAids] = useState<WelfareAidDto[]>([]);
    const [lookupLoading, setLookupLoading] = useState(false);

    const [fund, setFund] = useState<SolidarityFundDto | null>(null);
    const [fundPeriod, setFundPeriod] = useState(today());
    const [fundLoading, setFundLoading] = useState(false);

    const [resolving, setResolving] = useState<Resolve | null>(null);
    const [approvedAmount, setApprovedAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [requiresRepayment, setRequiresRepayment] = useState(false);

    const nameOf = (userId: string) => associates.find(a => a.userId === userId)?.fullName || (userId === user?.id ? user?.name : userId);

    const loadPrograms = async () => {
        setProgLoading(true);
        try {
            const res = await bienestarService.getPrograms();
            setPrograms(res.success && res.data ? res.data : []);
        } catch {
            setPrograms([]);
        } finally {
            setProgLoading(false);
        }
    };

    const loadFund = async () => {
        try {
            const res = await bienestarService.getCurrentFund();
            setFund(res.success ? res.data : null);
        } catch {
            setFund(null); // 404: aún no hay fondo
        }
    };

    const loadPending = async () => {
        try {
            const res = await bienestarService.getPendingRequests();
            setPending(res.success && res.data ? res.data : []);
        } catch {
            setPending([]);
        }
    };

    const loadUser = async (userId: string) => {
        if (!userId) return;
        setLookupLoading(true);
        try {
            const [r, a] = await Promise.all([
                bienestarService.getRequestsByUser(userId),
                bienestarService.getAidsByUser(userId),
            ]);
            setRequests(r.success && r.data ? r.data : []);
            setAids(a.success && a.data ? a.data : []);
        } catch {
            setRequests([]);
            setAids([]);
        } finally {
            setLookupLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
        loadFund();
        if (isAdmin) {
            loadPending();
            associatesService.getAll().then(res => setAssociates(res.success && res.data ? res.data : [])).catch(() => {});
        } else if (user?.id) {
            setLookupUserId(user.id);
            loadUser(user.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, user?.id]);

    const refreshAfterChange = () => {
        if (isAdmin) loadPending();
        if (lookupUserId) loadUser(lookupUserId);
    };

    const handleCreateProgram = async () => {
        const f = programForm;
        try {
            const res = await bienestarService.createProgram({
                name: f.name.trim(),
                budget: f.budget,
                startDate: f.startDate,
                ...(f.description?.trim() ? { description: f.description.trim() } : {}),
                ...(f.endDate ? { endDate: f.endDate } : {}),
                ...(f.maxBeneficiaries ? { maxBeneficiaries: f.maxBeneficiaries } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Programa de bienestar creado' });
                setProgramOpen(false);
                setProgramForm(emptyProgram());
                loadPrograms();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleCreateRequest = async () => {
        const f = requestForm;
        try {
            const res = await bienestarService.createRequest({
                aidType: f.aidType,
                requestedAmount: f.requestedAmount,
                reason: f.reason.trim(),
                requiredDate: f.requiredDate,
                ...(f.programId ? { programId: f.programId } : {}),
                ...(isAdmin && f.userId ? { userId: f.userId } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Solicitud de bienestar registrada' });
                setRequestOpen(false);
                setRequestForm(emptyRequest());
                refreshAfterChange();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const openResolve = (request: WelfareRequestDto, action: Resolve['action']) => {
        setResolving({ request, action });
        setApprovedAmount(request.requestedAmount);
        setNotes('');
        setRequiresRepayment(false);
    };

    const handleResolve = async () => {
        if (!resolving) return;
        const { request, action } = resolving;
        try {
            const res = action === 'aprobar'
                ? await bienestarService.approveRequest(request.id, approvedAmount, notes.trim() || undefined)
                : action === 'rechazar'
                    ? await bienestarService.rejectRequest(request.id, notes.trim())
                    : await bienestarService.deliverRequest(request.id, requiresRepayment, notes.trim() || undefined);
            if (res.success) {
                const msg = action === 'aprobar' ? 'Solicitud aprobada' : action === 'rechazar' ? 'Solicitud rechazada' : 'Auxilio entregado';
                showNotification({ type: 'success', message: msg });
                setResolving(null);
                refreshAfterChange();
                if (action === 'entregar') loadFund();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleCalculateFund = async () => {
        setFundLoading(true);
        try {
            const res = await bienestarService.calculateFund(fundPeriod);
            if (res.success && res.data) {
                setFund(res.data);
                showNotification({ type: 'success', message: 'Aporte al fondo calculado' });
            }
        } catch {
            // el listener global muestra el error
        } finally {
            setFundLoading(false);
        }
    };

    const requestActions = (s: WelfareRequestDto) => {
        if (!isAdmin) return null;
        if (s.status === 1) {
            return (
                <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => openResolve(s, 'aprobar')}><CheckCircle2 size={14} /> Aprobar</Button>
                    <Button size="sm" variant="danger" onClick={() => openResolve(s, 'rechazar')}><XCircle size={14} /> Rechazar</Button>
                </div>
            );
        }
        if (s.status === 2) {
            return <Button size="sm" variant="outline" onClick={() => openResolve(s, 'entregar')}><PackageCheck size={14} /> Entregar</Button>;
        }
        return null;
    };

    const renderRequest = (s: WelfareRequestDto, showName: boolean) => (
        <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
            <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 dark:text-white">{AID_TYPE_LABEL[s.aidType] ?? s.aidType}</p>
                {statusBadge(s.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                {showName && <>{nameOf(s.userId)} · </>}{s.programName || 'Sin programa'} · {formatDate(s.requiredDate)}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{s.reason}</p>
            {s.resolutionNotes && <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{s.resolutionNotes}</p>}
            <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {currency(s.approvedAmount ?? s.requestedAmount)}
                    {s.approvedAmount != null && s.approvedAmount !== s.requestedAmount && (
                        <span className="text-xs text-slate-500 font-normal dark:text-slate-400"> (solicitado {currency(s.requestedAmount)})</span>
                    )}
                </p>
                {requestActions(s)}
            </div>
        </div>
    );

    return (
        <PageContainer>
            <PageHeader
                title="Bienestar Cooperativo"
                description="Programas de bienestar, solicitudes, auxilios y fondo de solidaridad."
                actions={<>
                <div className="flex gap-3">
                    <Button variant="outline" icon={HandCoins} onClick={() => { setRequestForm(emptyRequest()); setRequestOpen(true); }}>
                        Nueva Solicitud
                    </Button>
                    {isAdmin && (
                        <Button icon={Plus} onClick={() => { setProgramForm(emptyProgram()); setProgramOpen(true); }}>
                            Nuevo Programa
                        </Button>
                    )}
                </div>
                </>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Programas" value={programs.length} icon={Heart} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />
                <StatCard title={isAdmin ? 'Solicitudes pendientes' : 'Mis solicitudes'} value={isAdmin ? pending.length : requests.length} icon={HandCoins} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Saldo del fondo" value={fund ? currency(fund.availableBalance) : '—'} icon={Wallet} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fondo de Solidaridad</h2>
                </div>
                {fund ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Saldo disponible</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(fund.availableBalance)}</p></div>
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Aporte del período</p><p className="font-bold">{currency(fund.contribution)}</p></div>
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Saldo trasladado</p><p className="font-bold">{currency(fund.carriedOver)}</p></div>
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Total desembolsado</p><p className="font-bold">{currency(fund.totalDisbursed)}</p></div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sin fondo registrado para esta organización.</p>
                )}
                {isAdmin && (
                    <div className="border-t border-slate-200 dark:border-[#233948] pt-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Calcular aporte desde la distribución de excedentes del período</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input type="date" value={fundPeriod} onChange={(e) => setFundPeriod(e.target.value)} label="Período de excedentes" />
                            <div className="flex items-end">
                                <Button icon={Calculator} onClick={handleCalculateFund} disabled={fundLoading}>
                                    {fundLoading ? 'Calculando...' : 'Calcular'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <Card padding="none" className="overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-[#233948] flex items-center gap-2">
                    <Heart className="text-rose-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Programas de Bienestar</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Nombre</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Presupuesto</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Inicio</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Fin</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {progLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                            ) : programs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay programas de bienestar</td></tr>
                            ) : (
                                programs.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                            {p.description && <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{currency(p.budget)}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(p.startDate)}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(p.endDate)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={p.isActive ? 'success' : 'default'} dot>{p.isActive ? 'Activo' : 'Inactivo'}</Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isAdmin && (
                <Card className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <HandCoins className="text-orange-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Solicitudes Pendientes</h2>
                    </div>
                    {pending.length === 0
                        ? <p className="text-sm text-slate-500 dark:text-slate-400">Sin solicitudes pendientes.</p>
                        : <div className="space-y-3">{pending.map(s => renderRequest(s, true))}</div>}
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <HandCoins className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isAdmin ? 'Solicitudes por Asociado' : 'Mis Solicitudes'}</h2>
                    </div>
                    {isAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <select value={lookupUserId} onChange={(e) => setLookupUserId(e.target.value)} className={selectClass}>
                                <option value="">Seleccionar asociado</option>
                                {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                            </select>
                            <Button variant="outline" onClick={() => loadUser(lookupUserId)} disabled={!lookupUserId || lookupLoading}>
                                {lookupLoading ? 'Cargando...' : 'Consultar'}
                            </Button>
                        </div>
                    )}
                    {requests.length === 0
                        ? !lookupLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Sin solicitudes para la selección.</p>
                        : <div className="space-y-3">{requests.map(s => renderRequest(s, false))}</div>}
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isAdmin ? 'Auxilios del Asociado' : 'Mis Auxilios'}</h2>
                    </div>
                    {aids.length === 0 ? (
                        !lookupLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Sin auxilios para la selección.</p>
                    ) : (
                        <div className="space-y-3">
                            {aids.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{AID_TYPE_LABEL[a.aidType] ?? a.aidType}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {a.concept} · {formatDate(a.deliveredAt)}
                                            {a.requiresRepayment && <> · Reintegro {formatDate(a.repaymentDueDate)}</>}
                                        </p>
                                    </div>
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(a.amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <Modal
                isOpen={programOpen}
                onClose={() => setProgramOpen(false)}
                title="Nuevo Programa de Bienestar"
                icon={<Heart className="text-rose-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreateProgram} disabled={!programForm.name.trim() || programForm.budget <= 0}>Guardar</Button>
                        <Button variant="outline" onClick={() => setProgramOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Input label="Nombre *" value={programForm.name} onChange={(e) => setProgramForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Fondo de auxilios funerarios" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Descripción</label>
                        <textarea
                            value={programForm.description || ''}
                            onChange={(e) => setProgramForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2"
                            rows={3}
                        />
                    </div>
                    <Input type="number" label="Presupuesto *" value={programForm.budget} onChange={(e) => setProgramForm(f => ({ ...f, budget: Number(e.target.value) }))} />
                    <Input type="date" label="Fecha inicio *" value={programForm.startDate} onChange={(e) => setProgramForm(f => ({ ...f, startDate: e.target.value }))} />
                    <Input type="date" label="Fecha fin" value={programForm.endDate || ''} onChange={(e) => setProgramForm(f => ({ ...f, endDate: e.target.value || undefined }))} />
                    <Input type="number" label="Máx. beneficiarios" value={programForm.maxBeneficiaries ?? ''} onChange={(e) => setProgramForm(f => ({ ...f, maxBeneficiaries: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
            </Modal>

            <Modal
                isOpen={requestOpen}
                onClose={() => setRequestOpen(false)}
                title="Nueva Solicitud de Bienestar"
                icon={<HandCoins className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreateRequest} disabled={!requestForm.reason.trim() || requestForm.requestedAmount <= 0}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isAdmin && (
                        <select value={requestForm.userId ?? ''} onChange={(e) => setRequestForm(f => ({ ...f, userId: e.target.value || undefined }))} className={selectClass}>
                            <option value="">Yo mismo</option>
                            {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                        </select>
                    )}
                    <select value={requestForm.aidType} onChange={(e) => setRequestForm(f => ({ ...f, aidType: Number(e.target.value) as AidType }))} className={selectClass}>
                        {Object.entries(AID_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={requestForm.programId ?? ''} onChange={(e) => setRequestForm(f => ({ ...f, programId: e.target.value || undefined }))} className={selectClass}>
                        <option value="">Sin programa</option>
                        {programs.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Input type="number" label="Monto solicitado *" value={requestForm.requestedAmount} onChange={(e) => setRequestForm(f => ({ ...f, requestedAmount: Number(e.target.value) }))} />
                    <Input type="date" label="Fecha requerida *" value={requestForm.requiredDate} onChange={(e) => setRequestForm(f => ({ ...f, requiredDate: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <Input label="Motivo *" value={requestForm.reason} onChange={(e) => setRequestForm(f => ({ ...f, reason: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!resolving}
                onClose={() => setResolving(null)}
                title={resolving?.action === 'aprobar' ? 'Aprobar solicitud' : resolving?.action === 'rechazar' ? 'Rechazar solicitud' : 'Entregar auxilio'}
                icon={resolving?.action === 'rechazar' ? <XCircle className="text-rose-500" size={20} /> : <CheckCircle2 className="text-emerald-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button
                            variant={resolving?.action === 'rechazar' ? 'danger' : 'primary'}
                            onClick={handleResolve}
                            disabled={resolving?.action === 'rechazar' ? !notes.trim() : resolving?.action === 'aprobar' && approvedAmount <= 0}
                        >
                            {resolving?.action === 'aprobar' ? 'Aprobar' : resolving?.action === 'rechazar' ? 'Rechazar' : 'Entregar'}
                        </Button>
                        <Button variant="outline" onClick={() => setResolving(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    {resolving?.action === 'aprobar' && (
                        <Input type="number" label="Monto aprobado *" value={approvedAmount} onChange={(e) => setApprovedAmount(Number(e.target.value))} />
                    )}
                    {resolving?.action === 'entregar' && (
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={requiresRepayment} onChange={(e) => setRequiresRepayment(e.target.checked)} />
                            Requiere reintegro
                        </label>
                    )}
                    <Input
                        label={resolving?.action === 'rechazar' ? 'Motivo del rechazo *' : resolving?.action === 'entregar' ? 'Concepto' : 'Observaciones'}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};

