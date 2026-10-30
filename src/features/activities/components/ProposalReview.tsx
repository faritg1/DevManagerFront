import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import {
    workItemsService, WorkItemPriority, WorkItemType,
    type ProposalItem, type ProposalItemEdit, type ProposalResponse, type WorkItemResponse,
} from '../../../shared/api';
import { Badge, Button } from '../../../shared/ui';
import { PRIORITY_LABELS, TYPE_LABELS, TYPE_VARIANTS } from '../workItemMeta';
import type { Member } from './WorkItemFormModal';

const selectClass = 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-border-dark dark:bg-background-dark dark:text-white';

/** The API serializes proposal enums by name ("Medium"); the confirm request takes the numeric value. */
const priorityOf = (p: ProposalItem['priority']) => WorkItemPriority[p];
const typeOf = (t: ProposalItem['type']) => WorkItemType[t];

interface Edit { title?: string; assignee?: string; priority?: WorkItemPriority }

interface Props {
    proposal: ProposalResponse;
    /** Members of the project, for the editable assignee. */
    members: Member[];
    /** Has the .create permission and the proposal is still open: shows the controls. */
    canDecide: boolean;
    /** Titles, assignees and priorities can be edited (the compact chat card only confirms or rejects). */
    editable?: boolean;
    onConfirmed: (created: WorkItemResponse[]) => void;
    onRejected: () => void;
    /** The decision failed (e.g. already decided or expired): the caller should refresh the pending list. */
    onFailed?: () => void;
}

/** Items of an AI proposal with selection, optional edits and Confirm / Reject. A subtask needs its parent selected. */
export const ProposalReview: React.FC<Props> = ({ proposal, members, canDecide, editable = true, onConfirmed, onRejected, onFailed }) => {
    const { items } = proposal;
    const [selected, setSelected] = useState(() => new Set(items.map((i) => i.index)));
    const [edits, setEdits] = useState<Record<number, Edit>>({});
    const [busy, setBusy] = useState(false);

    const toggle = (item: ProposalItem) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(item.index)) {
            next.delete(item.index);
            items.filter((i) => i.parentIndex === item.index).forEach((c) => next.delete(c.index));
        } else {
            next.add(item.index);
            if (item.parentIndex != null) next.add(item.parentIndex);
        }
        return next;
    });

    const edit = (index: number, patch: Edit) => setEdits((e) => ({ ...e, [index]: { ...e[index], ...patch } }));

    const decide = async (action: () => Promise<void>) => {
        setBusy(true);
        try { await action(); } catch { onFailed?.(); /* el listener global muestra el error */ } finally { setBusy(false); }
    };

    const confirm = () => decide(async () => {
        const all = selected.size === items.length && Object.keys(edits).length === 0;
        const body: ProposalItemEdit[] = items.filter((i) => selected.has(i.index)).map((i) => {
            const e = edits[i.index] ?? {};
            const out: ProposalItemEdit = { index: i.index };
            if (e.title !== undefined && e.title.trim() && e.title.trim() !== i.title) out.title = e.title.trim();
            if (e.priority !== undefined && e.priority !== priorityOf(i.priority)) out.priority = e.priority;
            if (e.assignee !== undefined && e.assignee !== (i.assigneeUserId ?? '')) {
                if (e.assignee) out.assigneeUserId = e.assignee; else out.removeAssignee = true;
            }
            return out;
        });
        const { data } = await workItemsService.confirmProposal(proposal.actionId, all ? undefined : body);
        onConfirmed(data.created);
    });

    const reject = () => decide(async () => {
        await workItemsService.rejectProposal(proposal.actionId);
        onRejected();
    });

    return (
        <div>
            <ul className="divide-y divide-slate-200 dark:divide-border-dark">
                {items.map((i) => {
                    const e = edits[i.index] ?? {};
                    const assignee = e.assignee ?? i.assigneeUserId ?? '';
                    const known = members.some((m) => m.id === assignee);
                    return (
                        <li key={i.index} className={`flex flex-wrap items-center gap-2 py-2 ${i.parentIndex != null ? 'pl-6' : ''}`}>
                            {canDecide && (
                                <input
                                    type="checkbox"
                                    className="size-4 accent-primary"
                                    aria-label={`Incluir ${i.title}`}
                                    checked={selected.has(i.index)}
                                    onChange={() => toggle(i)}
                                />
                            )}
                            <Badge variant={TYPE_VARIANTS[typeOf(i.type)]}>{TYPE_LABELS[typeOf(i.type)]}</Badge>
                            {canDecide && editable ? (
                                <input
                                    aria-label={`Título de ${i.title}`}
                                    maxLength={200}
                                    value={e.title ?? i.title}
                                    onChange={(ev) => edit(i.index, { title: ev.target.value })}
                                    className={`${selectClass} min-w-40 flex-1`}
                                />
                            ) : (
                                <span className="min-w-40 flex-1 text-sm text-slate-800 dark:text-slate-100">{i.title}</span>
                            )}
                            {canDecide && editable ? (<>
                                <select
                                    aria-label={`Prioridad de ${i.title}`}
                                    className={selectClass}
                                    value={e.priority ?? priorityOf(i.priority)}
                                    onChange={(ev) => edit(i.index, { priority: Number(ev.target.value) })}
                                >
                                    {Object.values(WorkItemPriority).filter((v): v is WorkItemPriority => typeof v === 'number')
                                        .map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                                </select>
                                <select
                                    aria-label={`Responsable de ${i.title}`}
                                    className={selectClass}
                                    value={assignee}
                                    onChange={(ev) => edit(i.index, { assignee: ev.target.value })}
                                >
                                    <option value="">Sin asignar</option>
                                    {assignee && !known && <option value={assignee}>{i.assigneeName ?? 'Responsable sugerido'}</option>}
                                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </>) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {PRIORITY_LABELS[priorityOf(i.priority)]} · {i.assigneeName ?? 'Sin asignar'}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
            {canDecide && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" icon={Check} isLoading={busy} disabled={selected.size === 0} onClick={confirm}>
                        Confirmar {selected.size === items.length ? 'todas' : `${selected.size} de ${items.length}`}
                    </Button>
                    <Button size="sm" variant="outline" icon={X} disabled={busy} onClick={reject}>Rechazar</Button>
                </div>
            )}
        </div>
    );
};
