import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    Target,
    Edit,
    Trash2,
    UserPlus,
    Loader2,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { Card, Badge, Button, PageContainer, PageHeader, BackButton, LoadingBlock } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService, assignmentsService } from '../../../shared/api';
import { useNotification, useConfig, useAuth } from '../../../shared/context';
import { useModal, useConfirm, useIsAdmin } from '../../../shared/hooks';
import { 
    ProjectStatus, 
    PROJECT_STATUS_LABELS,
    type ProjectComplexity,
    type ProjectResponse, 
    type SkillRequirementResponse,
    type ApplicationResponse,
    type AssignmentResponse,
} from '../../../shared/api/types';

import { getComplexityConfig as getSharedComplexityConfig } from '../utils/complexityConfig';
import { getProjectGradient, getProjectInitials } from '../utils/projectAvatar';

import { ProjectRequirementsSection } from '../components/ProjectRequirementsSection';
import { ProjectApplicationsSection } from '../components/ProjectApplicationsSection';
import { ProjectMatchingModal } from '../components/ProjectMatchingModal';
import { ProjectAssignModal } from '../components/ProjectAssignModal';
import { ProjectAssignmentsSection } from '../components/ProjectAssignmentsSection';

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Sin definir';
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

export const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { catalogs } = useConfig();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [requirements, setRequirements] = useState<SkillRequirementResponse[]>([]);
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
    const [editingAssignment, setEditingAssignment] = useState<AssignmentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const matchingModal = useModal();
    const assignModal = useModal();

    const getStatusConfig = (status: ProjectStatus) => {
        const label = catalogs?.projectStatuses.find(s => s.id === status)?.name ?? PROJECT_STATUS_LABELS[status] ?? 'Desconocido';
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
        switch (status) {
            case ProjectStatus.Open: variant = 'success'; break;
            case ProjectStatus.InProgress: variant = 'warning'; break;
            case ProjectStatus.Closed: variant = 'info'; break;
            case ProjectStatus.Cancelled: variant = 'danger'; break;
        }
        return { variant, label };
    };

    const getComplexityConfig = (complexity: ProjectComplexity) => {
        const base = getSharedComplexityConfig(complexity);
        const label = catalogs?.complexityLevels.find(c => c.id === complexity)?.name ?? base.label;
        return { variant: base.variant, label };
    };

    const loadAssignments = async () => {
        if (!id) return;
        try {
            const res = await assignmentsService.getAll({ projectId: id });
            if (res.success && res.data) setAssignments(res.data);
        } catch {
            showNotification({ type: 'error', message: 'Error al cargar los miembros asignados' });
        }
    };

    useEffect(() => {
        loadAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
                navigate(ROUTES.PROJECTS, { replace: true });
            } else {
                showNotification({ type: 'error', message: response.message || 'Error al eliminar el proyecto' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al eliminar el proyecto' });
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <PageContainer>
                <LoadingBlock label="Cargando proyecto..." className="py-20" />
            </PageContainer>
        );
    }

    if (error || !project) {
        return (
            <PageContainer>
                <BackButton to={ROUTES.PROJECTS} />
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-semibold">
                        {error || 'Proyecto no encontrado'}
                    </p>
                </div>
            </PageContainer>
        );
    }

    const statusConfig = getStatusConfig(project.status);
    const complexityConfig = getComplexityConfig(project.complexityLevel);
    const hasAlreadyApplied = user ? applications.some(app => app.userId === user.id) : false;

    return (
        <PageContainer>
            <PageHeader
                backTo={ROUTES.PROJECTS}
                icon={
                    <span className={`size-12 rounded-xl bg-gradient-to-br ${getProjectGradient(project.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`} aria-hidden="true">
                        {getProjectInitials(project.name)}
                    </span>
                }
                title={project.name}
                description={
                    <span className="flex flex-col gap-2">
                        <span className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusConfig.variant} dot>{statusConfig.label}</Badge>
                            {project.code && <span className="font-mono">{project.code}</span>}
                        </span>
                        {project.description && <span className="max-w-2xl text-slate-600 dark:text-slate-400">{project.description}</span>}
                    </span>
                }
                actions={<>
                    {isAdmin && (
                        <>
                            <Button variant="outline" icon={Edit} onClick={() => navigate(`/projects/${id}/edit`)}>
                                Editar
                            </Button>
                            <Button 
                                variant="outline"
                                icon={isDeleting ? Loader2 : Trash2}
                                onClick={handleDeleteProject}
                                disabled={isDeleting}
                                className={`border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 ${isDeleting ? '[&_svg]:animate-spin' : ''}`}
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
                                onClick={() => { setEditingAssignment(null); assignModal.open(); }}
                                className="border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            >
                                Asignar Miembro
                            </Button>
                        </>
                    )}
                    {!hasAlreadyApplied && (
                        <Button icon={UserPlus} onClick={handleApply}>
                            Postularme
                        </Button>
                    )}
                </>}
            />
            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                </div>

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

                <ProjectAssignmentsSection
                    assignments={assignments}
                    isAdmin={isAdmin}
                    onEdit={(assignment) => { setEditingAssignment(assignment); assignModal.open(); }}
                    onAssignmentsChange={loadAssignments}
                />
            </div>

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
                assignedUserIds={assignments.map(a => a.userId)}
                assignment={editingAssignment}
                onSaved={loadAssignments}
            />
        </PageContainer>
    );
};

