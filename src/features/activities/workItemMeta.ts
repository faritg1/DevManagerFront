import { ProjectStatus, SprintStatus, WorkItemPriority, WorkItemStatus, WorkItemType, type ProjectResponse, type WorkItemResponse } from '../../shared/api/types';
import type { BadgeVariant } from '../../shared/ui';

export const TYPE_LABELS: Record<WorkItemType, string> = {
    [WorkItemType.Task]: 'Tarea',
    [WorkItemType.Story]: 'Historia',
    [WorkItemType.Bug]: 'Bug',
    [WorkItemType.Subtask]: 'Subtarea',
};

export const TYPE_VARIANTS: Record<WorkItemType, BadgeVariant> = {
    [WorkItemType.Task]: 'info',
    [WorkItemType.Story]: 'purple',
    [WorkItemType.Bug]: 'danger',
    [WorkItemType.Subtask]: 'default',
};

export const STATUS_LABELS: Record<WorkItemStatus, string> = {
    [WorkItemStatus.Backlog]: 'Backlog',
    [WorkItemStatus.ToDo]: 'Por hacer',
    [WorkItemStatus.InProgress]: 'En progreso',
    [WorkItemStatus.InReview]: 'En revisión',
    [WorkItemStatus.Done]: 'Hecho',
    [WorkItemStatus.Cancelled]: 'Cancelado',
};

export const STATUS_VARIANTS: Record<WorkItemStatus, BadgeVariant> = {
    [WorkItemStatus.Backlog]: 'default',
    [WorkItemStatus.ToDo]: 'info',
    [WorkItemStatus.InProgress]: 'warning',
    [WorkItemStatus.InReview]: 'purple',
    [WorkItemStatus.Done]: 'success',
    [WorkItemStatus.Cancelled]: 'danger',
};

/** Board columns, in workflow order. */
export const STATUS_ORDER = [
    WorkItemStatus.Backlog, WorkItemStatus.ToDo, WorkItemStatus.InProgress,
    WorkItemStatus.InReview, WorkItemStatus.Done, WorkItemStatus.Cancelled,
];

export const PRIORITY_LABELS: Record<WorkItemPriority, string> = {
    [WorkItemPriority.Low]: 'Baja',
    [WorkItemPriority.Medium]: 'Media',
    [WorkItemPriority.High]: 'Alta',
    [WorkItemPriority.Urgent]: 'Urgente',
};

export const PRIORITY_VARIANTS: Record<WorkItemPriority, BadgeVariant> = {
    [WorkItemPriority.Low]: 'default',
    [WorkItemPriority.Medium]: 'info',
    [WorkItemPriority.High]: 'warning',
    [WorkItemPriority.Urgent]: 'danger',
};

/** Closed and cancelled projects are read-only (the API answers 409). */
export const isProjectReadOnly = (p: ProjectResponse | undefined) =>
    p?.status === ProjectStatus.Closed || p?.status === ProjectStatus.Cancelled;

/** The API serializes dates as "2026-10-30T00:00:00"; inputs and labels want the day only. */
export const dayOf = (d: string | null | undefined) => d?.slice(0, 10) ?? '';

/** Overdue = still open past its due day. */
export const isOverdue = (i: WorkItemResponse) =>
    !!i.dueDate && i.status !== WorkItemStatus.Done && i.status !== WorkItemStatus.Cancelled
    && dayOf(i.dueDate) < new Date().toLocaleDateString('en-CA');

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
    [SprintStatus.Planned]: 'Planeado',
    [SprintStatus.Active]: 'Activo',
    [SprintStatus.Closed]: 'Cerrado',
};
