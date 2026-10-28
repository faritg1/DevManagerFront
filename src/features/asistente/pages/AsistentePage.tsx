import React, { useState } from 'react';
import {
    Bot, Loader2, AlertCircle, BookOpen, FileBarChart2, ShieldCheck, MessageSquare,
    Scale, CheckCircle2,
} from 'lucide-react';
import { Card, Badge, Button, Input, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { asistenteService } from '../../../shared/api';
import type {
    CooperativaQueryResponse,
    BalanceSocialReportDto,
    CumplimientoDto,
} from '../../../shared/api/types';

type Tab = 'consultar' | 'reporte' | 'cumplimiento' | 'responder';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
    { id: 'consultar', label: 'Consultar Normatividad', icon: BookOpen },
    { id: 'reporte', label: 'Generar Balance Social', icon: FileBarChart2 },
    { id: 'cumplimiento', label: 'Verificar Cumplimiento', icon: ShieldCheck },
    { id: 'responder', label: 'Responder Duda', icon: MessageSquare },
];

export const AsistentePage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';
    const anioActual = new Date().getFullYear();

    const [tab, setTab] = useState<Tab>('consultar');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Consultar
    const [consulta, setConsulta] = useState('');
    const [contexto, setContexto] = useState('');
    const [consultaRes, setConsultaRes] = useState<CooperativaQueryResponse | null>(null);

    // Reporte
    const [reporteAnio, setReporteAnio] = useState(anioActual);
    const [incluirRec, setIncluirRec] = useState(true);
    const [reporteRes, setReporteRes] = useState<BalanceSocialReportDto | null>(null);

    // Cumplimiento
    const [verificarEducacion, setVerificarEducacion] = useState(true);
    const [verificarSST, setVerificarSST] = useState(true);
    const [verificarHabeas, setVerificarHabeas] = useState(true);
    const [verificarAportes, setVerificarAportes] = useState(true);
    const [cumplimientoRes, setCumplimientoRes] = useState<CumplimientoDto | null>(null);

    // Responder
    const [pregunta, setPregunta] = useState('');
    const [tipoAsociado, setTipoAsociado] = useState('');
    const [responderRes, setResponderRes] = useState<CooperativaQueryResponse | null>(null);

    const run = async (fn: () => Promise<boolean>) => {
        setLoading(true);
        setError(null);
        try {
            const ok = await fn();
            if (!ok) showNotification({ type: 'error', message: 'No se pudo completar la operación' });
        } catch {
            setError('Error de conexión con el Asistente');
        } finally {
            setLoading(false);
        }
    };

    const handleConsultar = () => {
        if (!consulta.trim()) return;
        run(async () => {
            const res = await asistenteService.consultar({ consulta, contexto: contexto || null, requerirAprobacion: false });
            if (res.success && res.data) { setConsultaRes(res.data); return true; }
            return false;
        });
    };

    const handleGenerarReporte = () => {
        run(async () => {
            const res = await asistenteService.generarReporte({ organizationId: orgId, anio: reporteAnio, incluirRecomendaciones: incluirRec });
            if (res.success && res.data) { setReporteRes(res.data); return true; }
            return false;
        });
    };

    const handleVerificar = () => {
        run(async () => {
            const res = await asistenteService.verificarCumplimiento({
                organizationId: orgId,
                verificarEducacion,
                verificarSST,
                verificarHabeasData: verificarHabeas,
                verificarAportes,
            });
            if (res.success && res.data) { setCumplimientoRes(res.data); return true; }
            return false;
        });
    };

    const handleResponder = () => {
        if (!pregunta.trim()) return;
        run(async () => {
            const res = await asistenteService.responder({ organizationId: orgId, pregunta, tipoAsociado: tipoAsociado || null });
            if (res.success && res.data) { setResponderRes(res.data); return true; }
            return false;
        });
    };

    const renderCitations = (r: CooperativaQueryResponse) => (
        r.citations.length > 0 && (
            <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Citaciones normativas</p>
                <div className="space-y-2">
                    {r.citations.map((c, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                                <Scale size={14} className="inline mr-1 text-primary" />
                                {c.norma} — {c.articulo}
                            </p>
                            {c.descripcion && <p className="text-xs text-slate-500 mt-1">{c.descripcion}</p>}
                            {c.urlReferencia && (
                                <a href={c.urlReferencia} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold mt-1 inline-block">
                                    Ver referencia →
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    );

    const renderAcciones = (r: CooperativaQueryResponse) => (
        r.accionesSugeridas.length > 0 && (
            <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Acciones sugeridas</p>
                <ul className="space-y-1.5">
                    {r.accionesSugeridas.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                            {a}
                        </li>
                    ))}
                </ul>
            </div>
        )
    );

    const renderRespuesta = (r: CooperativaQueryResponse) => (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22]">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.respuesta}</p>
            {r.requiereAprobacion && <Badge variant="warning" className="mt-2">Requiere aprobación</Badge>}
            {renderCitations(r)}
            {renderAcciones(r)}
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Asistente Cooperativo
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Consultas normativas (Ley 79/1988, Ley 454/1998, Circular Básica Jurídica 2020), Balance Social y cumplimiento.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Modo" value="Consultar" icon={BookOpen} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Reporte" value={reporteAnio} icon={FileBarChart2} iconColor="text-purple-500" iconBgColor="bg-purple-100 dark:bg-purple-500/10" />
                <StatCard title="Áreas verificadas" value="4" icon={ShieldCheck} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="Asistente IA" value="Activo" icon={Bot} iconColor="text-primary" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22]'}`}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            {loading && (
                <div className="mb-6 flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Consultar */}
            {tab === 'consultar' && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="text-blue-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Consulta Normativa</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-slate-700 dark:text-white text-sm font-bold">Consulta *</label>
                            <textarea
                                value={consulta}
                                onChange={(e) => setConsulta(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                                rows={4}
                                placeholder="Ej: ¿Cómo se distribuyen los excedentes?"
                            />
                            <Input label="Contexto (opcional)" value={contexto} onChange={(e) => setContexto(e.target.value)} placeholder="Ej: cooperativa de transporte de 200 asociados" />
                            <Button icon={Bot} onClick={handleConsultar} disabled={!consulta.trim()} className="self-start">
                                Consultar
                            </Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Respuesta</h2>
                        {consultaRes ? renderRespuesta(consultaRes) : <p className="text-sm text-slate-500 dark:text-slate-400">Realiza una consulta para ver la respuesta.</p>}
                    </Card>
                </div>
            )}

            {/* Reporte */}
            {tab === 'reporte' && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <FileBarChart2 className="text-purple-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generar Balance Social</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <Input type="number" label="Año *" value={reporteAnio} onChange={(e) => setReporteAnio(Number(e.target.value))} />
                            <div>
                                <label className="text-slate-700 dark:text-white text-sm font-bold">Incluir recomendaciones</label>
                                <div className="flex gap-4 mt-3">
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <input type="radio" checked={incluirRec} onChange={() => setIncluirRec(true)} /> Sí
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <input type="radio" checked={!incluirRec} onChange={() => setIncluirRec(false)} /> No
                                    </label>
                                </div>
                            </div>
                            <Button icon={FileBarChart2} onClick={handleGenerarReporte} disabled={!orgId} className="self-start">
                                Generar Reporte
                            </Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reporte</h2>
                        {reporteRes ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-900 dark:text-white">{reporteRes.organizationName}</p>
                                    <Badge variant="purple">{reporteRes.anio}</Badge>
                                </div>
                                {reporteRes.resumenEjecutivo && <p className="text-sm text-slate-600 dark:text-slate-400">{reporteRes.resumenEjecutivo}</p>}
                                <div className="space-y-2">
                                    {reporteRes.dimensiones.map(d => (
                                        <div key={d.nombre} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{d.nombre}</p>
                                                <Badge variant={d.cobertura >= d.meta ? 'success' : 'warning'}>
                                                    {Math.round(d.cobertura)}% cobertura
                                                </Badge>
                                            </div>
                                            {d.indicadores.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-1">{d.indicadores.map(i => i.nombre).join(', ')}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {reporteRes.fortalezas.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Fortalezas</p>
                                        {reporteRes.fortalezas.map((f, i) => (
                                            <p key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-1.5">
                                                <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> {f}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Genera un reporte para ver los resultados.</p>
                        )}
                    </Card>
                </div>
            )}

            {/* Cumplimiento */}
            {tab === 'cumplimiento' && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="text-emerald-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verificar Cumplimiento</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Educación cooperativa (Ley 79 art. 88-91)', value: verificarEducacion, set: setVerificarEducacion },
                                { label: 'SST (Decreto 1072/2015)', value: verificarSST, set: setVerificarSST },
                                { label: 'Habeas Data (Ley 1581/2012)', value: verificarHabeas, set: setVerificarHabeas },
                                { label: 'Aportes sociales (Ley 79 art. 46-52)', value: verificarAportes, set: setVerificarAportes },
                            ].map(opt => (
                                <label key={opt.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] cursor-pointer">
                                    <input type="checkbox" checked={opt.value} onChange={(e) => opt.set(e.target.checked)} className="h-4 w-4 accent-primary" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
                                </label>
                            ))}
                            <Button icon={ShieldCheck} onClick={handleVerificar} disabled={!orgId} className="self-start mt-2">
                                Verificar
                            </Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resultado</h2>
                        {cumplimientoRes ? (
                            <div className="space-y-3">
                                {cumplimientoRes.areas.map(a => (
                                    <div key={a.nombre} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{a.nombre}</p>
                                            <Badge variant={a.cumple ? 'success' : 'danger'} dot>{a.cumple ? 'Cumple' : 'No cumple'}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{a.normaAplicable} · {Math.round(a.cobertura)}% cobertura</p>
                                        {a.hallazgos.length > 0 && (
                                            <ul className="mt-1 space-y-0.5">
                                                {a.hallazgos.map((h, i) => (
                                                    <li key={i} className="text-xs text-rose-600 dark:text-rose-400">• {h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                                {cumplimientoRes.alertas.length > 0 && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">Alertas</p>
                                        {cumplimientoRes.alertas.map((a, i) => (
                                            <p key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {a}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Verifica el cumplimiento para ver los resultados.</p>
                        )}
                    </Card>
                </div>
            )}

            {/* Responder */}
            {tab === 'responder' && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="text-primary" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Responder Duda de Asociado</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-slate-700 dark:text-white text-sm font-bold">Pregunta *</label>
                            <textarea
                                value={pregunta}
                                onChange={(e) => setPregunta(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                                rows={4}
                                placeholder="Ej: ¿Cómo me afilio a la cooperativa?"
                            />
                            <Input label="Tipo de asociado (opcional)" value={tipoAsociado} onChange={(e) => setTipoAsociado(e.target.value)} placeholder="Ej: nuevo" />
                            <Button icon={MessageSquare} onClick={handleResponder} disabled={!pregunta.trim()} className="self-start">
                                Responder
                            </Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Respuesta</h2>
                        {responderRes ? renderRespuesta(responderRes) : <p className="text-sm text-slate-500 dark:text-slate-400">Formula una pregunta para ver la respuesta.</p>}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AsistentePage;
