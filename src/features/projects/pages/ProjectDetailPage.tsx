import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Calendar, 
    Users, 
    Target,
    Briefcase,
    Edit,
    Trash2,
    UserPlus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Avatar } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService, skillsService } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { 
    ProjectStatus, 
    ProjectComplexity,
    ApplicationStatus,
    type ProjectResponse, 
    type SkillRequirementResponse,
    type ApplicationResponse 
} from '../../../shared/api/types';

// Helpers
const getStatusConfig = (status: ProjectStatus): { variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple'; label: string; icon: React.ReactNode } => {
    switch (status) {
        case ProjectStatus.Active:
            return { variant: 'success', label: 'Activo', icon: <CheckCircle2 size={16} /> };
        case ProjectStatus.Draft:
            return { variant: 'default', label: 'Borrador', icon: <FileText size={16} /> };
        case ProjectStatus.OnHold:
            return { variant: 'warning', label: 'En Pausa', icon: <Clock size={16} /> };
        case ProjectStatus.Completed:
            return { variant: 'info', label: 'Completado', icon: <CheckCircle2 size={16} /> };
        case ProjectStatus.Cancelled:
            return { variant: 'danger', label: 'Cancelado', icon: <XCircle size={16} /> };
        default:
            return { variant: 'default', label: 'Desconocido', icon: null };
    }
};

const getComplexityConfig = (complexity: ProjectComplexity): { variant: 'success' | 'warning' | 'danger'; label: string } => {
    switch (complexity) {
        case ProjectComplexity.Low:
            return { variant: 'success', label: 'Baja' };
        case ProjectComplexity.Medium:
            return { variant: 'warning', label: 'Media' };
        case ProjectComplexity.High:
            return { variant: 'danger', label: 'Alta' };
        default:
            return { variant: 'success', label: 'Baja' };
    }
};

const getApplicationStatusConfig = (status: ApplicationStatus): { variant: 'success' | 'warning' | 'danger'; label: string } => {
    switch (status) {
        case ApplicationStatus.Pending:
            return { variant: 'warning', label: 'Pendiente' };
        case ApplicationStatus.Approved:
            return { variant: 'success', label: 'Aprobada' };
        case ApplicationStatus.Rejected:
            return { variant: 'danger', label: 'Rechazada' };
        default:
            return { variant: 'warning', label: 'Pendiente' };
    }
};

const getLevelLabel = (level: number): string => {
    const levels: Record<number, string> = {
        1: 'Básico',
        2: 'Intermedio', 
        3: 'Competente',
        4: 'Avanzado',
        5: 'Experto'
    };
    return levels[level] || `Nivel ${level}`;
};

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
    // Use name hash to consistently get same gradient
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

export const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [requirements, setRequirements] = useState<SkillRequirementResponse[]>([]);
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchProjectData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch project details, requirements, and applications in parallel
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

                if (reqsRes.success && reqsRes.data) {
                    setRequirements(reqsRes.data);
                }

                if (appsRes.success && appsRes.data) {
                    setApplications(appsRes.data);
                }
            } catch (err) {
                setError('Error al cargar los datos del proyecto');
                console.error('Error fetching project:', err);
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
                showNotification({
                    type: 'success',
                    message: 'Postulación enviada exitosamente'
                });
                // Refresh applications
                const appsRes = await projectsService.getApplications(id);
                if (appsRes.success && appsRes.data) {
                    setApplications(appsRes.data);
                }
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al enviar postulación'
                });
            }
        } catch (err) {
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        }
    };

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
    const mandatoryReqs = requirements.filter(r => r.isMandatory);
    const optionalReqs = requirements.filter(r => !r.isMandatory);
    const pendingApps = applications.filter(a => a.status === ApplicationStatus.Pending);

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
                    {/* Project Icon */}
                    <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${getProjectGradient(project.name)} flex items-center justify-center text-white font-bold text-2xl shadow-xl flex-shrink-0`}>
                        {getProjectInitials(project.name)}
                    </div>

                    {/* Project Info */}
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
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    icon={Edit}
                                    onClick={() => showNotification({ type: 'info', message: 'Edición próximamente' })}
                                >
                                    Editar
                                </Button>
                                <Button 
                                    icon={UserPlus}
                                    onClick={handleApply}
                                >
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Requirements Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="text-primary" size={20} />
                                Requisitos de Habilidades
                                <Badge variant="default">{requirements.length}</Badge>
                            </CardTitle>
                        </CardHeader>

                        {requirements.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">
                                    No hay requisitos definidos
                                </p>
                                <Button variant="outline" size="sm">
                                    Agregar Requisito
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mandatoryReqs.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                            Obligatorios
                                        </h4>
                                        <div className="space-y-2">
                                            {mandatoryReqs.map((req) => (
                                                <div 
                                                    key={req.id}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {req.skillName}
                                                        </span>
                                                    </div>
                                                    <Badge variant="danger">
                                                        {getLevelLabel(req.requiredLevel)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {optionalReqs.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                            Opcionales
                                        </h4>
                                        <div className="space-y-2">
                                            {optionalReqs.map((req) => (
                                                <div 
                                                    key={req.id}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {req.skillName}
                                                        </span>
                                                    </div>
                                                    <Badge variant="default">
                                                        {getLevelLabel(req.requiredLevel)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Applications Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="text-purple-500" size={20} />
                                Postulaciones
                                {pendingApps.length > 0 && (
                                    <Badge variant="warning">{pendingApps.length} pendientes</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>

                        {applications.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500 dark:text-slate-400">
                                    No hay postulaciones aún
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {applications.map((app) => {
                                    const appStatusConfig = getApplicationStatusConfig(app.status);
                                    return (
                                        <div 
                                            key={app.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar 
                                                    name={app.userFullName} 
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {app.userFullName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(app.appliedAt).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={appStatusConfig.variant}>
                                                {appStatusConfig.label}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;
