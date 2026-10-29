import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderOpen, AlertCircle } from 'lucide-react';
import { Button, Input, PageContainer, PageHeader, EmptyState, LoadingBlock } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService } from '../../../shared/api';
import { ProjectStatus, type ProjectResponse } from '../../../shared/api/types';
import { usePermission } from '../../../shared/hooks';
import { ProjectCard, NewProjectTile } from '../components/ProjectCard';
import { AskAiButton } from '../../ai/AskAiButton';

const STATUS_TABS = [
    { label: 'Todos', value: undefined },
    { label: 'Borradores', value: ProjectStatus.Draft },
    { label: 'Abiertos', value: ProjectStatus.Open },
    { label: 'En progreso', value: ProjectStatus.InProgress },
    { label: 'Cerrados', value: ProjectStatus.Closed },
    { label: 'Cancelados', value: ProjectStatus.Cancelled },
];

export const ProjectsPage: React.FC = () => {
    const canCreate = usePermission().has('menu.platform.projects.create');
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<ProjectStatus | undefined>(undefined);
    const query = searchQuery.trim().toLowerCase();
    const filteredProjects = query
        ? projects.filter(project =>
            project.name.toLowerCase().includes(query) ||
            project.code?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query))
        : projects;

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await projectsService.getAll(activeTab);
                if (response.success && response.data) {
                    setProjects(response.data);
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

    return (
        <PageContainer>
            <PageHeader
                title="Proyectos"
                description="Gestiona y monitorea todos los proyectos de la organización."
                actions={<><AskAiButton moduleKey="projects" /><div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
                        <div className="w-full sm:w-64 lg:w-80">
                            <Input
                                placeholder="Buscar proyectos..." aria-label="Buscar proyectos"
                                icon={Search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {canCreate && (
                            <Link to={ROUTES.CREATE_PROJECT}>
                                <Button icon={Plus}>
                                    Nuevo Proyecto
                                </Button>
                            </Link>
                        )}
                    </div></>}
            />
            <div className="flex flex-col gap-8">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(tab.value)}
                            aria-pressed={activeTab === tab.value}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                activeTab === tab.value
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-surface-dark'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <LoadingBlock label="Cargando proyectos…" className="py-20" />
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
                    <EmptyState
                        icon={FolderOpen}
                        className="py-20"
                        title={searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
                        description={searchQuery ? 'Intenta con otros términos de búsqueda.' : canCreate ? 'Crea tu primer proyecto para comenzar.' : undefined}
                        action={!searchQuery && canCreate && (
                            <Link to={ROUTES.CREATE_PROJECT}>
                                <Button icon={Plus}>Crear Proyecto</Button>
                            </Link>
                        )}
                    />
                ) : (
                    <>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                            {filteredProjects.map(project => <ProjectCard key={project.id} project={project} />)}
                            {canCreate && <NewProjectTile />}
                        </div>
                    </>
                )}
            </div>
        </PageContainer>
    );
};
