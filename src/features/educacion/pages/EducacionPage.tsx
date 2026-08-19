import React, { useState, useEffect } from 'react';
import {
    GraduationCap, Plus, Loader2, AlertCircle, UserPlus, Clock, CheckCircle2,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { gestionHumanaService, usersService } from '../../../shared/api';
import {
    TipoEducacion,
    type ProgramaEducacionDto,
    type AsociadoEducacionDto,
    type CreateProgramaEducacionDto,
    type CreateAsociadoEducacionDto,
    type UserResponse,
} from '../../../shared/api/types';

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const tipoEducacionLabel: Record<number, string> = {
    [TipoEducacion.Basica]: 'Básica',
    [TipoEducacion.Avanzada]: 'Avanzada',
    [TipoEducacion.Especializada]: 'Especializada',
};

const tipoBadge = (tipo: number) => {
    switch (tipo) {
        case TipoEducacion.Basica: return <Badge variant="info">Básica</Badge>;
        case TipoEducacion.Avanzada: return <Badge variant="warning">Avanzada</Badge>;
        case TipoEducacion.Especializada: return <Badge variant="purple">Especializada</Badge>;
        default: return <Badge>—</Badge>;
    }
};

export const EducacionPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';
    const anioActual = new Date().getFullYear();

    const [asociados, setAsociados] = useState<UserResponse[]>([]);

    // Programas
    const [programas, setProgramas] = useState<ProgramaEducacionDto[]>([]);
    const [progLoading, setProgLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateProgramaEducacionDto>({
        organizationId: '',
        nombre: '',
        descripcion: '',
        tipo: TipoEducacion.Basica,
        horas: 0,
        esObligatorio: true,
        fechaInicio: new Date().toISOString().slice(0, 10),
    });

    // Inscripción
    const [insForm, setInsForm] = useState<CreateAsociadoEducacionDto>({ asociadoId: '', programaEducacionId: '', organizationId: '' });
    const [insOpen, setInsOpen] = useState(false);

    // Historial
    const [histAsociadoId, setHistAsociadoId] = useState('');
    const [historial, setHistorial] = useState<AsociadoEducacionDto[]>([]);
    const [histLoading, setHistLoading] = useState(false);

    // Cumplimiento
    const [cumAsociadoId, setCumAsociadoId] = useState('');
    const [cumAnio, setCumAnio] = useState(anioActual);
    const [cumResultado, setCumResultado] = useState<boolean | null>(null);
    const [cumLoading, setCumLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        usersService.getAll().then(res => {
            if (res.success && res.data && res.data[0]) {
                setAsociados(res.data);
                setHistAsociadoId(res.data[0].id);
                setCumAsociadoId(res.data[0].id);
            }
        }).catch(() => showNotification({ type: 'error', message: 'Error al cargar asociados' }));
        loadProgramas();
    }, [orgId]);

    const loadProgramas = async () => {
        if (!orgId) return;
        setProgLoading(true);
        try {
            const res = await gestionHumanaService.getProgramasEducacion(orgId);
            if (res.success && res.data) setProgramas(res.data);
            else setError(res.message || 'Error al cargar programas');
        } catch {
            setError('Error de conexión al cargar programas');
        } finally {
            setProgLoading(false);
        }
    };

    const loadHistorial = async () => {
        if (!histAsociadoId) return;
        setHistLoading(true);
        setError(null);
        try {
            const res = await gestionHumanaService.getHistorialEducacion(histAsociadoId);
            setHistorial(res.success && res.data ? res.data : []);
        } catch {
            setHistorial([]);
            setError('Error al cargar historial');
        } finally {
            setHistLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await gestionHumanaService.createProgramaEducacion({ ...createForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Programa educativo creado' });
                setCreateOpen(false);
                setCreateForm({ organizationId: orgId, nombre: '', descripcion: '', tipo: TipoEducacion.Basica, horas: 0, esObligatorio: true, fechaInicio: new Date().toISOString().slice(0, 10) });
                loadProgramas();
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al crear programa' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleInscribir = async () => {
        if (!insForm.asociadoId || !insForm.programaEducacionId) {
            showNotification({ type: 'warning', message: 'Selecciona asociado y programa' });
            return;
        }
        try {
            const res = await gestionHumanaService.inscribirEducacion({ ...insForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Asociado inscrito' });
                setInsOpen(false);
                setInsForm({ asociadoId: '', programaEducacionId: '', organizationId: orgId });
                loadHistorial();
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al inscribir' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleCumplimiento = async () => {
        if (!cumAsociadoId) return;
        setCumLoading(true);
        setError(null);
        try {
            const res = await gestionHumanaService.cumpleMinimoHoras(cumAsociadoId, cumAnio);
            setCumResultado(res.success ? res.data : null);
        } catch {
            setCumResultado(null);
            setError('Error al verificar cumplimiento');
        } finally {
            setCumLoading(false);
        }
    };

    const estadisticas = {
        programas: programas.length,
        inscritos: historial.length,
        historial: historial.length,
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Educación Cooperativa
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Programas educativos, inscripciones y cumplimiento de horas mínimas anuales (20h).
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={UserPlus} onClick={() => { setInsForm(f => ({ ...f, organizationId: orgId })); setInsOpen(true); }}>
                        Inscribir
                    </Button>
                    <Button icon={Plus} onClick={() => { setCreateForm(f => ({ ...f, organizationId: orgId })); setCreateOpen(true); }}>
                        Nuevo Programa
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard title="Programas" value={estadisticas.programas} icon={GraduationCap} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Registros historial" value={estadisticas.historial} icon={Clock} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Programas */}
                <Card padding="none" className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-[#233948] flex items-center gap-2">
                        <GraduationCap className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Programas Educativos</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Programa</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Horas</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                                {progLoading ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500"><Loader2 className="inline animate-spin" /> Cargando...</td></tr>
                                ) : programas.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No hay programas educativos</td></tr>
                                ) : (
                                    programas.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                                                {p.descripcion && <p className="text-xs text-slate-500">{p.descripcion}</p>}
                                            </td>
                                            <td className="px-6 py-4">{tipoBadge(p.tipo)}</td>
                                            <td className="px-6 py-4 text-slate-500">{p.horas}h</td>
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

                {/* Cumplimiento */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cumplimiento de Horas</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <select
                            value={cumAsociadoId}
                            onChange={(e) => setCumAsociadoId(e.target.value)}
                            className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                        >
                            <option value="">Asociado</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                        <Input type="number" value={cumAnio} onChange={(e) => setCumAnio(Number(e.target.value))} placeholder="Año" />
                        <Button variant="outline" onClick={handleCumplimiento} disabled={!cumAsociadoId || cumLoading}>
                            {cumLoading ? 'Verificando...' : 'Verificar'}
                        </Button>
                    </div>
                    {cumResultado !== null && (
                        <div className={`p-4 rounded-xl ${cumResultado ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'}`}>
                            <p className="font-bold text-slate-900 dark:text-white">
                                {cumResultado ? 'Cumple las 20 horas mínimas anuales' : 'No cumple las 20 horas mínimas anuales'}
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Historial */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial Educativo por Asociado</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <select
                        value={histAsociadoId}
                        onChange={(e) => setHistAsociadoId(e.target.value)}
                        className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                    >
                        <option value="">Seleccionar asociado</option>
                        {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                    </select>
                    <Button variant="outline" onClick={loadHistorial} disabled={!histAsociadoId || histLoading}>
                        {histLoading ? 'Cargando...' : 'Consultar'}
                    </Button>
                </div>
                {historial.length === 0 ? (
                    !histLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Sin historial educativo para la selección.</p>
                ) : (
                    <div className="space-y-3">
                        {historial.map(h => (
                            <div key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-900 dark:text-white">{h.programaNombre || 'Programa'}</p>
                                    <Badge variant={h.completado ? 'success' : 'default'} dot>{h.completado ? 'Completado' : 'En curso'}</Badge>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-slate-500">{h.tipoEducacion || '—'} · {formatDate(h.fechaInscripcion)}</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {h.horasCursadas}/{h.horasPrograma}h ({Math.round(h.progreso)}%)
                                    </p>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-[#233948] overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(h.progreso, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal crear programa */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Nuevo Programa Educativo"
                icon={<GraduationCap className="text-blue-500" size={20} />}
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
                        <Input label="Nombre *" value={createForm.nombre} onChange={(e) => setCreateForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Curso de liderazgo cooperativo" />
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
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo *</label>
                        <select
                            value={createForm.tipo}
                            onChange={(e) => setCreateForm(f => ({ ...f, tipo: Number(e.target.value) as TipoEducacion }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value={TipoEducacion.Basica}>Básica</option>
                            <option value={TipoEducacion.Avanzada}>Avanzada</option>
                            <option value={TipoEducacion.Especializada}>Especializada</option>
                        </select>
                    </div>
                    <Input type="number" label="Horas *" value={createForm.horas} onChange={(e) => setCreateForm(f => ({ ...f, horas: Number(e.target.value) }))} />
                    <Input type="date" label="Fecha inicio *" value={createForm.fechaInicio} onChange={(e) => setCreateForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                    <Input type="date" label="Fecha fin" value={createForm.fechaFin || ''} onChange={(e) => setCreateForm(f => ({ ...f, fechaFin: e.target.value || null }))} />
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Obligatorio</label>
                        <div className="flex gap-4 mt-3">
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input type="radio" checked={createForm.esObligatorio} onChange={() => setCreateForm(f => ({ ...f, esObligatorio: true }))} /> Sí
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input type="radio" checked={!createForm.esObligatorio} onChange={() => setCreateForm(f => ({ ...f, esObligatorio: false }))} /> No
                            </label>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal inscribir */}
            <Modal
                isOpen={insOpen}
                onClose={() => setInsOpen(false)}
                title="Inscribir Asociado"
                icon={<UserPlus className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleInscribir}>Inscribir</Button>
                        <Button variant="outline" onClick={() => setInsOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Asociado *</label>
                        <select
                            value={insForm.asociadoId}
                            onChange={(e) => setInsForm(f => ({ ...f, asociadoId: e.target.value }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value="">Seleccionar</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Programa *</label>
                        <select
                            value={insForm.programaEducacionId}
                            onChange={(e) => setInsForm(f => ({ ...f, programaEducacionId: e.target.value }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value="">Seleccionar</option>
                            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.horas}h)</option>)}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EducacionPage;
