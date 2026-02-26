import React, { useState, useEffect } from 'react';
import { Building2, Users, FolderOpen, Award, Loader2, CheckCircle2, XCircle, Clock, Shield, TrendingUp, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Avatar, StatCard } from '../../../shared/ui';
import { useAuth, useNotification } from '../../../shared/context';
import { usersService, projectsService, skillsService } from '../../../shared/api';
import { ProjectStatus, type UserResponse, type ProjectResponse, type SkillDto } from '../../../shared/api/types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/config/constants';

export const OrganizationsPage: React.FC = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<UserResponse[]>([]);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [skills, setSkills] = useState<SkillDto[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [usersRes, projectsRes, skillsRes] = await Promise.all([
                    usersService.getAll(),
                    projectsService.getAll(),
                    skillsService.getAll(),
                ]);
                if (usersRes.success && usersRes.data) setMembers(usersRes.data);
                if (projectsRes.success && projectsRes.data) setProjects(projectsRes.data);
                if (skillsRes.success && skillsRes.data) setSkills(skillsRes.data);
            } catch {
                showNotification({ type: 'error', message: 'Error al cargar datos de la organización' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeMembers = members.filter(m => m.isActive).length;
    const activeProjects = projects.filter(p => p.status === ProjectStatus.Active).length;
    const completedProjects = projects.filter(p => p.status === ProjectStatus.Completed).length;

    const roleDistribution = members.reduce<Record<string, number>>((acc, m) => {
        acc[m.roleName] = (acc[m.roleName] || 0) + 1;
        return acc;
    }, {});

    const copyOrgId = () => {
        if (user?.organizationId) {
            navigator.clipboard.writeText(user.organizationId);
            showNotification({ type: 'success', message: 'ID de organización copiado' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Cargando organización...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                        {(user?.organizationName || 'O')[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {user?.organizationName || 'Mi Organización'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="success" dot>Activa</Badge>
                            {user?.organizationId && (
                                <button
                                    onClick={copyOrgId}
                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors font-mono"
                                    title="Copiar ID"
                                >
                                    {user.organizationId.slice(0, 8)}...
                                    <Copy size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Miembros"
                    value={`${activeMembers}/${members.length}`}
                    icon={Users}
                    iconColor="text-indigo-500"
                    iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
                />
                <StatCard
                    title="Proyectos Activos"
                    value={activeProjects}
                    icon={FolderOpen}
                    iconColor="text-emerald-500"
                    iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
                    trend={activeProjects > 0 ? { value: 'En progreso', isPositive: true } : undefined}
                />
                <StatCard
                    title="Completados"
                    value={completedProjects}
                    icon={TrendingUp}
                    iconColor="text-blue-500"
                    iconBgColor="bg-blue-50 dark:bg-blue-500/10"
                />
                <StatCard
                    title="Catálogo Skills"
                    value={skills.length}
                    icon={Award}
                    iconColor="text-purple-500"
                    iconBgColor="bg-purple-50 dark:bg-purple-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Miembros */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Users className="text-primary" size={20} />
                                Miembros
                                <Badge variant="default">{members.length}</Badge>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.USERS)}>
                                Ver todos
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    {members.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            No se encontraron miembros
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {members.slice(0, 15).map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] hover:bg-slate-100 dark:hover:bg-[#1a2632] transition-colors"
                                >
                                    <Avatar name={member.fullName} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                            {member.fullName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {member.email}
                                        </p>
                                    </div>
                                    <Badge variant="default" className="text-xs shrink-0">
                                        {member.roleName}
                                    </Badge>
                                    {member.isActive ? (
                                        <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                                    ) : (
                                        <XCircle className="text-slate-400 shrink-0" size={16} />
                                    )}
                                </div>
                            ))}
                            {members.length > 15 && (
                                <p className="text-xs text-center text-slate-400 pt-2">
                                    +{members.length - 15} miembros más
                                </p>
                            )}
                        </div>
                    )}
                </Card>

                {/* Distribución de Roles */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="text-primary" size={20} />
                            Roles
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-3">
                        {Object.entries(roleDistribution)
                            .sort(([, a], [, b]) => b - a)
                            .map(([role, count]) => {
                                const pct = members.length > 0 ? Math.round((count / members.length) * 100) : 0;
                                return (
                                    <div key={role} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{role}</span>
                                            <span className="text-slate-500 dark:text-slate-400">{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        {Object.keys(roleDistribution).length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                Sin datos de roles
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Proyectos recientes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="text-primary" size={20} />
                            Proyectos Recientes
                            <Badge variant="default">{projects.length}</Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PROJECTS)}>
                            Ver todos
                        </Button>
                    </CardTitle>
                </CardHeader>
                {projects.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No hay proyectos en la organización
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projects.slice(0, 6).map((project) => {
                            const statusVariant: Record<number, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
                                [ProjectStatus.Active]: 'success',
                                [ProjectStatus.Draft]: 'default',
                                [ProjectStatus.OnHold]: 'warning',
                                [ProjectStatus.Completed]: 'info',
                                [ProjectStatus.Cancelled]: 'danger',
                            };
                            return (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] hover:bg-slate-100 dark:hover:bg-[#1a2632] border border-transparent hover:border-slate-200 dark:hover:border-[#233948] transition-all cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{project.name}</h4>
                                        <Badge variant={statusVariant[project.status] || 'default'} className="text-xs shrink-0">
                                            {project.statusName}
                                        </Badge>
                                    </div>
                                    {project.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{project.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                        <Clock size={12} />
                                        <span>{new Date(project.createdAt).toLocaleDateString('es-ES')}</span>
                                        <Badge variant="default" className="text-xs">{project.complexityName}</Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default OrganizationsPage;
