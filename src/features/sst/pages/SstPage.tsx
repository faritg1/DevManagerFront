import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Loader2, AlertCircle, FileText, Plus, Stethoscope,
    ClipboardCheck, ShieldCheck,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { sstService } from '../../../shared/api';
import type {
    ExamenMedicoDto,
    AccidenteDto,
    RiesgoDto,
    CreateRiesgoDto,
    ArlVigenciaResponse,
} from '../../../shared/api/types';

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

export const SstPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';

    const [examenes, setExamenes] = useState<ExamenMedicoDto[]>([]);
    const [riesgos, setRiesgos] = useState<RiesgoDto[]>([]);
    const [accidentes, setAccidentes] = useState<AccidenteDto[]>([]);
    const [arl, setArl] = useState<ArlVigenciaResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Registrar examen
    const [regExamen, setRegExamen] = useState<ExamenMedicoDto | null>(null);
    const [regResultado, setRegResultado] = useState('');
    const [regObservaciones, setRegObservaciones] = useState('');

    // Crear riesgo
    const [riesgoOpen, setRiesgoOpen] = useState(false);
    const [riesgoForm, setRiesgoForm] = useState<CreateRiesgoDto>({ organizationId: '', nivelRiesgo: 1, factor: '', descripcion: '', controles: '' });

    // Investigar accidente
    const [invAccidente, setInvAccidente] = useState<AccidenteDto | null>(null);
    const [invFecha, setInvFecha] = useState(new Date().toISOString().slice(0, 10));
    const [invConclusiones, setInvConclusiones] = useState('');
    const [invCausas, setInvCausas] = useState('');
    const [invMedidas, setInvMedidas] = useState('');

    const loadAll = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError(null);
        try {
            const [exRes, riRes, acRes, arlRes] = await Promise.all([
                sstService.getExamenesPendientes(orgId),
                sstService.getRiesgos(orgId),
                sstService.getAccidentesByOrganizacion(orgId),
                sstService.verificarVigenciaArl(orgId),
            ]);
            setExamenes(exRes.success && exRes.data ? exRes.data : []);
            setRiesgos(riRes.success && riRes.data ? riRes.data : []);
            setAccidentes(acRes.success && acRes.data ? acRes.data : []);
            if (arlRes.success) setArl(arlRes.data);
        } catch {
            setError('Error de conexión al cargar SST');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, [orgId]);

    const handleRegistrarExamen = async () => {
        if (!regExamen) return;
        try {
            const res = await sstService.registrarExamen(regExamen.id, regResultado, null, regObservaciones || null);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Resultado de examen registrado' });
                setRegExamen(null);
                setRegResultado('');
                setRegObservaciones('');
                loadAll();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo registrar el examen' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleCrearRiesgo = async () => {
        try {
            const res = await sstService.crearRiesgo({ ...riesgoForm, organizationId: orgId });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Riesgo agregado a la matriz' });
                setRiesgoOpen(false);
                setRiesgoForm({ organizationId: orgId, nivelRiesgo: 1, factor: '', descripcion: '', controles: '' });
                loadAll();
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al crear riesgo' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleInvestigar = async () => {
        if (!invAccidente) return;
        try {
            const res = await sstService.registrarInvestigacion(invAccidente.id, invFecha, invConclusiones, invCausas, invMedidas);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Investigación registrada' });
                setInvAccidente(null);
                setInvConclusiones('');
                setInvCausas('');
                setInvMedidas('');
                loadAll();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo registrar la investigación' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const pendientesInvestigacion = accidentes.filter(a => !a.investigacionCompletada);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Seguridad y Salud en el Trabajo (SST)
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Exámenes médicos, matriz de riesgos, accidentes (FURAT) y vigencia ARL.
                    </p>
                </div>
                <Button icon={Plus} onClick={() => { setRiesgoForm(f => ({ ...f, organizationId: orgId })); setRiesgoOpen(true); }}>
                    Agregar Riesgo
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            {arl && (
                <div className={`mb-6 p-4 rounded-xl border text-sm ${arl.vigente ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'}`}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} />
                        <span className="font-bold">ARL: {arl.vigente ? 'Vigente' : 'Vencida'}</span>
                        <span>· {arl.diasRestantes} días restantes</span>
                    </div>
                    {arl.alerta && <p className="mt-1">{arl.alerta}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Exámenes pendientes" value={examenes.length} icon={Stethoscope} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Riesgos" value={riesgos.length} icon={ShieldAlert} iconColor="text-orange-500" iconBgColor="bg-orange-100 dark:bg-orange-500/10" />
                <StatCard title="Accidentes sin investigar" value={pendientesInvestigacion.length} icon={AlertCircle} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Exámenes pendientes */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Stethoscope className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Exámenes Médicos Pendientes</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : examenes.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin exámenes pendientes.</p>
                    ) : (
                        <div className="space-y-3">
                            {examenes.map(e => (
                                <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{e.tipoExamenNombre}</p>
                                        <p className="text-xs text-slate-500">Programado: {formatDate(e.fechaProgramado)} · Asociado: {e.asociadoId}</p>
                                    </div>
                                    <Button size="sm" onClick={() => { setRegExamen(e); setRegResultado(''); setRegObservaciones(''); }}>Registrar</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Matriz de riesgos */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="text-orange-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Matriz de Riesgos</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : riesgos.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin riesgos registrados.</p>
                    ) : (
                        <div className="space-y-3">
                            {riesgos.map(r => (
                                <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900 dark:text-white">{r.factor}</p>
                                        <Badge variant={r.nivelRiesgo >= 3 ? 'danger' : r.nivelRiesgo === 2 ? 'warning' : 'success'}>
                                            Nivel {r.nivelRiesgo}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{r.descripcion}</p>
                                    {r.controles && <p className="text-xs text-slate-500 mt-1"><ClipboardCheck size={12} className="inline" /> {r.controles}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Accidentes */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="text-rose-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Accidentes de Trabajo (FURAT)</h2>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : accidentes.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin accidentes registrados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Gravedad</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">ARL</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                                {accidentes.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4 text-slate-500">{formatDate(a.fecha)}</td>
                                        <td className="px-6 py-4 text-slate-500">{a.tipo}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={a.gravedad >= 2 ? 'danger' : 'warning'}>{a.gravedadNombre}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{a.arl}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={a.investigacionCompletada ? 'success' : 'warning'} dot>
                                                {a.investigacionCompletada ? 'Investigado' : 'Pendiente'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {!a.investigacionCompletada && (
                                                <Button size="sm" variant="outline" onClick={() => { setInvAccidente(a); setInvFecha(new Date().toISOString().slice(0, 10)); setInvConclusiones(''); setInvCausas(''); setInvMedidas(''); }}>
                                                    Investigar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal registrar examen */}
            <Modal
                isOpen={!!regExamen}
                onClose={() => setRegExamen(null)}
                title="Registrar Resultado de Examen"
                icon={<Stethoscope className="text-blue-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleRegistrarExamen}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRegExamen(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input label="Resultado *" value={regResultado} onChange={(e) => setRegResultado(e.target.value)} placeholder="Ej: Apto / No apto" />
                    <Input label="Observaciones" value={regObservaciones} onChange={(e) => setRegObservaciones(e.target.value)} />
                </div>
            </Modal>

            {/* Modal crear riesgo */}
            <Modal
                isOpen={riesgoOpen}
                onClose={() => setRiesgoOpen(false)}
                title="Agregar Riesgo"
                icon={<ShieldAlert className="text-orange-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCrearRiesgo}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRiesgoOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input type="number" label="Nivel de riesgo *" value={riesgoForm.nivelRiesgo} onChange={(e) => setRiesgoForm(f => ({ ...f, nivelRiesgo: Number(e.target.value) }))} min={1} max={5} />
                    <Input label="Factor *" value={riesgoForm.factor} onChange={(e) => setRiesgoForm(f => ({ ...f, factor: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Descripción *</label>
                        <textarea
                            value={riesgoForm.descripcion}
                            onChange={(e) => setRiesgoForm(f => ({ ...f, descripcion: e.target.value }))}
                            className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2"
                            rows={3}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Controles</label>
                        <textarea
                            value={riesgoForm.controles || ''}
                            onChange={(e) => setRiesgoForm(f => ({ ...f, controles: e.target.value }))}
                            className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2"
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal investigar accidente */}
            <Modal
                isOpen={!!invAccidente}
                onClose={() => setInvAccidente(null)}
                title="Investigar Accidente"
                icon={<ClipboardCheck className="text-rose-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleInvestigar}>Guardar Investigación</Button>
                        <Button variant="outline" onClick={() => setInvAccidente(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Fecha de investigación *" value={invFecha} onChange={(e) => setInvFecha(e.target.value)} />
                    <Input label="Conclusiones *" value={invConclusiones} onChange={(e) => setInvConclusiones(e.target.value)} />
                    <Input label="Causas *" value={invCausas} onChange={(e) => setInvCausas(e.target.value)} />
                    <Input label="Medidas correctivas *" value={invMedidas} onChange={(e) => setInvMedidas(e.target.value)} />
                </div>
            </Modal>
        </div>
    );
};

export default SstPage;
