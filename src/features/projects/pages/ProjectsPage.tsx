import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { buttonClasses, Input, PageContainer, PageHeader, EmptyState, ErrorState, LoadingBlock, ExportButton } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService } from '../../../shared/api';
import { ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_COMPLEXITY_LABELS, type ProjectResponse } from '../../../shared/api/types';
import type { CsvColumn } from '../../../shared/export';
import { formatDate } from '../../../shared/format';
import { usePermission } from '../../../shared/hooks';
import { ProjectCard, NewProjectTile } from '../components/ProjectCard';
import { AskAiButton } from '../../ai/AskAiButton';

const EXPORT_COLUMNS: CsvColumn<ProjectResponse>[] = [
    { header: 'Código', value: (p) => p.code },
    { header: 'Nombre', value: (p) => p.name },
    { header: 'Descripción', value: (p) => p.description },
    { header: 'Estado', value: (p) => PROJECT_STATUS_LABELS[p.status] },
    { header: 'Complejidad', value: (p) => PROJECT_COMPLEXITY_LABELS[p.complexityLevel] },
    { header: 'Inicio', value: (p) => formatDate(p.startDate, undefined, '') },
    { header: 'Fin', value: (p) => formatDate(p.endDate, undefined, '') },
];

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
                actions={<><AskAiButton moduleKey="projects" /><div className="col-span-2 flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        <div className="w-full sm:w-64 lg:w-80">
                            <Input
                                placeholder="Buscar proyectos..." aria-label="Buscar proyectos"
                                inputSize="sm"
                                icon={Search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {canCreate && (
                            <Link to={ROUTES.CREATE_PROJECT} className={buttonClasses('primary', 'md', 'w-full sm:w-auto')}>
                                <Plus size={16} aria-hidden="true" />Nuevo Proyecto
                            </Link>
                        )}
                    </div></>}
            />
            <div className="flex flex-col gap-6">
                <div className="-mx-1 overflow-x-auto px-1 py-1">
                <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-border-dark dark:bg-card-dark">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(tab.value)}
                            aria-pressed={activeTab === tab.value}
                            className={`h-9 [@media(pointer:coarse)]:h-11 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-[120ms] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                activeTab === tab.value
                                    ? 'bg-white text-slate-900 font-semibold shadow-sm dark:bg-surface-dark dark:text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                </div>

                {isLoading ? (
                    <LoadingBlock label="Cargando proyectos…" className="py-20" />
                ) : error ? (
                    <ErrorState title={error} onRetry={() => window.location.reload()} className="py-20" />
                ) : filteredProjects.length === 0 ? (
                    <EmptyState
                        icon={FolderOpen}
                        className="py-20"
                        title={searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
                        description={searchQuery ? 'Intenta con otros términos de búsqueda.' : canCreate ? 'Crea tu primer proyecto para comenzar.' : undefined}
                        action={!searchQuery && canCreate && (
                            <Link to={ROUTES.CREATE_PROJECT} className={buttonClasses('secondary')}>
                                <Plus size={16} aria-hidden="true" />Crear Proyecto
                            </Link>
                        )}
                    />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Mostrando {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}
                            </p>
                            <ExportButton rows={filteredProjects} columns={EXPORT_COLUMNS} filename="proyectos" />
                        </div>

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
