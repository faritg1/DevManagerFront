import React, { useState, useEffect } from 'react';
import {
    Scale, Loader2, AlertCircle, Calculator, TrendingUp, TrendingDown, Users,
} from 'lucide-react';
import { Card, Badge, Button, Input, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { balanceSocialService, usersService } from '../../../shared/api';
import type { IndicadorBalanceSocialDto, UserResponse } from '../../../shared/api/types';

const currency = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const BalanceSocialPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';
    const anioActual = new Date().getFullYear();

    const [anio, setAnio] = useState(anioActual);
    const [indicadores, setIndicadores] = useState<IndicadorBalanceSocialDto[]>([]);
    const [noCumplen, setNoCumplen] = useState<IndicadorBalanceSocialDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [asociados, setAsociados] = useState<UserResponse[]>([]);
    const [calcAsociadoId, setCalcAsociadoId] = useState('');
    const [calcResultado, setCalcResultado] = useState<IndicadorBalanceSocialDto | null>(null);
    const [calcLoading, setCalcLoading] = useState(false);

    const loadData = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError(null);
        try {
            const [indRes, noCumplenRes] = await Promise.all([
                balanceSocialService.getIndicadoresByOrganizacion(orgId, anio),
                balanceSocialService.getNoCumplenEducacion(orgId, anio),
            ]);
            setIndicadores(indRes.success && indRes.data ? indRes.data : []);
            setNoCumplen(noCumplenRes.success && noCumplenRes.data ? noCumplenRes.data : []);
        } catch {
            setIndicadores([]);
            setNoCumplen([]);
            setError('Error de conexión al cargar balance social');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        usersService.getAll().then(res => {
            if (res.success && res.data && res.data[0]) {
                setAsociados(res.data);
                setCalcAsociadoId(res.data[0].id);
            }
        }).catch(() => showNotification({ type: 'error', message: 'Error al cargar asociados' }));
    }, []);

    useEffect(() => {
        loadData();
    }, [orgId, anio]);

    const handleCalcular = async () => {
        if (!calcAsociadoId) return;
        setCalcLoading(true);
        setError(null);
        try {
            const res = await balanceSocialService.calcularIndicador(calcAsociadoId, orgId, anio);
            if (res.success && res.data) {
                setCalcResultado(res.data);
                showNotification({ type: 'success', message: 'Indicador calculado' });
                loadData();
            } else {
                showNotification({ type: 'error', message: res.message || 'No se pudo calcular el indicador' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al calcular indicador' });
        } finally {
            setCalcLoading(false);
        }
    };

    const cumplen = indicadores.filter(i => i.cumpleEducacion).length;
    const noCumplenCount = noCumplen.length;
    const promedioIndice = indicadores.length
        ? Math.round((indicadores.reduce((s, i) => s + i.indiceBalanceSocial, 0) / indicadores.length) * 100) / 100
        : 0;

    const renderIndicador = (i: IndicadorBalanceSocialDto) => (
        <div key={i.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22]">
            <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-900 dark:text-white">
                    {asociados.find(a => a.id === i.asociadoId)?.fullName || i.asociadoId}
                </p>
                <Badge variant={i.cumpleEducacion ? 'success' : 'danger'} dot>
                    {i.cumpleEducacion ? 'Cumple' : 'No cumple'}
                </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div><p className="text-slate-500">Horas educación</p><p className="font-bold">{i.horasEducacion}h</p></div>
                <div><p className="text-slate-500">Asambleas</p><p className="font-bold">{i.participacionAsambleas}</p></div>
                <div><p className="text-slate-500">Comités</p><p className="font-bold">{i.participacionComites}</p></div>
                <div><p className="text-slate-500">Aportes</p><p className="font-bold">{currency(i.aportesSociales)}</p></div>
                <div><p className="text-slate-500">Beneficios</p><p className="font-bold">{currency(i.beneficiosRecibidos)}</p></div>
                <div><p className="text-slate-500">Índice</p><p className="font-bold text-primary">{i.indiceBalanceSocial}</p></div>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Balance Social
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Indicadores de balance social por organización y asociado.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} placeholder="Año" className="w-32" />
                    <Button variant="outline" onClick={loadData} disabled={!orgId || isLoading}>
                        {isLoading ? 'Cargando...' : 'Consultar'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Cumplen educación" value={cumplen} icon={TrendingUp} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="No cumplen" value={noCumplenCount} icon={TrendingDown} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />
                <StatCard title="Índice promedio" value={promedioIndice} icon={Scale} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
            </div>

            {/* Calcular indicador */}
            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Calcular Indicador por Asociado</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                        value={calcAsociadoId}
                        onChange={(e) => setCalcAsociadoId(e.target.value)}
                        className="h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                    >
                        <option value="">Seleccionar asociado</option>
                        {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                    </select>
                    <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} placeholder="Año" />
                    <div className="flex items-end">
                        <Button icon={Calculator} onClick={handleCalcular} disabled={!calcAsociadoId || calcLoading}>
                            {calcLoading ? 'Calculando...' : 'Calcular'}
                        </Button>
                    </div>
                </div>
                {calcResultado && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div><p className="text-xs text-slate-500">Horas educación</p><p className="font-bold">{calcResultado.horasEducacion}h</p></div>
                        <div><p className="text-xs text-slate-500">Asambleas</p><p className="font-bold">{calcResultado.participacionAsambleas}</p></div>
                        <div><p className="text-xs text-slate-500">Comités</p><p className="font-bold">{calcResultado.participacionComites}</p></div>
                        <div><p className="text-xs text-slate-500">Índice</p><p className="font-bold text-primary">{calcResultado.indiceBalanceSocial}</p></div>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Todos los indicadores */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Indicadores de la Organización</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : indicadores.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin indicadores para la organización y año seleccionados.</p>
                    ) : (
                        <div className="space-y-3">{indicadores.map(renderIndicador)}</div>
                    )}
                </Card>

                {/* No cumplen */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="text-rose-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Asociados que No Cumplen Educación</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : noCumplen.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Todos cumplen con las horas mínimas de educación.</p>
                    ) : (
                        <div className="space-y-3">{noCumplen.map(renderIndicador)}</div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default BalanceSocialPage;
