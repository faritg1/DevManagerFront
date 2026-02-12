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
    DollarSign,
    Plus,
    Sparkles,
    Star,
    TrendingUp,
    TrendingDown,
    Award,
    RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Avatar, Modal, Input } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService, skillsService, applicationsService, agentService } from '../../../shared/api';
import { useNotification, useConfig } from '../../../shared/context';
import { useModal } from '../../../shared/hooks';
import { 
    ProjectStatus, 
    ProjectComplexity,
    ApplicationStatus,
    type ProjectResponse, 
    type SkillRequirementResponse,
    type ApplicationResponse,
    type SkillDto,
    type AddSkillRequirementRequest,
    type MatchCandidatesResponse,
    type CandidateMatch
} from '../../../shared/api/types';

// Helpers
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

    // Modal para agregar requisito
    const requirementModal = useModal();
    const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [savingRequirement, setSavingRequirement] = useState(false);
    const [requirementForm, setRequirementForm] = useState<AddSkillRequirementRequest>({
        skillId: '',
        requiredLevel: 3,
        isMandatory: true
    });

    // Modal para revisar postulación
    const reviewModal = useModal();
    const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
    const [reviewNotes, setReviewNotes] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    // Modal para matching IA de candidatos
    const matchingModal = useModal();
    const [matchingResults, setMatchingResults] = useState<MatchCandidatesResponse | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [minMatchScore, setMinMatchScore] = useState(70);
    
    const { catalogs } = useConfig();

    const getStatusConfig = (status: number) => {
        const label = catalogs?.projectStatuses.find(s => s.id === status)?.name || 'Desconocido';
        // Keep hardcoded variants for now as backend doesn't provide them
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
        let icon = null;
        
        switch (status) {
            case ProjectStatus.Active:
                variant = 'success';
                icon = <CheckCircle2 size={16} />;
                break;
            case ProjectStatus.Draft:
                variant = 'default';
                icon = <FileText size={16} />;
                break;
            case ProjectStatus.OnHold:
                variant = 'warning';
                icon = <Clock size={16} />;
                break;
            case ProjectStatus.Completed:
                variant = 'info';
                icon = <CheckCircle2 size={16} />;
                break;
            case ProjectStatus.Cancelled:
                variant = 'danger';
                icon = <XCircle size={16} />;
                break;
        }
        return { variant, label, icon };
    };

    const getComplexityConfig = (complexity: number) => {
        const label = catalogs?.complexityLevels.find(c => c.id === complexity)?.name || 'Desconocido';
        let variant: 'success' | 'warning' | 'danger' = 'success';
        
        switch (complexity) {
            case ProjectComplexity.Low:
                variant = 'success';
                break;
            case ProjectComplexity.Medium:
                variant = 'warning';
                break;
            case ProjectComplexity.High:
                variant = 'danger';
                break;
        }
        return { variant, label };
    };
    
    const getApplicationStatusConfig = (status: number) => {
        const label = catalogs?.applicationStatuses.find(s => s.id === status)?.name || 'Desconocido';
        let variant: 'success' | 'warning' | 'danger' = 'warning';
        
        switch (status) {
            case ApplicationStatus.Pending:
                variant = 'warning';
                break;
            case ApplicationStatus.Approved:
                variant = 'success';
                break;
            case ApplicationStatus.Rejected:
                variant = 'danger';
                break;
        }
        return { variant, label };
    };

    const getLevelLabel = (level: number) => {
        return catalogs?.skillLevels.find(l => l.id === level)?.name || `Nivel ${level}`;
    };

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

    // Abrir modal de agregar requisito
    const handleOpenRequirementModal = async () => {
        requirementModal.open();
        setRequirementForm({ skillId: '', requiredLevel: 3, isMandatory: true });
        
        // Cargar skills disponibles si no se han cargado
        if (availableSkills.length === 0) {
            setLoadingSkills(true);
            try {
                const response = await skillsService.getAll();
                if (response.success && response.data) {
                    // Filtrar skills que ya están como requisito
                    const existingSkillIds = requirements.map(r => r.skillId);
                    const filtered = response.data.filter(s => !existingSkillIds.includes(s.id));
                    setAvailableSkills(filtered);
                }
            } catch (err) {
                console.error('Error loading skills:', err);
                showNotification({
                    type: 'error',
                    message: 'Error al cargar habilidades'
                });
            } finally {
                setLoadingSkills(false);
            }
        }
    };

    // Guardar requisito
    const handleSaveRequirement = async () => {
        if (!id || !requirementForm.skillId) {
            showNotification({
                type: 'error',
                message: 'Selecciona una habilidad'
            });
            return;
        }

        setSavingRequirement(true);
        try {
            const response = await projectsService.addRequirement(id, requirementForm);
            
            if (response.success) {
                showNotification({
                    type: 'success',
                    message: 'Requisito agregado exitosamente'
                });
                requirementModal.close();
                
                // Refrescar requisitos
                const reqsRes = await projectsService.getRequirements(id);
                if (reqsRes.success && reqsRes.data) {
                    setRequirements(reqsRes.data);
                    // Actualizar skills disponibles (quitar la que se acaba de agregar)
                    setAvailableSkills(prev => prev.filter(s => s.id !== requirementForm.skillId));
                }
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al agregar requisito'
                });
            }
        } catch (err) {
            console.error('Error saving requirement:', err);
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        } finally {
            setSavingRequirement(false);
        }
    };

    // Abrir modal de review
    const handleOpenReviewModal = (app: ApplicationResponse, action: 'approve' | 'reject') => {
        setSelectedApplication(app);
        setReviewAction(action);
        setReviewNotes('');
        reviewModal.open();
    };

    // Procesar review de postulación
    const handleSubmitReview = async () => {
        if (!selectedApplication) return;

        setIsReviewing(true);
        try {
            const status = reviewAction === 'approve' 
                ? ApplicationStatus.Approved 
                : ApplicationStatus.Rejected;

            const response = await applicationsService.review(selectedApplication.id, {
                status,
                reviewNotes: reviewNotes.trim() || null
            });

            if (response.success) {
                showNotification({
                    type: 'success',
                    message: reviewAction === 'approve' 
                        ? `Postulación de ${selectedApplication.userFullName} aprobada`
                        : `Postulación de ${selectedApplication.userFullName} rechazada`
                });
                reviewModal.close();

                // Actualizar lista de postulaciones
                setApplications(prev => prev.map(app => 
                    app.id === selectedApplication.id 
                        ? { ...app, status, statusName: status === ApplicationStatus.Approved ? 'Aprobada' : 'Rechazada' }
                        : app
                ));
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al procesar la postulación'
                });
            }
        } catch (err) {
            console.error('Error reviewing application:', err);
            showNotification({
                type: 'error',
                message: 'Error de conexión al procesar la postulación'
            });
        } finally {
            setIsReviewing(false);
        }
    };

    // Estado para error de matching
    const [matchingError, setMatchingError] = useState<string | null>(null);

    // Buscar candidatos con IA
    const handleMatchCandidates = async () => {
        if (!id) return;

        setIsMatching(true);
        setMatchingResults(null);
        setMatchingError(null);
        matchingModal.open();

        try {
            const response = await agentService.matchCandidates({
                projectId: id,
                minScore: minMatchScore,
                requireApproval: false
            });

            if (response.success && response.data) {
                setMatchingResults(response.data);
                if (response.data.candidates.length === 0) {
                    showNotification({
                        type: 'warning',
                        message: 'No se encontraron candidatos que cumplan el puntaje mínimo'
                    });
                }
            } else {
                // Detectar error de servidor saturado
                const errorMsg = response.message || 'Error al buscar candidatos';
                const isServerOverloaded = errorMsg.includes('interno') || 
                    errorMsg.includes('INTERNAL_ERROR') ||
                    errorMsg.includes('saturado');
                
                setMatchingError(isServerOverloaded 
                    ? 'El servidor está procesando muchas solicitudes. Por favor, intenta nuevamente en unos segundos.'
                    : errorMsg
                );
            }
        } catch (err: unknown) {
            console.error('Error matching candidates:', err);
            // Detectar timeout o error de red
            const errorMessage = err instanceof Error ? err.message : '';
            const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED');
            const isNetworkError = errorMessage.includes('Network') || errorMessage.includes('ECONNREFUSED');
            
            if (isTimeout) {
                setMatchingError('El análisis está tomando más tiempo del esperado. El servidor puede estar sobrecargado. Intenta nuevamente en unos momentos.');
            } else if (isNetworkError) {
                setMatchingError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
            } else {
                setMatchingError('Error al conectar con el agente IA. Por favor, intenta nuevamente.');
            }
        } finally {
            setIsMatching(false);
        }
    };

    // Helpers para calcular estadísticas de candidatos
    const getCandidateStats = () => {
        if (!matchingResults) return { total: 0, above90: 0, avgScore: 0, bestMatch: null };
        const candidates = matchingResults.candidates;
        const total = candidates.length;
        const above90 = candidates.filter(c => c.matchScore >= 90).length;
        const avgScore = total > 0 ? candidates.reduce((acc, c) => acc + c.matchScore, 0) / total : 0;
        const bestMatch = candidates.length > 0 ? candidates[0] : null;
        return { total, above90, avgScore, bestMatch };
    };

    // Helper para color de score
    const getScoreColor = (score: number): string => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-blue-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBg = (score: number): string => {
        if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-500/10';
        if (score >= 70) return 'bg-blue-50 dark:bg-blue-500/10';
        if (score >= 50) return 'bg-amber-50 dark:bg-amber-500/10';
        return 'bg-rose-50 dark:bg-rose-500/10';
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
                            <div className="flex flex-wrap gap-3">
                                <Button 
                                    variant="outline" 
                                    icon={Edit}
                                    onClick={() => navigate(`/projects/${id}/edit`)}
                                >
                                    Editar
                                </Button>
                                <Button 
                                    variant="outline"
                                    icon={Sparkles}
                                    onClick={handleMatchCandidates}
                                    className="border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                                >
                                    Buscar Candidatos IA
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
                            <CardTitle className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Target className="text-primary" size={20} />
                                    Requisitos de Habilidades
                                    <Badge variant="default">{requirements.length}</Badge>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    icon={Plus}
                                    onClick={handleOpenRequirementModal}
                                >
                                    Agregar
                                </Button>
                            </CardTitle>
                        </CardHeader>

                        {requirements.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">
                                    No hay requisitos definidos
                                </p>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    icon={Plus}
                                    onClick={handleOpenRequirementModal}
                                >
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
                                    const isPending = app.status === ApplicationStatus.Pending;
                                    
                                    return (
                                        <div 
                                            key={app.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] gap-3"
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
                                                        {app.message && (
                                                            <span className="ml-2 text-slate-400">• "{app.message}"</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {isPending ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            icon={XCircle}
                                                            onClick={() => handleOpenReviewModal(app, 'reject')}
                                                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                                                        >
                                                            Rechazar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            icon={CheckCircle2}
                                                            onClick={() => handleOpenReviewModal(app, 'approve')}
                                                        >
                                                            Aprobar
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant={appStatusConfig.variant}>
                                                        {appStatusConfig.label}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Modal Agregar Requisito */}
            <Modal
                isOpen={requirementModal.isOpen}
                onClose={requirementModal.close}
                title="Agregar Requisito de Habilidad"
                icon={<Target className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button 
                            onClick={handleSaveRequirement}
                            disabled={savingRequirement || !requirementForm.skillId}
                            icon={savingRequirement ? Loader2 : Plus}
                        >
                            {savingRequirement ? 'Guardando...' : 'Agregar Requisito'}
                        </Button>
                        <Button variant="outline" onClick={requirementModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    {/* Selector de Skill */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Habilidad *
                        </label>
                        {loadingSkills ? (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Loader2 className="animate-spin" size={16} />
                                Cargando habilidades...
                            </div>
                        ) : (
                            <select
                                value={requirementForm.skillId}
                                onChange={(e) => setRequirementForm(prev => ({ ...prev, skillId: e.target.value }))}
                                className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            >
                                <option value="">Seleccionar habilidad...</option>
                                {availableSkills.map(skill => (
                                    <option key={skill.id} value={skill.id}>
                                        {skill.name} {skill.category && `(${skill.category})`}
                                    </option>
                                ))}
                            </select>
                        )}
                        {availableSkills.length === 0 && !loadingSkills && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                No hay habilidades disponibles o todas ya están asignadas.
                            </p>
                        )}
                    </div>

                    {/* Nivel Requerido */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Nivel Requerido *
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {catalogs?.skillLevels.map(level => (
                                <button
                                    key={level.id}
                                    type="button"
                                    onClick={() => setRequirementForm(prev => ({ ...prev, requiredLevel: level.id }))}
                                    className={`
                                        p-3 rounded-xl border text-center transition-all
                                        ${requirementForm.requiredLevel === level.id
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-200 dark:border-[#233948] hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <p className="text-lg font-bold">{level.id}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {level.name}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Es Obligatorio */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Tipo de Requisito
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setRequirementForm(prev => ({ ...prev, isMandatory: true }))}
                                className={`
                                    flex-1 p-4 rounded-xl border text-center transition-all
                                    ${requirementForm.isMandatory
                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                                        : 'border-slate-200 dark:border-[#233948] hover:border-rose-500/50'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <div className={`h-2 w-2 rounded-full ${requirementForm.isMandatory ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                    <p className={`font-bold ${requirementForm.isMandatory ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                        Obligatorio
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    El candidato debe tenerla
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRequirementForm(prev => ({ ...prev, isMandatory: false }))}
                                className={`
                                    flex-1 p-4 rounded-xl border text-center transition-all
                                    ${!requirementForm.isMandatory
                                        ? 'border-slate-500 bg-slate-50 dark:bg-slate-500/10'
                                        : 'border-slate-200 dark:border-[#233948] hover:border-slate-500/50'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <div className={`h-2 w-2 rounded-full ${!requirementForm.isMandatory ? 'bg-slate-500' : 'bg-slate-300'}`} />
                                    <p className={`font-bold ${!requirementForm.isMandatory ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                        Opcional
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Deseable pero no excluyente
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal Revisar Postulación */}
            <Modal
                isOpen={reviewModal.isOpen}
                onClose={reviewModal.close}
                title={reviewAction === 'approve' ? 'Aprobar Postulación' : 'Rechazar Postulación'}
                icon={reviewAction === 'approve' 
                    ? <CheckCircle2 className="text-emerald-500" size={20} />
                    : <XCircle className="text-rose-500" size={20} />
                }
                size="md"
                footer={
                    <>
                        <Button
                            onClick={handleSubmitReview}
                            disabled={isReviewing || (reviewAction === 'reject' && !reviewNotes.trim())}
                            icon={isReviewing ? Loader2 : (reviewAction === 'approve' ? CheckCircle2 : XCircle)}
                            className={reviewAction === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                        >
                            {isReviewing 
                                ? 'Procesando...' 
                                : (reviewAction === 'approve' ? 'Aprobar' : 'Rechazar')
                            }
                        </Button>
                        <Button variant="outline" onClick={reviewModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                {selectedApplication && (
                    <div className="space-y-5">
                        {/* Información del postulante */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                            <Avatar name={selectedApplication.userFullName} size="lg" />
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-lg">
                                    {selectedApplication.userFullName}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Postulado el {new Date(selectedApplication.appliedAt).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Mensaje del postulante */}
                        {selectedApplication.message && (
                            <div>
                                <label className="text-slate-700 dark:text-white text-sm font-bold block mb-2">
                                    Mensaje del postulante
                                </label>
                                <p className="p-3 rounded-xl bg-slate-100 dark:bg-[#0d1419] text-slate-700 dark:text-slate-300 text-sm italic">
                                    "{selectedApplication.message}"
                                </p>
                            </div>
                        )}

                        {/* Confirmación */}
                        <div className={`p-4 rounded-xl border ${
                            reviewAction === 'approve' 
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' 
                                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                        }`}>
                            <p className={`text-sm ${
                                reviewAction === 'approve' 
                                    ? 'text-emerald-700 dark:text-emerald-400' 
                                    : 'text-rose-700 dark:text-rose-400'
                            }`}>
                                {reviewAction === 'approve' 
                                    ? `¿Estás seguro de aprobar la postulación de ${selectedApplication.userFullName}? El candidato será notificado.`
                                    : `¿Estás seguro de rechazar la postulación de ${selectedApplication.userFullName}? Esta acción no se puede deshacer.`
                                }
                            </p>
                        </div>

                        {/* Notas de revisión */}
                        <div>
                            <label className="text-slate-700 dark:text-white text-sm font-bold block mb-2">
                                Notas de revisión {reviewAction === 'reject' && <span className="text-rose-500">*</span>}
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder={reviewAction === 'approve' 
                                    ? 'Opcional: Agrega comentarios sobre la aprobación...'
                                    : 'Obligatorio: Indica el motivo del rechazo...'
                                }
                                rows={3}
                                className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-white dark:bg-[#111b22] px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                            />
                            {reviewAction === 'reject' && !reviewNotes.trim() && (
                                <p className="text-xs text-rose-500 mt-1">
                                    Las notas son obligatorias para rechazar una postulación
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Matching IA de Candidatos */}
            <Modal
                isOpen={matchingModal.isOpen}
                onClose={matchingModal.close}
                title="Candidatos Sugeridos por IA"
                icon={<Sparkles className="text-purple-500" size={20} />}
                size="lg"
            >
                <div className="space-y-6">
                    {/* Loading */}
                    {isMatching && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                                <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">
                                Analizando perfiles con IA...
                            </p>
                            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                                Esto puede tomar unos segundos
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {!isMatching && matchingError && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-500/10 mb-4">
                                <AlertCircle className="w-10 h-10 text-amber-500" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-center font-medium mb-2">
                                No se pudo completar el análisis
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-md mb-4">
                                {matchingError}
                            </p>
                            <Button 
                                variant="primary" 
                                onClick={() => {
                                    setMatchingError(null);
                                    handleMatchCandidates();
                                }}
                                icon={RefreshCw}
                            >
                                Reintentar
                            </Button>
                        </div>
                    )}

                    {/* Results */}
                    {!isMatching && !matchingError && matchingResults && (() => {
                        const stats = getCandidateStats();
                        return (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center">
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {stats.total}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Candidatos</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-center">
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {stats.above90}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Score +90%</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {stats.avgScore.toFixed(0)}%
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Score Promedio</p>
                                    </div>
                                </div>

                                {/* Best Match Highlight */}
                                {stats.bestMatch && (
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-500/30">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className="text-purple-500" size={18} />
                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Mejor Candidato</span>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300">
                                            {stats.bestMatch.fullName} con {stats.bestMatch.matchScore}% de compatibilidad
                                        </p>
                                    </div>
                                )}

                                {/* Analysis Narrative */}
                                {matchingResults.analysisNarrative && (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1419] border border-slate-200 dark:border-[#233948]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="text-purple-500" size={16} />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Análisis de la IA</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                                            {matchingResults.analysisNarrative.length > 500 
                                                ? matchingResults.analysisNarrative.substring(0, 500) + '...'
                                                : matchingResults.analysisNarrative
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Candidates List */}
                                {matchingResults.candidates.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-500/10 inline-block mb-4">
                                            <Users className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            No se encontraron candidatos con score mínimo de {minMatchScore}%
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                                            Intenta reducir el puntaje mínimo requerido
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            Ranking de Candidatos ({matchingResults.candidates.length})
                                        </h4>
                                        
                                        {matchingResults.candidates.map((candidate, idx) => {
                                            const strengths = candidate.skillAlignments.filter(s => s.meets);
                                            const gaps = candidate.skillAlignments.filter(s => !s.meets);
                                            const mandatoryMet = candidate.skillAlignments.filter(s => s.isMandatory && s.meets).length;
                                            const mandatoryTotal = candidate.skillAlignments.filter(s => s.isMandatory).length;
                                            
                                            return (
                                                <div 
                                                    key={candidate.userId}
                                                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] border border-slate-200 dark:border-[#233948]"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <Avatar name={candidate.fullName} size="md" />
                                                                {idx === 0 && (
                                                                    <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full">
                                                                        <Star className="w-3 h-3 text-white" fill="white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">
                                                                    {candidate.fullName}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {candidate.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Score */}
                                                        <div className={`px-4 py-2 rounded-xl ${getScoreBg(candidate.matchScore)}`}>
                                                            <p className={`text-2xl font-black ${getScoreColor(candidate.matchScore)}`}>
                                                                {candidate.matchScore}%
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Match Details */}
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div className="text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Skills Obligatorias:</span>
                                                            <span className={`ml-2 font-medium ${mandatoryMet === mandatoryTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                                {mandatoryMet}/{mandatoryTotal}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Skills Cumplidas:</span>
                                                            <span className="ml-2 font-medium text-slate-900 dark:text-white">
                                                                {strengths.length}/{candidate.skillAlignments.length}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Strengths & Gaps */}
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        {strengths.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                                                    <TrendingUp size={14} />
                                                                    Fortalezas ({strengths.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {strengths.slice(0, 4).map((s, i) => (
                                                                        <Badge key={i} variant="success" className="text-xs">
                                                                            {s.skillName} (Nv.{s.currentLevel})
                                                                        </Badge>
                                                                    ))}
                                                                    {strengths.length > 4 && (
                                                                        <Badge variant="default" className="text-xs">
                                                                            +{strengths.length - 4} más
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {gaps.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                                                                    <TrendingDown size={14} />
                                                                    Brechas ({gaps.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {gaps.slice(0, 4).map((g, i) => (
                                                                        <Badge key={i} variant={g.isMandatory ? "error" : "warning"} className="text-xs">
                                                                            {g.skillName} ({g.currentLevel}/{g.requiredLevel})
                                                                        </Badge>
                                                                    ))}
                                                                    {gaps.length > 4 && (
                                                                        <Badge variant="default" className="text-xs">
                                                                            +{gaps.length - 4} más
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Recommendation */}
                                                    {candidate.recommendationReason && (
                                                        <details className="group">
                                                            <summary className="cursor-pointer text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                                                                💡 Ver recomendación de la IA
                                                            </summary>
                                                            <div className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-[#0d1419] text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                                {candidate.recommendationReason}
                                                            </div>
                                                        </details>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </Modal>
        </div>
    );
};

export default ProjectDetailPage;