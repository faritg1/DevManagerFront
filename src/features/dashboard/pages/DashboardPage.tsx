import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Users, AlertTriangle, ArrowRight, Clock, CheckCircle2, FileText, Award, Bot, Briefcase, UserPlus, TrendingUp, PiggyBank, Shield, HeartHandshake } from 'lucide-react';
import { StatCard, Badge, Button, PageContainer, PageHeader, LoadingBlock, EmptyState } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService, applicationsService, usersService, skillsService, excedentesService, habeasDataService, bienestarService } from '../../../shared/api';
import { useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { ProjectStatus, type ApiResponse, type ProjectResponse } from '../../../shared/api/types';
import { currency } from '../../../shared/format';
import { ProjectCard, NewProjectTile } from '../../projects/components/ProjectCard';

/** undefined = loading, null = request failed. */
type Kpi<T> = T | null | undefined;

/** Each dashboard module loads on its own: a failed request yields null instead of breaking the page or faking a 0. */
const settle = <T,>(request: Promise<ApiResponse<T>>): Promise<T | null> =>
    request.then(r => (r.success && r.data != null ? r.data : null)).catch(() => null);

const FAILED = 'No disponible';

/** Props for StatCard from a KPI: "…" while loading, "—" plus a hint when it failed. */
const kpi = <T,>(value: Kpi<T>, render: (v: T) => string | number) => ({
    value: value === undefined ? '…' : value === null ? '—' : render(value),
    error: value === null ? FAILED : undefined,
});

const QuickLink: React.FC<{ to: string; icon: typeof Bot; iconClass: string; title: string; description: string }> = ({ to, icon: Icon, iconClass, title, description }) => (
    <Link to={to} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md dark:border-border-dark dark:bg-card-dark dark:hover:border-primary">
        <div className={`shrink-0 rounded-xl p-3 ${iconClass}`}>
            <Icon size={24} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">{title}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-slate-400 transition-colors group-hover:text-primary" />
    </Link>
);

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [projects, setProjects] = useState<Kpi<ProjectResponse[]>>(undefined);
    const [members, setMembers] = useState<Kpi<{ active: number; total: number }>>(undefined);
    const [totalSkills, setTotalSkills] = useState<Kpi<number>>(undefined);
    const [pendingApplications, setPendingApplications] = useState<Kpi<number>>(undefined);
    const [latestSurplus, setLatestSurplus] = useState<Kpi<number | 'none'>>(undefined);
    const [pendingArco, setPendingArco] = useState<Kpi<number>>(undefined);
    const [welfarePrograms, setWelfarePrograms] = useState<Kpi<number>>(undefined);

    useEffect(() => {
        settle(projectsService.getAll()).then(setProjects);
        settle(applicationsService.pendingCount()).then(r => setPendingApplications(r && r.count));
        settle(usersService.getAll()).then(list => setMembers(list && { active: list.filter(u => u.isActive).length, total: list.length }));
        settle(skillsService.getAll()).then(list => setTotalSkills(list && list.length));
    }, []);

    // Gestión solidaria: the organization comes from the JWT; pending ARCO is admin-only.
    useEffect(() => {
        if (!user?.id) return;
        settle(excedentesService.getAll()).then(list => setLatestSurplus(
            !list ? null : list.length ? [...list].sort((x, y) => y.period.localeCompare(x.period))[0].totalSurplus : 'none'));
        settle(bienestarService.getPrograms()).then(list => setWelfarePrograms(list && list.length));
        if (isAdmin) settle(habeasDataService.getPendingArco()).then(list => setPendingArco(list && list.length));
    }, [user?.id, isAdmin]);

    const count = (status: ProjectStatus) => kpi(projects, list => list.filter(p => p.status === status).length);
    const activeProjects = kpi(projects, list => list.filter(p => p.status === ProjectStatus.Open || p.status === ProjectStatus.InProgress).length);

    return (
        <PageContainer>
            <PageHeader
                title={user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'Dashboard General'}
                description="Resumen general de tu organización y proyectos."
                actions={isAdmin && (
                    <Link to={ROUTES.CREATE_PROJECT}>
                        <Button icon={Plus}>Nuevo Proyecto</Button>
                    </Link>
                )}
            />
            <div className="flex flex-col gap-8">
                <section aria-label="Indicadores principales" className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard
                            title="Proyectos activos"
                            {...activeProjects}
                            subtitle={projects ? `de ${projects.length} en total` : undefined}
                            icon={FolderOpen}
                        />
                        <StatCard
                            title="Postulaciones pendientes"
                            {...kpi(pendingApplications, n => n)}
                            subtitle="por revisar"
                            icon={UserPlus}
                            iconColor="text-amber-500"
                            iconBgColor="bg-amber-50 dark:bg-amber-500/10"
                        />
                        <StatCard
                            title="Miembros activos"
                            {...kpi(members, m => m.active)}
                            subtitle={members ? `de ${members.total} registrados` : undefined}
                            icon={Users}
                            iconColor="text-indigo-500"
                            iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
                        <StatCard compact title="Borradores" {...count(ProjectStatus.Draft)} icon={FileText} iconColor="text-slate-500" iconBgColor="bg-slate-100 dark:bg-slate-500/10" />
                        <StatCard compact title="Abiertos" {...count(ProjectStatus.Open)} icon={CheckCircle2} iconColor="text-emerald-500" iconBgColor="bg-emerald-50 dark:bg-emerald-500/10" />
                        <StatCard compact title="En progreso" {...count(ProjectStatus.InProgress)} icon={Clock} iconColor="text-amber-500" iconBgColor="bg-amber-50 dark:bg-amber-500/10" />
                        <StatCard compact title="Cerrados" {...count(ProjectStatus.Closed)} icon={TrendingUp} iconColor="text-blue-500" iconBgColor="bg-blue-50 dark:bg-blue-500/10" />
                        <StatCard compact title="Skills" {...kpi(totalSkills, n => n)} icon={Award} iconColor="text-purple-500" iconBgColor="bg-purple-50 dark:bg-purple-500/10" />
                    </div>
                </section>

                <section aria-labelledby="dash-solidaria">
                    <h2 id="dash-solidaria" className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Gestión Solidaria
                    </h2>
                    <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                        <StatCard
                            compact
                            title="Excedentes del último período"
                            {...kpi(latestSurplus, v => (v === 'none' ? '—' : currency(v)))}
                            subtitle={latestSurplus === 'none' ? 'Sin distribuciones' : undefined}
                            icon={PiggyBank}
                            iconColor="text-emerald-500"
                            iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
                        />
                        {isAdmin && (
                            <StatCard
                                compact
                                title="Solicitudes ARCO pendientes"
                                {...kpi(pendingArco, n => n)}
                                icon={Shield}
                                iconColor="text-amber-500"
                                iconBgColor="bg-amber-50 dark:bg-amber-500/10"
                            />
                        )}
                        <StatCard
                            compact
                            title="Programas de bienestar"
                            {...kpi(welfarePrograms, n => n)}
                            icon={HeartHandshake}
                            iconColor="text-rose-500"
                            iconBgColor="bg-rose-50 dark:bg-rose-500/10"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <QuickLink to={ROUTES.AGENTS} icon={Bot} iconClass="bg-purple-50 text-purple-500 dark:bg-purple-500/10" title="Asistente IA" description="Consulta en lenguaje natural" />
                    <QuickLink to={ROUTES.PROFILE} icon={Briefcase} iconClass="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10" title="Mi Perfil" description="Skills y configuración" />
                </div>

                <section aria-labelledby="dash-projects" className="flex flex-col gap-4 pb-12">
                    <div className="flex items-center justify-between gap-3">
                        <h2 id="dash-projects" className="text-lg font-bold text-slate-900 dark:text-white">Proyectos</h2>
                        {projects && projects.length > 0 && <Badge variant="default">{projects.length} total</Badge>}
                    </div>

                    {projects === undefined ? (
                        <LoadingBlock label="Cargando proyectos…" className="py-20" />
                    ) : projects === null ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                                <AlertTriangle className="w-10 h-10 text-rose-500" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">Error al cargar proyectos</p>
                            <Button variant="outline" onClick={() => window.location.reload()}>
                                Reintentar
                            </Button>
                        </div>
                    ) : projects.length === 0 ? (
                        <EmptyState
                            icon={FolderOpen}
                            className="py-20"
                            title="No hay proyectos"
                            description={isAdmin ? 'Comienza creando tu primer proyecto.' : undefined}
                            action={isAdmin && (
                                <Link to={ROUTES.CREATE_PROJECT}>
                                    <Button icon={Plus}>Crear Proyecto</Button>
                                </Link>
                            )}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {projects.map(project => <ProjectCard key={project.id} project={project} />)}
                            {isAdmin && <NewProjectTile />}
                        </div>
                    )}
                </section>
            </div>
        </PageContainer>
    );
};
