import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, Calculator, FileSpreadsheet } from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { nominaService, usersService } from '../../../shared/api';
import {
    CompensacionModelo,
    type CompensacionDto,
    type CreateCompensacionDto,
    type PilaAporteDto,
    type UserResponse,
} from '../../../shared/api/types';

const modeloLabel: Record<number, string> = {
    [CompensacionModelo.DiasPorTarifa]: 'Días por tarifa',
    [CompensacionModelo.FijoMensual]: 'Fijo mensual',
    [CompensacionModelo.PorProyecto]: 'Por proyecto',
};

const currency = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const NominaPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';

    // Asociados para los selectores
    const [asociados, setAsociados] = useState<UserResponse[]>([]);

    // Compensación
    const [compAsociadoId, setCompAsociadoId] = useState('');
    const [compAnio, setCompAnio] = useState(new Date().getFullYear());
    const [compensaciones, setCompensaciones] = useState<CompensacionDto[]>([]);
    const [compLoading, setCompLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateCompensacionDto>({
        asociadoId: '',
        organizationId: '',
        periodo: new Date().toISOString().slice(0, 10),
        modelo: CompensacionModelo.DiasPorTarifa,
        valorBase: 0,
    });

    // PILA
    const [pilaAnio, setPilaAnio] = useState(new Date().getFullYear());
    const [pilaMes, setPilaMes] = useState(new Date().getMonth() + 1);
    const [planilla, setPlanilla] = useState<PilaAporteDto[]>([]);
    const [pilaLoading, setPilaLoading] = useState(false);
    const [pilaAsociadoId, setPilaAsociadoId] = useState('');
    const [pilaIngresos, setPilaIngresos] = useState<number>(0);
    const [pilaRiesgo, setPilaRiesgo] = useState(1);
    const [pilaResultado, setPilaResultado] = useState<PilaAporteDto | null>(null);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        usersService.getAll().then(res => {
            if (res.success && res.data) {
                setAsociados(res.data);
                if (res.data[0]) {
                    setCompAsociadoId(res.data[0].id);
                    setPilaAsociadoId(res.data[0].id);
                    setCreateForm(f => ({ ...f, asociadoId: res.data![0].id, organizationId: orgId }));
                }
            }
        }).catch(() => {
            showNotification({ type: 'error', message: 'Error al cargar asociados' });
        });
    }, [orgId]);

    const loadCompensaciones = async () => {
        if (!compAsociadoId) return;
        setCompLoading(true);
        setError(null);
        try {
            const res = await nominaService.getCompensacionesByAsociado(compAsociadoId, compAnio);
            if (res.success && res.data) {
                setCompensaciones(res.data);
            } else {
                setCompensaciones([]);
                setError(res.message || 'Sin datos de compensación');
            }
        } catch (e) {
            console.error(e);
            setCompensaciones([]);
            setError('Error de conexión al consultar compensaciones');
        } finally {
            setCompLoading(false);
        }
    };

    const loadPlanilla = async () => {
        if (!orgId) return;
        setPilaLoading(true);
        setError(null);
        try {
            const res = await nominaService.getPilaPlanilla(orgId, pilaAnio, pilaMes);
            if (res.success && res.data) {
                setPlanilla(res.data);
            } else {
                setPlanilla([]);
                setError(res.message || 'Sin datos de planilla');
            }
        } catch (e) {
            console.error(e);
            setPlanilla([]);
            setError('Error de conexión al consultar planilla PILA');
        } finally {
            setPilaLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await nominaService.createCompensacion(createForm);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Compensación creada' });
                setCreateOpen(false);
                setCompAnio(new Date(createForm.periodo).getFullYear());
                loadCompensaciones();
            } else {
                showNotification({ type: 'error', message: res.message || 'Error al crear compensación' });
            }
        } catch (e) {
            console.error(e);
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleCalcularPila = async () => {
        if (!pilaAsociadoId) return;
        setError(null);
        try {
            const res = await nominaService.calcularPila(pilaAsociadoId, pilaIngresos, pilaRiesgo);
            if (res.success && res.data) {
                setPilaResultado(res.data);
            } else {
                setPilaResultado(null);
                showNotification({ type: 'error', message: res.message || 'No se pudo calcular PILA' });
            }
        } catch (e) {
            console.error(e);
            showNotification({ type: 'error', message: 'Error de conexión al calcular PILA' });
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Nómina Solidaria
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Compensación de asociados (CTAs) y aportes PILA.
                    </p>
                </div>
                <Button icon={Plus} onClick={() => { setCreateForm(f => ({ ...f, asociadoId: compAsociadoId, organizationId: orgId })); setCreateOpen(true); }}>
                    Nueva Compensación
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compensación */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <FileSpreadsheet className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Compensación</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <select
                            value={compAsociadoId}
                            onChange={(e) => setCompAsociadoId(e.target.value)}
                            className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                        >
                            <option value="">Seleccionar asociado</option>
                            {asociados.map(a => (
                                <option key={a.id} value={a.id}>{a.fullName}</option>
                            ))}
                        </select>
                        <Input
                            type="number"
                            value={compAnio}
                            onChange={(e) => setCompAnio(Number(e.target.value))}
                            placeholder="Año"
                        />
                        <Button variant="outline" onClick={loadCompensaciones} disabled={!compAsociadoId || compLoading}>
                            {compLoading ? 'Cargando...' : 'Consultar'}
                        </Button>
                    </div>
                    {compensaciones.length > 0 ? (
                        <div className="space-y-3">
                            {compensaciones.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{modeloLabel[c.modelo] || 'Modelo'}</p>
                                        <p className="text-xs text-slate-500">{new Date(c.periodo).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(c.valorCalculado)}</p>
                                        <p className="text-xs text-slate-500">Base: {currency(c.valorBase)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !compLoading && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Sin registros de compensación para la selección.</p>
                        )
                    )}
                </Card>

                {/* PILA */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Planilla PILA</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                        <Input type="number" value={pilaAnio} onChange={(e) => setPilaAnio(Number(e.target.value))} placeholder="Año" />
                        <Input type="number" value={pilaMes} onChange={(e) => setPilaMes(Number(e.target.value))} min={1} max={12} placeholder="Mes" />
                        <Button variant="outline" onClick={loadPlanilla} disabled={!orgId || pilaLoading}>
                            {pilaLoading ? 'Cargando...' : 'Planilla'}
                        </Button>
                    </div>

                    <div className="border-t border-slate-200 dark:border-[#233948] pt-4 mt-2">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Calcular aporte individual</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <select
                                value={pilaAsociadoId}
                                onChange={(e) => setPilaAsociadoId(e.target.value)}
                                className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                            >
                                <option value="">Asociado</option>
                                {asociados.map(a => (
                                    <option key={a.id} value={a.id}>{a.fullName}</option>
                                ))}
                            </select>
                            <Input type="number" value={pilaIngresos} onChange={(e) => setPilaIngresos(Number(e.target.value))} placeholder="Ingreso base" />
                        </div>
                        <div className="flex items-end gap-3">
                            <Input type="number" value={pilaRiesgo} onChange={(e) => setPilaRiesgo(Number(e.target.value))} min={1} max={5} placeholder="Nivel riesgo ARL" />
                            <Button onClick={handleCalcularPila} disabled={!pilaAsociadoId || pilaIngresos <= 0}>Calcular</Button>
                        </div>

                        {pilaResultado && (
                            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div><p className="text-xs text-slate-500">EPS</p><p className="font-bold">{currency(pilaResultado.aporteEPS)}</p></div>
                                <div><p className="text-xs text-slate-500">Pensión</p><p className="font-bold">{currency(pilaResultado.aportePension)}</p></div>
                                <div><p className="text-xs text-slate-500">ARL</p><p className="font-bold">{currency(pilaResultado.aporteARL)}</p></div>
                                <div className="col-span-2 sm:col-span-3"><p className="text-xs text-slate-500">Total</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{currency(pilaResultado.total)}</p></div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Planilla table */}
            {planilla.length > 0 && (
                <Card padding="none" className="overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Asociado</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Ingreso base</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">EPS</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Pensión</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">ARL</th>
                                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                                {planilla.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {asociados.find(a => a.id === p.asociadoId)?.fullName || p.asociadoId}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{currency(p.ingresoBase)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(p.aporteEPS)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(p.aportePension)}</td>
                                        <td className="px-6 py-4 text-slate-500">{currency(p.aporteARL)}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{currency(p.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Create Compensación modal */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Nueva Compensación"
                icon={<Plus className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreate}>Guardar</Button>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                        value={createForm.asociadoId}
                        onChange={(e) => setCreateForm(f => ({ ...f, asociadoId: e.target.value }))}
                        className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                    >
                        <option value="">Asociado *</option>
                        {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                    </select>
                    <Input
                        type="date"
                        label="Período *"
                        value={createForm.periodo}
                        onChange={(e) => setCreateForm(f => ({ ...f, periodo: e.target.value }))}
                    />
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Modelo *</label>
                        <select
                            value={createForm.modelo}
                            onChange={(e) => setCreateForm(f => ({ ...f, modelo: Number(e.target.value) as CompensacionModelo }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            <option value={CompensacionModelo.DiasPorTarifa}>Días por tarifa</option>
                            <option value={CompensacionModelo.FijoMensual}>Fijo mensual</option>
                            <option value={CompensacionModelo.PorProyecto}>Por proyecto</option>
                        </select>
                    </div>
                    <Input
                        type="number"
                        label="Valor base *"
                        value={createForm.valorBase}
                        onChange={(e) => setCreateForm(f => ({ ...f, valorBase: Number(e.target.value) }))}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default NominaPage;
