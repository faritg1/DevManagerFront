import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Plus } from 'lucide-react';
import { ROUTES } from '../../../shared/config/constants';
import { Badge, type BadgeVariant } from '../../../shared/ui';
import { ProjectStatus, PROJECT_STATUS_LABELS, type ProjectResponse } from '../../../shared/api/types';
import { formatDate } from '../../../shared/format';
import { getComplexityConfig } from '../utils/complexityConfig';
import { getProjectTint, getProjectInitials } from '../utils/projectAvatar';

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
            className="group flex h-full min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-[border-color,box-shadow] duration-[120ms] ease-standard hover:border-slate-300 hover:shadow-sm dark:border-border-dark dark:bg-card-dark dark:hover:border-input-border"
        >
            <div className="flex min-w-0 items-start gap-4">
                <span
                    aria-hidden="true"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getProjectTint(project.name)} text-lg font-bold`}
                >
                    {getProjectInitials(project.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 title={project.name} className="line-clamp-2 break-words text-base font-semibold leading-6 text-slate-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary">
                        {project.name}
                    </h3>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                        {project.code || 'Sin código'}
                    </p>
                </div>
                <ArrowRight aria-hidden="true" size={18} className="mt-1 shrink-0 text-slate-400 transition-[color,transform] duration-[120ms] group-hover:translate-x-0.5 group-hover:text-primary dark:text-slate-500" />
            </div>

            <p className="line-clamp-2 flex-1 break-words text-sm text-slate-500 dark:text-slate-400">
                {project.description || 'Sin descripción'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANTS[project.status] ?? 'default'} dot>
                    {PROJECT_STATUS_LABELS[project.status] ?? 'Desconocido'}
                </Badge>
                <Badge variant="outline">Complejidad: {complexity.label}</Badge>
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
        className="group flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-transparent p-6 transition-colors duration-[120ms] hover:border-primary hover:bg-primary/5 dark:border-border-dark dark:hover:border-primary"
    >
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-card-dark flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <Plus size={24} aria-hidden="true" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-semibold group-hover:text-primary-600 dark:group-hover:text-primary transition-colors">
            Crear Nuevo Proyecto
        </p>
    </Link>
);
