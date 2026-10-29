import React, { useEffect, useState } from 'react';
import { CalendarDays, Gauge, Sparkles, Zap } from 'lucide-react';
import { aiService, type AiUsageSummary } from '../../shared/api';
import { formatDate, formatNumber } from '../../shared/format';
import { Card, EmptyState, LoadingBlock, PageContainer, PageHeader, ProgressBar, StatCard } from '../../shared/ui';

/** Backend use cases (ai.UsageLog.UseCase; "chat" also covers conversation messages) */
const USE_CASE_LABEL: Record<string, string> = {
    chat: 'Chat y consultas del asistente',
    summary: 'Resumen ejecutivo (Reportes IA)',
    'skill-validation': 'Validación de habilidades',
    'candidate-narrative': 'Narrativa de candidatos',
    'cooperative-assistant': 'Asistente cooperativo',
};

const tokens = (n: number) => `${formatNumber(n, 0)} tokens`;

export const quotaVariant = (percent: number) => (percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'primary');

/** The organization's monthly AI quota: used, remaining, breakdown by use and daily consumption. */
export const AiUsagePage: React.FC = () => {
    const [usage, setUsage] = useState<AiUsageSummary | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        aiService.getUsage().then(r => setUsage(r.data ?? null), () => setFailed(true));
    }, []);

    const header = (
        <PageHeader
            icon={<Gauge size={28} className="text-primary" />}
            title="Uso de IA"
            description="Cuota mensual de inteligencia artificial de tu organización y su consumo."
        />
    );

    if (failed) return <PageContainer>{header}<EmptyState title="No se pudo cargar el uso de IA" /></PageContainer>;
    if (!usage) return <PageContainer>{header}<LoadingBlock label="Cargando uso de IA…" /></PageContainer>;

    const maxDay = Math.max(1, ...usage.daily.map(d => d.tokens));
    const month = formatDate(usage.periodStart, { month: 'long', year: 'numeric' });

    return (
        <PageContainer>
            {header}

            <Card className="mb-6">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-bold capitalize text-slate-900 dark:text-white">{month}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white">{formatNumber(usage.percent)} %</span> usado
                    </p>
                </div>
                <ProgressBar value={usage.used} max={Math.max(usage.quota, 1)} variant={quotaVariant(usage.percent)} size="lg" />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {tokens(usage.used)} de {tokens(usage.quota)}
                    {usage.isDefaultQuota && ' · cuota estándar de la plataforma'} · se renueva al terminar el {formatDate(usage.periodEnd)} (UTC)
                </p>
                {usage.percent >= 100 && (
                    <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        La cuota mensual está agotada: el asistente no responderá hasta el próximo mes o hasta que el operador de la plataforma la amplíe.
                    </p>
                )}
            </Card>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard title="Disponible este mes" value={formatNumber(usage.remaining, 0)} subtitle="tokens" icon={Sparkles} iconColor="text-primary" iconBgColor="bg-primary/10" />
                <StatCard title="Consumo de hoy" value={formatNumber(usage.usedToday, 0)} subtitle={`de ${tokens(usage.dailyBudget)} diarios`} icon={Zap} iconColor="text-orange-500" iconBgColor="bg-orange-100 dark:bg-orange-500/10" />
                <StatCard title="Días con consumo" value={usage.daily.filter(d => d.tokens > 0).length} subtitle={`de ${usage.daily.length} transcurridos`} icon={CalendarDays} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Consumo por uso</h2>
                    {usage.byUseCase.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin consumo este mes.</p>
                    ) : (
                        <ul className="space-y-3">
                            {usage.byUseCase.map(u => (
                                <li key={u.useCase}>
                                    <div className="mb-1 flex justify-between gap-2 text-sm">
                                        <span className="text-slate-700 dark:text-slate-200">{USE_CASE_LABEL[u.useCase] ?? u.useCase}</span>
                                        <span className="shrink-0 font-semibold text-slate-900 dark:text-white">{formatNumber(u.tokens, 0)}</span>
                                    </div>
                                    <ProgressBar value={u.tokens} max={Math.max(usage.used, 1)} size="sm" />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card>
                    <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Consumo diario</h2>
                    <div className="flex h-40 items-end gap-0.5" role="img" aria-label={`Consumo diario de ${month}`}>
                        {usage.daily.map(d => (
                            <div
                                key={d.date}
                                title={`${formatDate(d.date)}: ${tokens(d.tokens)}`}
                                className="flex-1 rounded-t bg-primary/80 hover:bg-primary"
                                style={{ height: `${Math.max((d.tokens / maxDay) * 100, d.tokens > 0 ? 2 : 0)}%` }}
                            />
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDate(usage.periodStart, { day: '2-digit', month: 'short' })}</span>
                        <span>{formatDate(usage.daily[usage.daily.length - 1]?.date, { day: '2-digit', month: 'short' })}</span>
                    </div>
                </Card>
            </div>
        </PageContainer>
    );
};
