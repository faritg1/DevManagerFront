import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Calendar, 
    Target,
    Edit,
    Trash2,
    UserPlus,
    Loader2,
    AlertCircle,
    Sparkles,
    DollarSign,
} from 'lucide-react';
import { Card, Badge, Button } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService } from '../../../shared/api';
import { useNotification, useConfig } from '../../../shared/context';
import { useModal, useConfirm } from '../../../shared/hooks';
import { 
    ProjectStatus, 
    ProjectComplexity,
    type ProjectResponse, 
    type SkillRequirementResponse,
    type ApplicationResponse,
} from '../../../shared/api/types';

// Sub-components
import { ProjectRequirementsSection } from '../components/ProjectRequirementsSection';
import { ProjectApplicationsSection } from '../components/ProjectApplicationsSection';
import { ProjectMatchingModal } from '../components/ProjectMatchingModal';
import { ProjectAssignModal } from '../components/ProjectAssignModal';

// ─── Helpers ────────────────────────────────────────────
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Sin definir';
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

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

// ─── Component ──────────────────────────────────────────
export const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { catalogs } = useConfig();
    const { confirm } = useConfirm();

    // Core state
    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [requirements, setRequirements] = useState<SkillRequirementResponse[]>([]);
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modals
    const matchingModal = useModal();
    const assignModal = useModal();

    // Config helpers
    const getStatusConfig = (status: number) => {
        const label = catalogs?.projectStatuses.find(s => s.id === status)?.name || 'Desconocido';
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
        switch (status) {
            case ProjectStatus.Active: variant = 'success'; break;
            case ProjectStatus.OnHold: variant = 'warning'; break;
            case ProjectStatus.Completed: variant = 'info'; break;
            case ProjectStatus.Cancelled: variant = 'danger'; break;
        }
        return { variant, label };
    };

    const getComplexityConfig = (complexity: number) => {
        const label = catalogs?.complexityLevels.find(c => c.id === complexity)?.name || 'Desconocido';
        let variant: 'success' | 'warning' | 'danger' = 'success';
        switch (complexity) {
            case ProjectComplexity.Medium: variant = 'warning'; break;
            case ProjectComplexity.High: variant = 'danger'; break;
        }
        return { variant, label };
    };

    // Data fetching
    useEffect(() => {
        if (!id) return;
        const fetchProjectData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [projectRes, reqsRes, appsRes] = await Promise.all([
                    projectsService.getById(id),
                    projectsService.getRequirements(id),
                    projectsService.getApplications(id),
                ]);

                if (projectRes.success && projectRes.data) {
                    setProject(projectRes.data);
                } else {
                    setError(projectRes.message || 'Proyecto no encontrado');
                    return;
                }
                if (reqsRes.success && reqsRes.data) setRequirements(reqsRes.data);
                if (appsRes.success && appsRes.data) setApplications(appsRes.data);
            } catch {
                setError('Error al cargar los datos del proyecto');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjectData();
    }, [id]);

    // Handlers
    const handleApply = async () => {
        if (!id) return;
        try {
            const response = await projectsService.apply(id, {
                message: 'Me gustaría participar en este proyecto.'
            });
            if (response.success) {
                showNotification({ type: 'success', message: 'Postulación enviada exitosamente' });
                const appsRes = await projectsService.getApplications(id);
                if (appsRes.success && appsRes.data) setApplications(appsRes.data);
            } else {
                showNotification({ type: 'error', message: response.message || 'Error al enviar postulación' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión' });
        }
    };

    const handleDeleteProject = async () => {
        if (!id || !project) return;
        const confirmed = await confirm({
            title: 'Eliminar proyecto',
            message: `¿Estás seguro de que deseas eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            type: 'warning'
        });
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const response = await projectsService.delete(id);
            if (response.success) {
                showNotification({ type: 'success', message: `Proyecto "${project.name}" eliminado exitosamente` });
                navigate(ROUTES.PROJECTS);
            } else {
                showNotification({ type: 'error', message: response.message || 'Error al eliminar el proyecto' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al eliminar el proyecto' });
        } finally {
            setIsDeleting(false);
        }
    };

    // ─── Loading / Error ────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Cargando proyecto...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
                    {error || 'Proyecto no encontrado'}
                </p>
                <Button variant="outline" onClick={() => navigate(ROUTES.PROJECTS)}>
                    Volver a Proyectos
                </Button>
            </div>
        );
    }

    const statusConfig = getStatusConfig(project.status);
    const complexityConfig = getComplexityConfig(project.complexity);

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="max-w-6xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate(ROUTES.PROJECTS)}
                    className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors w-fit"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Volver a Proyectos</span>
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${getProjectGradient(project.name)} flex items-center justify-center text-white font-bold text-2xl shadow-xl flex-shrink-0`}>
                        {getProjectInitials(project.name)}
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight">
                                        {project.name}
                                    </h1>
                                    <Badge variant={statusConfig.variant} dot>
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                                {project.code && (
                                    <p className="text-slate-400 dark:text-slate-500 font-mono text-sm mb-2">
                                        {project.code}
                                    </p>
                                )}
                                {project.description && (
                                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                                        {project.description}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" icon={Edit} onClick={() => navigate(`/projects/${id}/edit`)}>
                                    Editar
                                </Button>
                                <Button 
                                    variant="outline"
                                    icon={isDeleting ? Loader2 : Trash2}
                                    onClick={handleDeleteProject}
                                    disabled={isDeleting}
                                    className={`border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 ${isDeleting ? '[&_svg]:animate-spin' : ''}`}
                                >
                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                </Button>
                                <Button 
                                    variant="outline"
                                    icon={Sparkles}
                                    onClick={matchingModal.open}
                                    className="border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                                >
                                    Buscar Candidatos IA
                                </Button>
                                <Button
                                    variant="outline"
                                    icon={UserPlus}
                                    onClick={assignModal.open}
                                    className="border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                >
                                    Asignar Miembro
                                </Button>
                                <Button icon={UserPlus} onClick={handleApply}>
                                    Postularme
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card padding="md" className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <Calendar className="text-blue-500" size={24} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Inicio</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {formatDate(project.startDate)}
                            </p>
                        </div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                                <Calendar className="text-purple-500" size={24} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Fin</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {formatDate(project.endDate)}
                            </p>
                        </div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`p-3 rounded-xl ${
                                complexityConfig.variant === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10' :
                                complexityConfig.variant === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10' :
                                'bg-emerald-50 dark:bg-emerald-500/10'
                            }`}>
                                <Target className={`${
                                    complexityConfig.variant === 'danger' ? 'text-rose-500' :
                                    complexityConfig.variant === 'warning' ? 'text-orange-500' :
                                    'text-emerald-500'
                                }`} size={24} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Complejidad</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {complexityConfig.label}
                            </p>
                        </div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                                <DollarSign className="text-emerald-500" size={24} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Presupuesto</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {project.budgetEstimate 
                                    ? `$${project.budgetEstimate.toLocaleString()}`
                                    : 'Sin definir'
                                }
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Main Grid — delegated to sub-components */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ProjectRequirementsSection
                        projectId={id!}
                        requirements={requirements}
                        onRequirementsChange={setRequirements}
                    />
                    <ProjectApplicationsSection
                        applications={applications}
                        onApplicationsChange={setApplications}
                    />
                </div>
            </div>

            {/* Modals — delegated to sub-components */}
            <ProjectMatchingModal
                projectId={id!}
                isOpen={matchingModal.isOpen}
                onClose={matchingModal.close}
            />
            <ProjectAssignModal
                projectId={id!}
                isOpen={assignModal.isOpen}
                onClose={assignModal.close}
                applications={applications}
            />
        </div>
    );
};

export default ProjectDetailPage;
