import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, AlertTriangle, ArrowRight, Loader2, Clock, CheckCircle2, FileText, XCircle, Award, Sparkles, Bot, Briefcase, UserPlus, TrendingUp } from 'lucide-react';
import { Card, StatCard, Badge, ProgressBar, Button } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService, usersService, skillsService } from '../../../shared/api';
import { useNotification, useConfig, useAuth } from '../../../shared/context';
import { ProjectStatus, type ProjectResponse, type UserResponse, type ApplicationResponse } from '../../../shared/api/types';
import { getComplexityConfig } from '../../projects/utils/complexityConfig';

// Helpers
const getProjectGradient = (name: string): string => {
    const gradients = [
        'from-blue-500 to-cyan-400',
        'from-purple-500 to-pink-500',
        'from-emerald-500 to-teal-400',
        'from-orange-500 to-yellow-400',
        'from-rose-500 to-red-400',
        'from-indigo-500 to-blue-400',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
};

const getProjectInitials = (name: string): string => {
    return name
        .split(' ')
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { catalogs } = useConfig();
    const { user } = useAuth();

    // State
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [activeUsers, setActiveUsers] = useState<number>(0);
    const [totalSkills, setTotalSkills] = useState<number>(0);
    const [pendingApplications, setPendingApplications] = useState<number>(0);

    // Cargar datos del dashboard
    useEffect(() => {
        const fetchDashboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Cargar proyectos, usuarios y skills en paralelo
                const [projectsRes, usersRes, skillsRes] = await Promise.all([
                    projectsService.getAll(),
                    usersService.getAll(),
                    skillsService.getAll(),
                ]);

                if (projectsRes.success && projectsRes.data) {
                    setProjects(projectsRes.data);

                    // Contar postulaciones pendientes de proyectos activos
                    const activeProjects = projectsRes.data.filter(
                        p => p.status === ProjectStatus.Active
                    );
                    let pending = 0;
                    // Cargar apps solo de los primeros 10 activos para no sobrecargar
                    const appPromises = activeProjects.slice(0, 10).map(p =>
                        projectsService.getApplications(p.id).catch(() => null)
                    );
                    const appResults = await Promise.all(appPromises);
                    for (const res of appResults) {
                        if (res?.success && res.data) {
                            pending += res.data.filter((a: ApplicationResponse) => a.status === 0).length;
                        }
                    }
                    setPendingApplications(pending);
                } else {
                    setError(projectsRes.message || 'Error al cargar proyectos');
                }

                if (usersRes.success && usersRes.data) {
                    setTotalUsers(usersRes.data.length);
                    setActiveUsers(usersRes.data.filter((u: UserResponse) => u.isActive).length);
                }

                if (skillsRes.success && skillsRes.data) {
                    setTotalSkills(skillsRes.data.length);
                }
            } catch (err) {
                console.error('Error fetching dashboard:', err);
                setError('Error de conexión al cargar datos');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    // Calcular estadísticas
    const stats = {
        active: projects.filter(p => p.status === ProjectStatus.Active).length,
        onHold: projects.filter(p => p.status === ProjectStatus.OnHold).length,
        completed: projects.filter(p => p.status === ProjectStatus.Completed).length,
        draft: projects.filter(p => p.status === ProjectStatus.Draft).length,
        total: projects.length
    };

    // Obtener configuración de estado
    const getStatusConfig = (status: ProjectStatus) => {
        const label = catalogs?.projectStatuses.find(s => s.id === status)?.name || 'Desconocido';
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
        let icon = null;

        switch (status) {
            case ProjectStatus.Active:
                variant = 'success';
                icon = <CheckCircle2 size={14} />;
                break;
            case ProjectStatus.Draft:
                variant = 'default';
                icon = <FileText size={14} />;
                break;
            case ProjectStatus.OnHold:
                variant = 'warning';
                icon = <Clock size={14} />;
                break;
            case ProjectStatus.Completed:
                variant = 'info';
                icon = <CheckCircle2 size={14} />;
                break;
            case ProjectStatus.Cancelled:
                variant = 'danger';
                icon = <XCircle size={14} />;
                break;
        }
        return { variant, label, icon };
    };

    // Calcular "progreso" basado en estado (simulado)
    const getProgressFromStatus = (status: ProjectStatus): number => {
        switch (status) {
            case ProjectStatus.Draft: return 10;
            case ProjectStatus.Active: return 50;
            case ProjectStatus.OnHold: return 30;
            case ProjectStatus.Completed: return 100;
            case ProjectStatus.Cancelled: return 0;
            default: return 0;
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                
                {/* Hero / Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            {user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'Dashboard General'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base">
                            Resumen general de tu organización y proyectos.
                        </p>
                    </div>
                    <Link to={ROUTES.CREATE_PROJECT}>
                        <Button icon={Plus}>
                            Nuevo Proyecto
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard
                        title="Proyectos"
                        value={isLoading ? '-' : stats.total}
                        icon={FolderOpen}
                        iconColor="text-primary"
                        iconBgColor="bg-blue-50 dark:bg-blue-500/10"
                    />
                    <StatCard
                        title="Activos"
                        value={isLoading ? '-' : stats.active}
                        icon={CheckCircle2}
                        iconColor="text-emerald-500"
                        iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
                        trend={stats.active > 0 ? { value: 'En progreso', isPositive: true } : undefined}
                    />
                    <StatCard
                        title="En Pausa"
                        value={isLoading ? '-' : stats.onHold}
                        icon={Clock}
                        iconColor="text-amber-500"
                        iconBgColor="bg-amber-50 dark:bg-amber-500/10"
                        trend={stats.onHold > 0 ? { value: 'Atención', isPositive: false } : undefined}
                    />
                    <StatCard
                        title="Completados"
                        value={isLoading ? '-' : stats.completed}
                        icon={TrendingUp}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-50 dark:bg-blue-500/10"
                    />
                    <StatCard
                        title="Miembros"
                        value={isLoading ? '-' : `${activeUsers}/${totalUsers}`}
                        icon={Users}
                        iconColor="text-indigo-500"
                        iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
                    />
                    <StatCard
                        title="Skills"
                        value={isLoading ? '-' : totalSkills}
                        icon={Award}
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-50 dark:bg-purple-500/10"
                    />
                </div>

                {/* Postulaciones pendientes + Quick Actions */}
                {!isLoading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Postulaciones pendientes */}
                        <Card className="flex items-center gap-4 p-4">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                                <UserPlus className="text-amber-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingApplications}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Postulaciones pendientes</p>
                            </div>
                            {pendingApplications > 0 && (
                                <Badge variant="warning" className="text-xs">Revisar</Badge>
                            )}
                        </Card>

                        {/* Acceso rápido: Agente IA */}
                        <Card
                            hoverable
                            onClick={() => navigate(ROUTES.AGENTS)}
                            className="flex items-center gap-4 p-4 cursor-pointer group"
                        >
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                                <Bot className="text-purple-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Asistente IA</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Consulta en lenguaje natural</p>
                            </div>
                            <ArrowRight className="text-slate-400 group-hover:text-primary transition-colors" size={18} />
                        </Card>

                        {/* Acceso rápido: Mi Perfil */}
                        <Card
                            hoverable
                            onClick={() => navigate(ROUTES.PROFILE)}
                            className="flex items-center gap-4 p-4 cursor-pointer group"
                        >
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                                <Briefcase className="text-emerald-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Mi Perfil</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Skills y configuración</p>
                            </div>
                            <ArrowRight className="text-slate-400 group-hover:text-primary transition-colors" size={18} />
                        </Card>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Cargando proyectos...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{error}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-500/10 mb-4">
                            <FolderOpen className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">No hay proyectos</p>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Comienza creando tu primer proyecto</p>
                        <Link to={ROUTES.CREATE_PROJECT}>
                            <Button icon={Plus}>Crear Proyecto</Button>
                        </Link>
                    </div>
                )}

                {/* Section title */}
                {!isLoading && !error && projects.length > 0 && (
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Proyectos</h3>
                        <Badge variant="default">{projects.length} total</Badge>
                    </div>
                )}

                {/* Projects Grid */}
                {!isLoading && !error && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {projects.map((project) => {
                            const statusConfig = getStatusConfig(project.status);
                            const complexityConfig = getComplexityConfig(project.complexity);
                            const progress = getProgressFromStatus(project.status);
                            
                            return (
                                <Card 
                                    key={project.id} 
                                    hoverable
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="group relative overflow-hidden"
                                >
                                    {/* Hover Arrow */}
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="text-primary transform -translate-x-2 group-hover:translate-x-0 transition-transform" />
                                    </div>

                                    {/* Project Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getProjectGradient(project.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                                {getProjectInitials(project.name)}
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                                    {project.name}
                                                </h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                                    {project.code || 'Sin código'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {project.description && (
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}

                                    {/* Status & Complexity */}
                                    <div className="flex items-center justify-between mt-5">
                                        <Badge variant={statusConfig.variant} dot>
                                            {statusConfig.label}
                                        </Badge>
                                        <Badge variant={complexityConfig.variant}>
                                            Complejidad: {complexityConfig.label}
                                        </Badge>
                                    </div>

                                    {/* Progress */}
                                    <div className="mt-5">
                                        <ProgressBar 
                                            value={progress} 
                                            showLabel 
                                            variant={project.status === ProjectStatus.OnHold ? 'warning' : 
                                                    project.status === ProjectStatus.Cancelled ? 'danger' : 'primary'}
                                        />
                                    </div>

                                    {/* Dates */}
                                    {(project.startDate || project.endDate) && (
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-[#233948] text-xs text-slate-500 dark:text-slate-400">
                                            {project.startDate && (
                                                <span>Inicio: {new Date(project.startDate).toLocaleDateString('es-ES')}</span>
                                            )}
                                            {project.endDate && (
                                                <span>Fin: {new Date(project.endDate).toLocaleDateString('es-ES')}</span>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}

                        {/* Create New Card */}
                        <Link 
                            to={ROUTES.CREATE_PROJECT} 
                            className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#233948] bg-transparent p-6 items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[240px]"
                        >
                            <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#16222b] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                <Plus size={28} />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold group-hover:text-primary transition-colors">
                                Crear Nuevo Proyecto
                            </p>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
