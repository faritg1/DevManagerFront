import React, { useState, useEffect } from 'react';
import {
    FileLock2, Loader2, AlertCircle, Plus, ShieldCheck, FileText,
    CheckCircle2, XCircle,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { habeasDataService, usersService } from '../../../shared/api';
import {
    TipoSolicitudARCO,
    type AutorizacionDto,
    type SolicitudARCODto,
    type CreateAutorizacionDto,
    type CreateSolicitudARCODto,
    type UserResponse,
} from '../../../shared/api/types';

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const arcoTipoLabel: Record<number, string> = {
    [TipoSolicitudARCO.Acceso]: 'Acceso',
    [TipoSolicitudARCO.Rectificacion]: 'Rectificación',
    [TipoSolicitudARCO.Cancelacion]: 'Cancelación',
    [TipoSolicitudARCO.Oposicion]: 'Oposición',
};

export const HabeasDataPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';

    const [asociados, setAsociados] = useState<UserResponse[]>([]);
    const [pendientes, setPendientes] = useState<SolicitudARCODto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Autorización
    const [authAsociadoId, setAuthAsociadoId] = useState('');
    const [authVigente, setAuthVigente] = useState<AutorizacionDto | null>(null);
    const [authOpen, setAuthOpen] = useState(false);
    const [authForm, setAuthForm] = useState<CreateAutorizacionDto>({ asociadoId: '', organizationId: '', finalidad: '', medioAutorizacion: 'Digital' });

    // Solicitud ARCO
    const [arcoAsociadoId, setArcoAsociadoId] = useState('');
    const [arcoOpen, setArcoOpen] = useState(false);
    const [arcoForm, setArcoForm] = useState<CreateSolicitudARCODto>({ asociadoId: '', organizationId: '', tipo: TipoSolicitudARCO.Acceso, descripcion: '' });

    // Atender ARCO
    const [atender, setAtender] = useState<SolicitudARCODto | null>(null);
    const [atenderAction, setAtenderAction] = useState<'atender' | 'rechazar'>('atender');
    const [respuesta, setRespuesta] = useState('');
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const loadPendientes = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await habeasDataService.getSolicitudesARCOPendientes(orgId);
            setPendientes(res.success && res.data ? res.data : []);
        } catch {
            setPendientes([]);
            setError('Error al cargar solicitudes ARCO');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        usersService.getAll().then(res => {
            if (res.success && res.data && res.data[0]) {
                setAsociados(res.data);
                setAuthAsociadoId(res.data[0].id);
                setArcoAsociadoId(res.data[0].id);
            }
        }).catch(() => showNotification({ type: 'error', message: 'Error al cargar asociados' }));
        loadPendientes();
    }, [orgId]);

    const verificarVigente = async () => {
        if (!authAsociadoId) return;
        setError(null);
        try {
            const res = await habeasDataService.getAutorizacionVigente(authAsociadoId);
            setAuthVigente(res.success ? res.data : null);
        } catch {
            setAuthVigente(null);
            setError('Error al verificar autorización');
        }
    };

    const handleRegistrarAutorizacion = async () => {
        try {
            const res = await habeasDataService.registrarAutorizacion({ ...authForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Autorización registrada' });
                setAuthOpen(false);
                setAuthForm({ asociadoId: authAsociadoId, organizationId: orgId, finalidad: '', medioAutorizacion: 'Digital' });
                verificarVigente();
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al registrar autorización' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleCrearARCO = async () => {
        try {
            const res = await habeasDataService.crearSolicitudARCO({ ...arcoForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Solicitud ARCO creada' });
                setArcoOpen(false);
                setArcoForm({ asociadoId: arcoAsociadoId, organizationId: orgId, tipo: TipoSolicitudARCO.Acceso, descripcion: '' });
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al crear solicitud ARCO' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleAtender = async () => {
        if (!atender) return;
        try {
            const res = await habeasDataService.atenderSolicitudARCO(atender.id, respuesta);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Solicitud ARCO atendida' });
                setAtender(null);
                setRespuesta('');
                loadPendientes();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo atender la solicitud' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleRechazar = async () => {
        if (!atender) return;
        try {
            const res = await habeasDataService.rechazarSolicitudARCO(atender.id, motivoRechazo);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Solicitud ARCO rechazada' });
                setAtender(null);
                setMotivoRechazo('');
                loadPendientes();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo rechazar la solicitud' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Habeas Data
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Autorizaciones de tratamiento de datos y solicitudes ARCO (Ley 1581/2012).
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FileText} onClick={() => { setArcoForm(f => ({ ...f, asociadoId: arcoAsociadoId, organizationId: orgId })); setArcoOpen(true); }}>
                        Crear Solicitud ARCO
                    </Button>
                    <Button icon={Plus} onClick={() => { setAuthForm(f => ({ ...f, asociadoId: authAsociadoId, organizationId: orgId })); setAuthOpen(true); }}>
                        Registrar Autorización
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard title="ARCO pendientes" value={pendientes.length} icon={FileText} iconColor="text-orange-500" iconBgColor="bg-orange-100 dark:bg-orange-500/10" />
                <StatCard title="Autorización" value={authVigente ? 'Vigente' : '—'} icon={ShieldCheck} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Verificación de autorización */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="text-emerald-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verificar Autorización Vigente</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <select
                            value={authAsociadoId}
                            onChange={(e) => setAuthAsociadoId(e.target.value)}
                            className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                        >
                            <option value="">Asociado</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                        <Button variant="outline" onClick={verificarVigente} disabled={!authAsociadoId}>Verificar</Button>
                    </div>
                    {authVigente && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                            <p className="font-bold text-slate-900 dark:text-white">Autorización vigente</p>
                            <p className="text-sm text-slate-500 mt-1">{authVigente.finalidad}</p>
                            <p className="text-xs text-slate-500 mt-1">Medio: {authVigente.medioAutorizacion} · {formatDate(authVigente.fechaAutorizacion)}</p>
                        </div>
                    )}
                    {!authVigente && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin autorización vigente para este asociado.</p>
                    )}
                </Card>

                {/* ARCO pendientes */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <FileLock2 className="text-orange-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Solicitudes ARCO Pendientes</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : pendientes.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin solicitudes ARCO pendientes.</p>
                    ) : (
                        <div className="space-y-3">
                            {pendientes.map(s => (
                                <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900 dark:text-white">{arcoTipoLabel[s.tipo] || s.tipoNombre}</p>
                                        <Badge variant="warning">Pendiente</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{asociados.find(a => a.id === s.asociadoId)?.fullName || s.asociadoId}</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{s.descripcion}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" onClick={() => { setAtender(s); setAtenderAction('atender'); setRespuesta(''); setMotivoRechazo(''); }}>
                                            <CheckCircle2 size={14} /> Atender
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => { setAtender(s); setAtenderAction('rechazar'); setMotivoRechazo(''); setRespuesta(''); }}>
                                            <XCircle size={14} /> Rechazar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal autorización */}
            <Modal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                title="Registrar Autorización"
                icon={<ShieldCheck className="text-emerald-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleRegistrarAutorizacion}>Guardar</Button>
                        <Button variant="outline" onClick={() => setAuthOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Asociado *</label>
                        <select
                            value={authForm.asociadoId}
                            onChange={(e) => setAuthForm(f => ({ ...f, asociadoId: e.target.value }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value="">Seleccionar</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                    </div>
                    <Input label="Finalidad *" value={authForm.finalidad} onChange={(e) => setAuthForm(f => ({ ...f, finalidad: e.target.value }))} placeholder="Ej: Tratamiento de datos personales" />
                    <Input label="Medio de autorización" value={authForm.medioAutorizacion || ''} onChange={(e) => setAuthForm(f => ({ ...f, medioAutorizacion: e.target.value }))} />
                </div>
            </Modal>

            {/* Modal solicitud ARCO */}
            <Modal
                isOpen={arcoOpen}
                onClose={() => setArcoOpen(false)}
                title="Crear Solicitud ARCO"
                icon={<FileLock2 className="text-orange-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleCrearARCO}>Guardar</Button>
                        <Button variant="outline" onClick={() => setArcoOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Asociado *</label>
                        <select
                            value={arcoForm.asociadoId}
                            onChange={(e) => setArcoForm(f => ({ ...f, asociadoId: e.target.value }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value="">Seleccionar</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo *</label>
                        <select
                            value={arcoForm.tipo}
                            onChange={(e) => setArcoForm(f => ({ ...f, tipo: Number(e.target.value) as TipoSolicitudARCO }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value={TipoSolicitudARCO.Acceso}>Acceso</option>
                            <option value={TipoSolicitudARCO.Rectificacion}>Rectificación</option>
                            <option value={TipoSolicitudARCO.Cancelacion}>Cancelación</option>
                            <option value={TipoSolicitudARCO.Oposicion}>Oposición</option>
                        </select>
                    </div>
                    <Input label="Descripción *" value={arcoForm.descripcion} onChange={(e) => setArcoForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>
            </Modal>

            {/* Modal atender/rechazar ARCO */}
            <Modal
                isOpen={!!atender}
                onClose={() => setAtender(null)}
                title={atenderAction === 'atender' ? 'Atender Solicitud ARCO' : 'Rechazar Solicitud ARCO'}
                icon={<FileLock2 className="text-orange-500" size={20} />}
                size="md"
                footer={
                    <>
                        {atenderAction === 'atender'
                            ? <Button onClick={handleAtender} disabled={!respuesta}>Atender</Button>
                            : <Button variant="danger" onClick={handleRechazar} disabled={!motivoRechazo}>Rechazar</Button>}
                        <Button variant="outline" onClick={() => setAtender(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input label={atenderAction === 'atender' ? 'Respuesta *' : 'Motivo de rechazo *'} value={atenderAction === 'atender' ? respuesta : motivoRechazo} onChange={(e) => atenderAction === 'atender' ? setRespuesta(e.target.value) : setMotivoRechazo(e.target.value)} />
                </div>
            </Modal>
        </div>
    );
};

export default HabeasDataPage;
