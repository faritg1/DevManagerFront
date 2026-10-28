import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Plus } from 'lucide-react';
import { ROUTES } from '../../../shared/config/constants';
import { Badge, type BadgeVariant } from '../../../shared/ui';
import { ProjectStatus, PROJECT_STATUS_LABELS, type ProjectResponse } from '../../../shared/api/types';
import { formatDate } from '../../../shared/format';
import { getComplexityConfig } from '../utils/complexityConfig';
import { getProjectGradient, getProjectInitials } from '../utils/projectAvatar';

const STATUS_VARIANTS: Record<ProjectStatus, BadgeVariant> = {
    [ProjectStatus.Draft]: 'default',
    [ProjectStatus.Open]: 'success',
    [ProjectStatus.InProgress]: 'warning',
    [ProjectStatus.Closed]: 'info',
    [ProjectStatus.Cancelled]: 'danger',
};

/** Project summary card shared by the dashboard and the projects list. */
export const ProjectCard: React.FC<{ project: ProjectResponse }> = ({ project }) => {
    const complexity = getComplexityConfig(project.complexityLevel);
    return (
        <Link
            to={`/projects/${project.id}`}
            className="group flex h-full min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl dark:border-border-dark dark:bg-card-dark dark:hover:border-primary sm:p-6"
        >
            <div className="flex min-w-0 items-start gap-4">
                <span
                    aria-hidden="true"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getProjectGradient(project.name)} text-lg font-bold text-white shadow-lg`}
                >
                    {getProjectInitials(project.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 title={project.name} className="line-clamp-2 break-words text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                        {project.name}
                    </h3>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                        {project.code || 'Sin código'}
                    </p>
                </div>
                <ArrowRight aria-hidden="true" size={18} className="mt-1 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary dark:text-slate-600" />
            </div>

            <p className="line-clamp-2 flex-1 break-words text-sm text-slate-500 dark:text-slate-400">
                {project.description || 'Sin descripción'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANTS[project.status] ?? 'default'} dot>
                    {PROJECT_STATUS_LABELS[project.status] ?? 'Desconocido'}
                </Badge>
                <Badge variant={complexity.variant}>Complejidad: {complexity.label}</Badge>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-border-dark dark:text-slate-400">
                <Calendar size={14} aria-hidden="true" className="shrink-0" />
                {project.startDate || project.endDate ? (
                    <span>
                        {formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Sin fin'}
                    </span>
                ) : (
                    <span>Sin fechas</span>
                )}
            </div>
        </Link>
    );
};

/** Dashed "create project" tile closing a project grid (admin only). */
export const NewProjectTile: React.FC = () => (
    <Link
        to={ROUTES.CREATE_PROJECT}
        className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#233948] bg-transparent p-6 items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[240px]"
    >
        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#16222b] flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
            <Plus size={28} />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold group-hover:text-primary transition-colors">
            Crear Nuevo Proyecto
        </p>
    </Link>
);
