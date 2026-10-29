import React, { useState, useEffect } from 'react';
import { Scale, AlertCircle, Search, TrendingUp, TrendingDown, Users, FileBarChart2, CheckCircle2 } from 'lucide-react';
import { Card, Badge, Button, Input, StatCard, PageContainer, PageHeader, LoadingBlock, EmptyState, ProgressBar, SELECT_CLASS } from '../../../shared/ui';
import { useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { balanceSocialService, associatesService } from '../../../shared/api';
import type { AssociateDto, SocialBalanceIndicatorDto, SocialBalanceReportDto } from '../../../shared/api/types';
import { currency } from '../../../shared/format';
import { AskAiButton } from '../../ai/AskAiButton';

const dimensionVariant = (status: string): 'success' | 'warning' | 'danger' =>
    status === 'Cumple' ? 'success' : status === 'En Progreso' ? 'warning' : 'danger';

export const BalanceSocialPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [year, setYear] = useState(new Date().getFullYear());
    const [indicators, setIndicators] = useState<SocialBalanceIndicatorDto[]>([]);
    const [nonCompliant, setNonCompliant] = useState<SocialBalanceIndicatorDto[]>([]);
    const [report, setReport] = useState<SocialBalanceReportDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [lookupUserId, setLookupUserId] = useState('');
    const [indicator, setIndicator] = useState<SocialBalanceIndicatorDto | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const loadIndicator = async (userId: string) => {
        if (!userId) return;
        setLookupLoading(true);
        try {
            const res = await balanceSocialService.getIndicator(userId, year);
            setIndicator(res.success ? res.data : null);
        } catch {
            setIndicator(null);
        } finally {
            setLookupLoading(false);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (isAdmin) {
                const [indRes, ncRes, repRes] = await Promise.all([
                    balanceSocialService.getOrganizationIndicators(year),
                    balanceSocialService.getNonCompliant(year),
                    balanceSocialService.getReport(year).catch(() => null),
                ]);
                setIndicators(indRes.success && indRes.data ? indRes.data : []);
                setNonCompliant(ncRes.success && ncRes.data ? ncRes.data : []);
                setReport(repRes?.success ? repRes.data : null);
            } else if (user?.id) {
                await loadIndicator(user.id);
            }
        } catch {
            setIndicators([]);
            setNonCompliant([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            associatesService.getAll().then(res => {
                const list = res.success && res.data ? res.data : [];
                setAssociates(list);
                if (list[0]) setLookupUserId(list[0].userId);
            }).catch(() => {});
        }
    }, [isAdmin]);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, isAdmin, user?.id]);

    const compliantCount = indicators.filter(i => i.meetsEducation).length;
    const averageIndex = indicators.length
        ? Math.round((indicators.reduce((s, i) => s + i.index, 0) / indicators.length) * 100) / 100
        : 0;

    const renderIndicator = (i: SocialBalanceIndicatorDto) => (
        <div key={i.userId} className="p-4 rounded-xl bg-slate-50 dark:bg-background-dark">
            <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-900 dark:text-white">{i.fullName || i.userId}</p>
                <Badge variant={i.meetsEducation ? 'success' : 'danger'} dot>
                    {i.meetsEducation ? 'Cumple' : 'No cumple'}
                </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div><p className="text-slate-500 dark:text-slate-400">Horas educación (año)</p><p className="font-bold">{i.educationHours}h</p></div>
                <div><p className="text-slate-500 dark:text-slate-400">Educación básica</p><p className="font-bold">{i.basicEducationHours}h</p></div>
                <div><p className="text-slate-500 dark:text-slate-400">Asambleas</p><p className="font-bold">{i.assemblyParticipations}</p></div>
                <div><p className="text-slate-500 dark:text-slate-400">Órganos / comités</p><p className="font-bold">{i.committeeParticipations}</p></div>
                <div><p className="text-slate-500 dark:text-slate-400">Beneficios</p><p className="font-bold">{currency(i.benefitsReceived)}</p></div>
                <div><p className="text-slate-500 dark:text-slate-400">Índice</p><p className="font-bold text-primary">{i.index}</p></div>
            </div>
        </div>
    );

    return (
        <PageContainer>
            <PageHeader
                title="Balance Social"
                description="Indicadores de balance social calculados con la educación, participación y beneficios reales."
                actions={<><AskAiButton moduleKey="social_balance" />
                <div className="flex items-center gap-3">
                    <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder="Año" aria-label="Año" className="w-32" />
                    <Button variant="outline" onClick={loadData} isLoading={isLoading}>
                        Consultar
                    </Button>
                </div>
                </>}
            />

            {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Cumplen educación" value={compliantCount} icon={TrendingUp} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                    <StatCard title="No cumplen" value={nonCompliant.length} icon={TrendingDown} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />
                    <StatCard title="Índice promedio" value={averageIndex} icon={Scale} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                </div>
            )}

            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Search className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isAdmin ? 'Indicador por Asociado' : `Mi indicador ${year}`}</h2>
                </div>
                {isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <select
                            aria-label="Asociado"
                            value={lookupUserId}
                            onChange={(e) => setLookupUserId(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="">Seleccionar asociado</option>
                            {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                        </select>
                        <Button icon={Search} onClick={() => loadIndicator(lookupUserId)} disabled={!lookupUserId} isLoading={lookupLoading}>
                            Consultar
                        </Button>
                    </div>
                )}
                {lookupLoading ? (
                    <LoadingBlock className="py-6" />
                ) : indicator ? renderIndicator(indicator) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin indicador consultado.</p>
                )}
            </Card>

            {isAdmin && report && (
                <Card className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileBarChart2 className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reporte {report.year} · {report.activeAssociates} asociados activos</h2>
                    </div>
                    {report.executiveSummary && <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">{report.executiveSummary}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {report.dimensions.map(d => (
                            <div key={d.name} className="p-3 rounded-xl bg-slate-50 dark:bg-background-dark">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-slate-900 dark:text-white">{d.name}</p>
                                    <Badge variant={dimensionVariant(d.status)}>{d.status}</Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-3" role="img" aria-label={`Cobertura ${d.coverage}%`}>
                                    <ProgressBar value={d.coverage} variant={dimensionVariant(d.status)} size="sm" className="flex-1" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{d.coverage}%</span>
                                </div>
                                <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    {d.indicators.map(ind => (
                                        <li key={ind.name}>
                                            {ind.name}: <span className="font-bold">{ind.unit === 'COP' ? currency(ind.currentValue) : `${ind.currentValue}${ind.unit ? ` ${ind.unit}` : ''}`}</span>
                                            {ind.targetValue > 0 && <> / meta {ind.targetValue}{ind.coverage != null ? ` (${ind.coverage}%)` : ''}</>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    {(report.strengths.length > 0 || report.improvementAreas.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                            <div>
                                <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Fortalezas</p>
                                <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">{report.strengths.map(s => <li key={s}>{s}</li>)}</ul>
                            </div>
                            <div>
                                <p className="font-bold text-amber-600 dark:text-amber-400 mb-1">Oportunidades de mejora</p>
                                <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">{report.improvementAreas.map(s => <li key={s}>{s}</li>)}</ul>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="text-blue-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Indicadores de la Organización</h2>
                        </div>
                        {isLoading ? (
                            <LoadingBlock />
                        ) : indicators.length === 0 ? (
                            <EmptyState title="Sin indicadores para el año seleccionado" icon={Users} className="py-6" />
                        ) : (
                            <div className="space-y-3">{indicators.map(renderIndicator)}</div>
                        )}
                    </Card>

                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="text-rose-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Asociados que No Cumplen Educación</h2>
                        </div>
                        {isLoading ? (
                            <LoadingBlock />
                        ) : nonCompliant.length === 0 ? (
                            <EmptyState title="Todos cumplen con las horas mínimas de educación" icon={CheckCircle2} className="py-6" />
                        ) : (
                            <div className="space-y-3">{nonCompliant.map(renderIndicator)}</div>
                        )}
                    </Card>
                </div>
            )}
        </PageContainer>
    );
};

