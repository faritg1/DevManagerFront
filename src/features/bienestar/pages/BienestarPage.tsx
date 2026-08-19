import React, { useState, useEffect } from 'react';
import {
    Heart, Plus, Loader2, AlertCircle, Calculator, Wallet, HandCoins,
    CheckCircle2, XCircle,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { bienestarService, usersService } from '../../../shared/api';
import {
    TipoAuxilio,
    type ProgramaBienestarDto,
    type SolicitudBienestarDto,
    type FondoSolidaridadDto,
    type AuxilioDto,
    type CreateProgramaBienestarDto,
    type UserResponse,
} from '../../../shared/api/types';

const currency = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const tipoAuxilioLabel: Record<number, string> = {
    [TipoAuxilio.AuxilioEconomico]: 'Auxilio económico',
    [TipoAuxilio.BecaEducativa]: 'Beca educativa',
    [TipoAuxilio.CreditoBlando]: 'Crédito blando',
    [TipoAuxilio.AuxilioFunerario]: 'Auxilio funerario',
    [TipoAuxilio.ApoyoVivienda]: 'Apoyo vivienda',
    [TipoAuxilio.Otro]: 'Otro',
};

const estadoBadge = (estado: number) => {
    switch (estado) {
        case 3: return <Badge variant="success">Aprobada</Badge>;
        case 4: return <Badge variant="danger">Rechazada</Badge>;
        case 5: return <Badge variant="info">Entregada</Badge>;
        case 2: return <Badge variant="warning">En evaluación</Badge>;
        default: return <Badge variant="default">Pendiente</Badge>;
    }
};

export const BienestarPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';
    const userId = user?.id ?? '';

    // Asociados para selectores
    const [asociados, setAsociados] = useState<UserResponse[]>([]);

    // Programas
    const [programas, setProgramas] = useState<ProgramaBienestarDto[]>([]);
    const [progLoading, setProgLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateProgramaBienestarDto>({
        organizationId: '',
        nombre: '',
        descripcion: '',
        presupuesto: 0,
        fechaInicio: new Date().toISOString().slice(0, 10),
    });

    // Solicitudes
    const [solAsociadoId, setSolAsociadoId] = useState('');
    const [solicitudes, setSolicitudes] = useState<SolicitudBienestarDto[]>([]);
    const [solLoading, setSolLoading] = useState(false);

    // Fondo
    const [fondo, setFondo] = useState<FondoSolidaridadDto | null>(null);
    const [fondoPeriodo, setFondoPeriodo] = useState(new Date().toISOString().slice(0, 10));
    const [fondoExcedentes, setFondoExcedentes] = useState(0);
    const [fondoLoading, setFondoLoading] = useState(false);
    const [calculoFondo, setCalculoFondo] = useState<FondoSolidaridadDto | null>(null);

    // Auxilios
    const [auxAsociadoId, setAuxAsociadoId] = useState('');
    const [auxilios, setAuxilios] = useState<AuxilioDto[]>([]);
    const [auxLoading, setAuxLoading] = useState(false);

    // Modal resolver solicitud
    const [resolving, setResolving] = useState<SolicitudBienestarDto | null>(null);
    const [resolveAction, setResolveAction] = useState<'aprobar' | 'rechazar'>('aprobar');
    const [montoAprobado, setMontoAprobado] = useState(0);
    const [observaciones, setObservaciones] = useState('');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        usersService.getAll().then(res => {
            if (res.success && res.data && res.data[0]) {
                setAsociados(res.data);
                setSolAsociadoId(res.data[0].id);
                setAuxAsociadoId(res.data[0].id);
            }
        }).catch(() => showNotification({ type: 'error', message: 'Error al cargar asociados' }));
        loadProgramas();
        loadFondo();
    }, [orgId]);

    const loadProgramas = async () => {
        if (!orgId) return;
        setProgLoading(true);
        try {
            const res = await bienestarService.getProgramas(orgId);
            if (res.success && res.data) setProgramas(res.data);
            else setError(res.message || 'Error al cargar programas');
        } catch {
            setError('Error de conexión al cargar programas');
        } finally {
            setProgLoading(false);
        }
    };

    const loadFondo = async () => {
        if (!orgId) return;
        setFondoLoading(true);
        try {
            const res = await bienestarService.getFondoActual(orgId);
            if (res.success) setFondo(res.data);
        } catch { /* sin fondo aún */ }
        finally { setFondoLoading(false); }
    };

    const loadSolicitudes = async () => {
        if (!solAsociadoId) return;
        setSolLoading(true);
        setError(null);
        try {
            const res = await bienestarService.getSolicitudesByAsociado(solAsociadoId);
            setSolicitudes(res.success && res.data ? res.data : []);
        } catch {
            setSolicitudes([]);
            setError('Error al cargar solicitudes');
        } finally {
            setSolLoading(false);
        }
    };

    const loadAuxilios = async () => {
        if (!auxAsociadoId) return;
        setAuxLoading(true);
        setError(null);
        try {
            const res = await bienestarService.getAuxiliosByAsociado(auxAsociadoId);
            setAuxilios(res.success && res.data ? res.data : []);
        } catch {
            setAuxilios([]);
            setError('Error al cargar auxilios');
        } finally {
            setAuxLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await bienestarService.createPrograma({ ...createForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Programa de bienestar creado' });
                setCreateOpen(false);
                setCreateForm({ organizationId: orgId, nombre: '', descripcion: '', presupuesto: 0, fechaInicio: new Date().toISOString().slice(0, 10) });
                loadProgramas();
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al crear programa' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const openResolve = (s: SolicitudBienestarDto, action: 'aprobar' | 'rechazar') => {
        setResolving(s);
        setResolveAction(action);
        setMontoAprobado(s.montoSolicitado);
        setObservaciones('');
    };

    const handleResolve = async () => {
        if (!resolving) return;
        try {
            const res = resolveAction === 'aprobar'
                ? await bienestarService.aprobarSolicitud(resolving.id, montoAprobado, userId)
                : await bienestarService.rechazarSolicitud(resolving.id, observaciones, userId);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: resolveAction === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada' });
                setResolving(null);
                loadSolicitudes();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo resolver la solicitud' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleCalcularFondo = async () => {
        if (!orgId || fondoExcedentes <= 0) return;
        setFondoLoading(true);
        setError(null);
        try {
            const res = await bienestarService.calcularAporteFondo(orgId, fondoPeriodo, fondoExcedentes);
            if (res.success && res.data) {
                setCalculoFondo(res.data);
                showNotification({ type: 'success', message: 'Aporte al fondo calculado' });
                loadFondo();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo calcular el fondo' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al calcular fondo' });
        } finally {
            setFondoLoading(false);
        }
    };

    const estadisticas = {
        programas: programas.length,
        solicitudes: solicitudes.length,
        auxilios: auxilios.length,
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Bienestar Cooperativo
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Programas de bienestar, solicitudes, auxilios y fondo de solidaridad.
                    </p>
                </div>
                <Button icon={Plus} onClick={() => { setCreateForm(f => ({ ...f, organizationId: orgId })); setCreateOpen(true); }}>
                    Nuevo Programa
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Programas" value={estadisticas.programas} icon={Heart} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />
                <StatCard title="Solicitudes" value={estadisticas.solicitudes} icon={HandCoins} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Auxilios" value={estadisticas.auxilios} icon={Wallet} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            {/* Fondo de solidaridad */}
            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fondo de Solidaridad</h2>
                </div>
                {fondo ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div><p className="text-xs text-slate-500">Saldo disponible</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(fondo.saldoDisponible)}</p></div>
                        <div><p className="text-xs text-slate-500">Aporte fondo</p><p className="font-bold">{currency(fondo.aporteFondo)}</p></div>
                        <div><p className="text-xs text-slate-500">Total desembolsado</p><p className="font-bold">{currency(fondo.totalDesembolsado)}</p></div>
                        <div><p className="text-xs text-slate-500">Total excedentes</p><p className="font-bold">{currency(fondo.totalExcedentes)}</p></div>
                    </div>
                ) : (
                    !fondoLoading && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sin fondo registrado para esta organización.</p>
                )}
                <div className="border-t border-slate-200 dark:border-[#233948] pt-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Calcular aporte (10% de excedentes)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input type="date" value={fondoPeriodo} onChange={(e) => setFondoPeriodo(e.target.value)} label="Período" />
                        <Input type="number" value={fondoExcedentes} onChange={(e) => setFondoExcedentes(Number(e.target.value))} label="Total excedentes" />
                        <div className="flex items-end">
                            <Button icon={Calculator} onClick={handleCalcularFondo} disabled={!orgId || fondoExcedentes <= 0 || fondoLoading}>
                                {fondoLoading ? 'Calculando...' : 'Calcular'}
                            </Button>
                        </div>
                    </div>
                    {calculoFondo && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div><p className="text-xs text-slate-500">Aporte fondo</p><p className="font-bold">{currency(calculoFondo.aporteFondo)}</p></div>
                            <div><p className="text-xs text-slate-500">Saldo disponible</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(calculoFondo.saldoDisponible)}</p></div>
                            <div><p className="text-xs text-slate-500">Vigente</p><p className="font-bold">{calculoFondo.vigente ? 'Sí' : 'No'}</p></div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Programas */}
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
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                            ) : programas.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay programas de bienestar</td></tr>
                            ) : (
                                programas.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                                            {p.descripcion && <p className="text-xs text-slate-500">{p.descripcion}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{currency(p.presupuesto)}</td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(p.fechaInicio)}</td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(p.fechaFin)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={p.activo ? 'success' : 'default'} dot>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Solicitudes */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <HandCoins className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Solicitudes por Asociado</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <select
                            value={solAsociadoId}
                            onChange={(e) => setSolAsociadoId(e.target.value)}
                            className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                        >
                            <option value="">Seleccionar asociado</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                        <Button variant="outline" onClick={loadSolicitudes} disabled={!solAsociadoId || solLoading}>
                            {solLoading ? 'Cargando...' : 'Consultar'}
                        </Button>
                    </div>
                    {solicitudes.length === 0 ? (
                        !solLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Sin solicitudes para la selección.</p>
                    ) : (
                        <div className="space-y-3">
                            {solicitudes.map(s => (
                                <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900 dark:text-white">{s.tipoAuxilioNombre}</p>
                                        {estadoBadge(s.estado)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{s.programaNombre || 'Sin programa'} · {formatDate(s.fechaRequerida)}</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{s.motivo}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{currency(s.montoSolicitado)}</p>
                                        {(s.estado === 1 || s.estado === 2) && (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="primary" onClick={() => openResolve(s, 'aprobar')}>
                                                    <CheckCircle2 size={14} /> Aprobar
                                                </Button>
                                                <Button size="sm" variant="danger" onClick={() => openResolve(s, 'rechazar')}>
                                                    <XCircle size={14} /> Rechazar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Auxilios */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Auxilios por Asociado</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <select
                            value={auxAsociadoId}
                            onChange={(e) => setAuxAsociadoId(e.target.value)}
                            className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                        >
                            <option value="">Seleccionar asociado</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                        <Button variant="outline" onClick={loadAuxilios} disabled={!auxAsociadoId || auxLoading}>
                            {auxLoading ? 'Cargando...' : 'Consultar'}
                        </Button>
                    </div>
                    {auxilios.length === 0 ? (
                        !auxLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Sin auxilios para la selección.</p>
                    ) : (
                        <div className="space-y-3">
                            {auxilios.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{a.tipoNombre}</p>
                                        <p className="text-xs text-slate-500">{a.concepto} · {formatDate(a.fechaEntrega)}</p>
                                    </div>
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(a.monto)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal crear programa */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Nuevo Programa de Bienestar"
                icon={<Heart className="text-rose-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreate}>Guardar</Button>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Input label="Nombre *" value={createForm.nombre} onChange={(e) => setCreateForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Fondo de auxilios funerarios" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Descripción</label>
                        <textarea
                            value={createForm.descripcion || ''}
                            onChange={(e) => setCreateForm(f => ({ ...f, descripcion: e.target.value }))}
                            className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2"
                            rows={3}
                        />
                    </div>
                    <Input type="number" label="Presupuesto *" value={createForm.presupuesto} onChange={(e) => setCreateForm(f => ({ ...f, presupuesto: Number(e.target.value) }))} />
                    <Input type="date" label="Fecha inicio *" value={createForm.fechaInicio} onChange={(e) => setCreateForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                    <Input type="date" label="Fecha fin" value={createForm.fechaFin || ''} onChange={(e) => setCreateForm(f => ({ ...f, fechaFin: e.target.value || null }))} />
                    <Input type="number" label="Máx. beneficiarios" value={createForm.maxBeneficiarios ?? ''} onChange={(e) => setCreateForm(f => ({ ...f, maxBeneficiarios: e.target.value ? Number(e.target.value) : null }))} />
                </div>
            </Modal>

            {/* Modal resolver solicitud */}
            <Modal
                isOpen={!!resolving}
                onClose={() => setResolving(null)}
                title={resolveAction === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
                icon={resolveAction === 'aprobar' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-rose-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button variant={resolveAction === 'aprobar' ? 'primary' : 'danger'} onClick={handleResolve}>
                            {resolveAction === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                        </Button>
                        <Button variant="outline" onClick={() => setResolving(null)}>Cancelar</Button>
                    </>
                }
            >
                {resolveAction === 'aprobar' ? (
                    <Input type="number" label="Monto aprobado *" value={montoAprobado} onChange={(e) => setMontoAprobado(Number(e.target.value))} />
                ) : (
                    <Input label="Observaciones *" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Motivo del rechazo" />
                )}
            </Modal>
        </div>
    );
};

export default BienestarPage;
