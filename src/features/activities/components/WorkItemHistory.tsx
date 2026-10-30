import React from 'react';
import { WorkItemPriority, WorkItemStatus, WorkItemType, type WorkItemHistoryEntry } from '../../../shared/api';
import { formatDateTime } from '../../../shared/format';
import { dayOf, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from '../workItemMeta';

const FIELDS: Record<string, string> = {
    Title: 'Título', Description: 'Descripción', Status: 'Estado', Type: 'Tipo', Priority: 'Prioridad',
    DueDate: 'Vence', EstimateHours: 'Horas estimadas', AssigneeUserId: 'Responsable', Body: 'Texto',
};
const ACTIONS = { Created: 'creó', Updated: 'editó', Deleted: 'eliminó' };

/** Status, type and priority arrive as numeric strings; the assignee as a user id. */
const valueLabel = (field: string, v: string | null | undefined, nameOf: (id: string) => string): string => {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (field === 'Status') return STATUS_LABELS[n as WorkItemStatus] ?? v;
    if (field === 'Type') return TYPE_LABELS[n as WorkItemType] ?? v;
    if (field === 'Priority') return PRIORITY_LABELS[n as WorkItemPriority] ?? v;
    if (field === 'AssigneeUserId') return nameOf(v);
    if (field === 'DueDate') return dayOf(v);
    return v;
};

export const WorkItemHistory: React.FC<{ entries: WorkItemHistoryEntry[]; nameOf: (id: string) => string }> = ({ entries, nameOf }) => (
    <ol className="space-y-3">
        {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-border-dark">
                <p className="font-medium text-slate-900 dark:text-white">
                    {e.actorName}{e.impersonatorName && <span className="font-normal text-slate-500"> (por {e.impersonatorName})</span>}
                    {' '}{ACTIONS[e.action]} {e.entityType === 'WorkItem' ? 'la actividad' : 'un comentario'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(e.createdAt)}</p>
                {e.action === 'Updated' && e.changes.length > 0 && (
                    <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                        {e.changes.map((c) => (
                            <li key={c.field}>
                                <span className="font-medium">{FIELDS[c.field] ?? c.field}:</span>{' '}
                                {valueLabel(c.field, c.old, nameOf)} → {valueLabel(c.field, c.new, nameOf)}
                            </li>
                        ))}
                    </ul>
                )}
            </li>
        ))}
    </ol>
);
