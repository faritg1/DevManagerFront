import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { WorkItemStatus, type WorkItemResponse } from '../../../shared/api';
import { formatDate } from '../../../shared/format';
import { ActionMenu, Badge, type ActionMenuItem } from '../../../shared/ui';
import { isOverdue, PRIORITY_LABELS, PRIORITY_VARIANTS, STATUS_LABELS, STATUS_ORDER, STATUS_VARIANTS, TYPE_LABELS, TYPE_VARIANTS } from '../workItemMeta';

interface Props {
    items: WorkItemResponse[];
    nameOf: (userId: string | null | undefined) => string;
    /** Whether the user may drag this card (move permission or being its assignee, project not read-only). */
    canMove: (item: WorkItemResponse) => boolean;
    /** Drops `item` into `status`, before `beforeId` or at the end of the column. */
    onMove: (item: WorkItemResponse, status: WorkItemStatus, beforeId?: string) => void;
    /** Menu entries of a card ("Mover a…" and the like); the keyboard and touch alternative to dragging. */
    actionsFor: (item: WorkItemResponse) => ActionMenuItem[];
    /** Shows the "Bloqueada" badge on items with open blockers (dependencies on). */
    showBlocked?: boolean;
}

/** One column per status; cards move with native HTML5 drag and drop, or with the "Mover a…" card menu. */
export const KanbanBoard: React.FC<Props> = ({ items, nameOf, canMove, onMove, actionsFor, showBlocked }) => {
    const [dragging, setDragging] = useState<WorkItemResponse | null>(null);
    const [over, setOver] = useState<WorkItemStatus | null>(null);

    const drop = (e: React.DragEvent, status: WorkItemStatus, beforeId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragging && dragging.id !== beforeId) onMove(dragging, status, beforeId);
        setDragging(null);
        setOver(null);
    };

    return (
        <div className="flex gap-4 overflow-x-auto p-4" role="group" aria-label="Tablero de actividades">
            {STATUS_ORDER.map((status) => {
                const column = items.filter((i) => i.status === status);
                return (
                    <section
                        key={status}
                        aria-label={`${STATUS_LABELS[status]}, ${column.length} actividades`}
                        onDragOver={(e) => { if (dragging) { e.preventDefault(); setOver(status); } }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
                        onDrop={(e) => drop(e, status)}
                        className={`flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50 dark:bg-background-dark/60 ${
                            over === status ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200 dark:border-border-dark'
                        }`}
                    >
                        <header className="flex items-center justify-between px-3 py-3">
                            <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{column.length}</span>
                        </header>
                        <ul className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-3">
                            {column.map((i) => {
                                const menu = actionsFor(i);
                                const movable = canMove(i);
                                return (
                                    <li
                                        key={i.id}
                                        draggable={movable}
                                        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', i.id); setDragging(i); }}
                                        onDragEnd={() => { setDragging(null); setOver(null); }}
                                        onDrop={(e) => drop(e, status, i.id)}
                                        className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-border-dark dark:bg-card-dark ${
                                            movable ? 'cursor-grab active:cursor-grabbing' : ''
                                        } ${dragging?.id === i.id ? 'opacity-40' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{i.key}</span>
                                            {menu.length > 0 && <ActionMenu label={`Acciones de ${i.key}`} items={menu} />}
                                        </div>
                                        <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-white">{i.title}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            <Badge variant={TYPE_VARIANTS[i.type]}>{TYPE_LABELS[i.type]}</Badge>
                                            <Badge variant={PRIORITY_VARIANTS[i.priority]}>{PRIORITY_LABELS[i.priority]}</Badge>
                                            {isOverdue(i) && <Badge variant="danger">Vencida</Badge>}
                                            {showBlocked && (i.blockedByOpenCount ?? 0) > 0 && <Badge variant="warning" icon={Lock}>Bloqueada</Badge>}
                                        </div>
                                        <p className="mt-2 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="truncate">{nameOf(i.assigneeUserId)}</span>
                                            {i.dueDate && <span className="shrink-0">{formatDate(i.dueDate)}</span>}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
};
