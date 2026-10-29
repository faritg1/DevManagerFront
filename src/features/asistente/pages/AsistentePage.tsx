import React, { useState } from 'react';
import {
    Bot, AlertCircle, BookOpen, FileBarChart2, ShieldCheck, CheckCircle2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, Badge, Button, Input, StatCard, PageContainer, PageHeader, LoadingBlock } from '../../../shared/ui';

/** Runs a handler on submit without the browser's page reload. */
const submit = (fn: () => void) => (e: React.FormEvent) => { e.preventDefault(); fn(); };
import { useNotification } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { asistenteService } from '../../../shared/api';
import { AiChatPanel } from '../../ai';
import type {
    SocialBalanceReportDto,
    ComplianceDto,
} from '../../../shared/api/types';

type Tab = 'consultar' | 'reporte' | 'cumplimiento';

const TABS: { id: Tab; label: string; adminOnly?: boolean; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
    { id: 'consultar', label: 'Consultar Normatividad', icon: BookOpen },
    { id: 'reporte', label: 'Generar Balance Social', icon: FileBarChart2, adminOnly: true },
    { id: 'cumplimiento', label: 'Verificar Cumplimiento', icon: ShieldCheck, adminOnly: true },
];

export const AsistentePage: React.FC = () => {
    const { showNotification } = useNotification();
    const isAdmin = useIsAdmin();
    const anioActual = new Date().getFullYear();

    const [tab, setTab] = useState<Tab>('consultar');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [reporteAnio, setReporteAnio] = useState(anioActual);
    const [incluirRec, setIncluirRec] = useState(true);
    const [reporteRes, setReporteRes] = useState<SocialBalanceReportDto | null>(null);

    const [verificarEducacion, setVerificarEducacion] = useState(true);
    const [verificarSST, setVerificarSST] = useState(true);
    const [verificarHabeas, setVerificarHabeas] = useState(true);
    const [cumplimientoRes, setCumplimientoRes] = useState<ComplianceDto | null>(null);

    const run = async (fn: () => Promise<boolean>) => {
        setLoading(true);
        setError(null);
        try {
            const ok = await fn();
            if (!ok) showNotification({ type: 'error', message: 'No se pudo completar la operación' });
        } catch (err) {
            setError((err as { message?: string })?.message || 'Error de conexión con el Asistente');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarReporte = () => {
        run(async () => {
            const res = await asistenteService.generateReport(reporteAnio, incluirRec);
            if (res.success && res.data) { setReporteRes(res.data); return true; }
            return false;
        });
    };

    const handleVerificar = () => {
        run(async () => {
            const res = await asistenteService.verifyCompliance({
                verifyEducation: verificarEducacion,
                verifyOccupationalHealth: verificarSST,
                verifyHabeasData: verificarHabeas,
            });
            if (res.success && res.data) { setCumplimientoRes(res.data); return true; }
            return false;
        });
    };

    return (
        <PageContainer>
            <PageHeader
                title="Asistente Cooperativo"
                description="Consultas normativas (Ley 79/1988, Ley 454/1998, Circular Básica Jurídica 2020), Balance Social y cumplimiento."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Modo" value="Consultar" icon={BookOpen} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Reporte" value={reporteAnio} icon={FileBarChart2} iconColor="text-purple-500" iconBgColor="bg-purple-100 dark:bg-purple-500/10" />
                <StatCard title="Áreas verificadas" value="3" icon={ShieldCheck} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="Asistente IA" value="Activo" icon={Bot} iconColor="text-primary" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.filter(t => isAdmin || !t.adminOnly).map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        aria-pressed={tab === t.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-background-dark'}`}
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
                <LoadingBlock className="mb-6 py-8" />
            )}

            {tab === 'consultar' && (
                <div className="flex h-[min(42rem,calc(100dvh-12rem))] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-border-dark dark:bg-card-dark">
                    <AiChatPanel moduleKey="regulations" />
                </div>
            )}

            {isAdmin && tab === 'reporte' && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <FileBarChart2 className="text-purple-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generar Balance Social</h2>
                        </div>
                        <form className="grid grid-cols-1 gap-4" onSubmit={submit(handleGenerarReporte)}>
                            <Input type="number" label="Año *" required min={2000} value={reporteAnio} onChange={(e) => setReporteAnio(Number(e.target.value))} />
                            <div role="radiogroup" aria-labelledby="asistente-incluir-rec">
                                <p id="asistente-incluir-rec" className="text-slate-700 dark:text-white text-sm font-bold">Incluir recomendaciones</p>
                                <div className="flex gap-4 mt-3">
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <input type="radio" checked={incluirRec} onChange={() => setIncluirRec(true)} /> Sí
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <input type="radio" checked={!incluirRec} onChange={() => setIncluirRec(false)} /> No
                                    </label>
                                </div>
                            </div>
                            <Button type="submit" icon={FileBarChart2} className="self-start">
                                Generar Reporte
                            </Button>
                        </form>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reporte</h2>
                        {reporteRes ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-900 dark:text-white">{reporteRes.activeAssociates} asociados activos</p>
                                    <Badge variant="purple">{reporteRes.year}</Badge>
                                </div>
                                {reporteRes.executiveSummary && <p className="text-sm text-slate-600 dark:text-slate-400">{reporteRes.executiveSummary}</p>}
                                {reporteRes.narrative && <div className="prose prose-sm dark:prose-invert max-w-none break-words"><ReactMarkdown>{reporteRes.narrative}</ReactMarkdown></div>}
                                <div className="space-y-2">
                                    {reporteRes.dimensions.map(d => (
                                        <div key={d.name} className="p-3 rounded-xl bg-slate-50 dark:bg-background-dark">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{d.name}</p>
                                                <Badge variant={d.coverage >= d.target ? 'success' : 'warning'}>
                                                    {d.status} · {Math.round(d.coverage)}%
                                                </Badge>
                                            </div>
                                            {d.indicators.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{d.indicators.map(i => i.name + ': ' + i.currentValue + (i.unit ? ' ' + i.unit : '')).join(' · ')}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {reporteRes.strengths.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">Fortalezas</p>
                                        {reporteRes.strengths.map((f, i) => (
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

            {isAdmin && tab === 'cumplimiento' && !loading && (
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
                            ].map(opt => (
                                <label key={opt.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-background-dark cursor-pointer">
                                    <input type="checkbox" checked={opt.value} onChange={(e) => opt.set(e.target.checked)} className="h-4 w-4 accent-primary" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
                                </label>
                            ))}
                            <Button icon={ShieldCheck} onClick={handleVerificar} className="self-start mt-2">
                                Verificar
                            </Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resultado</h2>
                        {cumplimientoRes ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{cumplimientoRes.overallStatus} · {cumplimientoRes.year}</p>
                                    <Badge variant={cumplimientoRes.nonCompliantAreas === 0 ? 'success' : 'warning'}>
                                        {cumplimientoRes.compliantAreas}/{cumplimientoRes.areas.length} áreas · {cumplimientoRes.overallCoverage}%
                                    </Badge>
                                </div>
                                {cumplimientoRes.areas.map(a => (
                                    <div key={a.name} className="p-3 rounded-xl bg-slate-50 dark:bg-background-dark">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{a.name}</p>
                                            <Badge variant={a.compliant ? 'success' : 'danger'} dot>{a.compliant ? 'Cumple' : 'No cumple'}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{a.applicableRule} · {Math.round(a.coverage)}% cobertura</p>
                                        {a.detail && <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{a.detail}</p>}
                                        {a.findings.length > 0 && (
                                            <ul className="mt-1 space-y-0.5">
                                                {a.findings.map((h, i) => (
                                                    <li key={i} className="text-xs text-rose-600 dark:text-rose-400">• {h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                                {cumplimientoRes.alerts.length > 0 && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">Alertas</p>
                                        {cumplimientoRes.alerts.map((a, i) => (
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
        </PageContainer>
    );
};

