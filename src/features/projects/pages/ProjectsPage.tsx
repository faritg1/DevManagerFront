import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    FolderOpen, 
    Calendar,
    ArrowRight,
    MoreHorizontal,
    Loader2,
    AlertCircle,
    Briefcase
} from 'lucide-react';
import { Card, Badge, ProgressBar, Button, Input } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService } from '../../../shared/api';
import { ProjectStatus, ProjectComplexity, type ProjectResponse } from '../../../shared/api/types';
import { getComplexityConfig } from '../utils/complexityConfig';

// Helpers para mapear estados a badges
const getStatusConfig = (status: ProjectStatus): { variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple'; label: string } => {
    switch (status) {
        case ProjectStatus.Active:
            return { variant: 'success', label: 'Activo' };
        case ProjectStatus.Draft:
            return { variant: 'default', label: 'Borrador' };
        case ProjectStatus.OnHold:
            return { variant: 'warning', label: 'En Pausa' };
        case ProjectStatus.Completed:
            return { variant: 'info', label: 'Completado' };
        case ProjectStatus.Cancelled:
            return { variant: 'danger', label: 'Cancelado' };
        default:
            return { variant: 'default', label: 'Desconocido' };
    }
};

const getProjectGradient = (index: number): string => {
    const gradients = [
        'from-blue-500 to-cyan-400',
        'from-purple-500 to-pink-500',
        'from-emerald-500 to-teal-400',
        'from-orange-500 to-yellow-400',
        'from-rose-500 to-red-400',
        'from-indigo-500 to-blue-400',
    ];
    return gradients[index % gradients.length];
};

const getProjectInitials = (name: string): string => {
    return name
        .split(' ')
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

// Tabs de filtro por estado
const STATUS_TABS = [
    { label: 'Todos', value: undefined },
    { label: 'Activos', value: ProjectStatus.Active },
    { label: 'Borradores', value: ProjectStatus.Draft },
    { label: 'En Pausa', value: ProjectStatus.OnHold },
    { label: 'Completados', value: ProjectStatus.Completed },
];

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<ProjectStatus | undefined>(undefined);

    // Cargar proyectos
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await projectsService.getAll(activeTab);
                if (response.success && response.data) {
                    setProjects(response.data);
                    setFilteredProjects(response.data);
                } else {
                    setError(response.message || 'Error al cargar proyectos');
                }
            } catch (err) {
                setError('Error de conexión al cargar proyectos');
                console.error('Error fetching projects:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [activeTab]);

    // Filtrar por búsqueda
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProjects(projects);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = projects.filter(project => 
            project.name.toLowerCase().includes(query) ||
            project.code?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query)
        );
        setFilteredProjects(filtered);
    }, [searchQuery, projects]);

    return (
        <div className="flex flex-col h-full">
            <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                
                {/* Header */}
                {/* Header + actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            Proyectos
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base">
                            Gestiona y monitorea todos los proyectos de la organización.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-full md:w-80">
                            <Input
                                placeholder="Buscar proyectos..."
                                icon={Search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link to={ROUTES.CREATE_PROJECT}>
                            <Button icon={Plus}>
                                Nuevo Proyecto
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Status Tabs Row */}
                <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                activeTab === tab.value
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-slate-100 dark:bg-[#16222b] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1c2c38]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Cargando proyectos...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{error}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Reintentar
                        </Button>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-[#16222b] mb-4">
                            <FolderOpen className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
                            {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer proyecto para comenzar'}
                        </p>
                        {!searchQuery && (
                            <Link to={ROUTES.CREATE_PROJECT}>
                                <Button icon={Plus}>Crear Proyecto</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Projects Count */}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}
                        </p>

                        {/* Projects Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                            {filteredProjects.map((project, index) => {
                                const statusConfig = getStatusConfig(project.status);
                                const complexityConfig = getComplexityConfig(project.complexity);
                                
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
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getProjectGradient(index)} flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
                                                    {getProjectInitials(project.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors truncate">
                                                        {project.name}
                                                    </h3>
                                                    {project.code && (
                                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-mono mt-0.5">
                                                            {project.code}
                                                        </p>
                                                    )}
                                                    {project.description && (
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badges Row */}
                                        <div className="flex flex-wrap items-center gap-2 mt-4">
                                            <Badge variant={statusConfig.variant} dot>
                                                {statusConfig.label}
                                            </Badge>
                                            <Badge variant={complexityConfig.variant}>
                                                Complejidad: {complexityConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Dates */}
                                        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(project.startDate)}
                                            </span>
                                            {project.endDate && (
                                                <>
                                                    <span>→</span>
                                                    <span>{formatDate(project.endDate)}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Budget if available */}
                                        {project.budgetEstimate && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#233948]">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Presupuesto</span>
                                                    <span className="text-slate-900 dark:text-white font-semibold">
                                                        ${project.budgetEstimate.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}

                            {/* Create New Card */}
                            <Link 
                                to={ROUTES.CREATE_PROJECT} 
                                className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#233948] bg-transparent p-6 items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[280px]"
                            >
                                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#16222b] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                    <Plus size={28} />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-semibold group-hover:text-primary transition-colors">
                                    Crear Nuevo Proyecto
                                </p>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProjectsPage;
