import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, AlertTriangle, ArrowRight, MoreHorizontal, Loader2, Clock, CheckCircle2, FileText, XCircle } from 'lucide-react';
import { Card, StatCard, Badge, ProgressBar, Button } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService } from '../../../shared/api';
import { useNotification, useConfig } from '../../../shared/context';
import { ProjectStatus, type ProjectResponse } from '../../../shared/api/types';

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

    // State
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar proyectos
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await projectsService.getAll();
                if (response.success && response.data) {
                    setProjects(response.data);
                } else {
                    setError(response.message || 'Error al cargar proyectos');
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError('Error de conexión al cargar proyectos');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
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
                            Dashboard General
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base">
                            Vista general de iniciativas estratégicas Q1 2026.
                        </p>
                    </div>
                    <Link to={ROUTES.CREATE_PROJECT}>
                        <Button icon={Plus}>
                            Nuevo Proyecto
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Proyectos"
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
                        trend={stats.onHold > 0 ? { value: 'Requiere atención', isPositive: false } : undefined}
                    />
                    <StatCard
                        title="Completados"
                        value={isLoading ? '-' : stats.completed}
                        icon={CheckCircle2}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-50 dark:bg-blue-500/10"
                    />
                </div>

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

                {/* Projects Grid */}
                {!isLoading && !error && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {projects.map((project) => {
                            const statusConfig = getStatusConfig(project.status);
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
                                        <Badge variant="default">
                                            {project.complexityName}
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
