import React from 'react';
import { WorkItemType, type WorkItemResponse } from '../../../shared/api';
import { formatDate, formatNumber } from '../../../shared/format';
import {
    ActionMenu, Badge, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TD_TRUNCATE_CLASS, THEAD_CLASS, TH_ACTIONS_CLASS, TH_CLASS, TR_CLASS,
    type ActionMenuItem,
} from '../../../shared/ui';
import { isOverdue, PRIORITY_LABELS, PRIORITY_VARIANTS, STATUS_LABELS, STATUS_VARIANTS, TYPE_LABELS, TYPE_VARIANTS } from '../workItemMeta';

interface Props {
    items: WorkItemResponse[];
    /** Every item of the project, to name a subtask's parent even when a filter hides it. */
    allItems: WorkItemResponse[];
    nameOf: (userId: string | null | undefined) => string;
    /** Menu entries for a row (empty hides the menu). */
    actionsFor: (item: WorkItemResponse) => ActionMenuItem[];
}

export const WorkItemTable: React.FC<Props> = ({ items, allItems, nameOf, actionsFor }) => {
    const keyOf = new Map(allItems.map((i) => [i.id, i.key]));
    return (
        <div className="overflow-x-auto">
            <table className={TABLE_CLASS}>
                <thead className={THEAD_CLASS}>
                    <tr>
                        <th className={TH_CLASS}>Clave</th>
                        <th className={TH_CLASS}>Título</th>
                        <th className={TH_CLASS}>Estado</th>
                        <th className={TH_CLASS}>Responsable</th>
                        <th className={TH_CLASS}>Prioridad</th>
                        <th className={TH_CLASS}>Vence</th>
                        <th className={TH_CLASS}>Horas est.</th>
                        <th className={TH_ACTIONS_CLASS}><span className="sr-only">Acciones</span></th>
                    </tr>
                </thead>
                <tbody className={TBODY_CLASS}>
                    {items.map((i) => {
                        const actions = actionsFor(i);
                        return (
                            <tr key={i.id} className={TR_CLASS}>
                                <td className={`${TD_CLASS} font-mono text-xs font-semibold`}>{i.key}</td>
                                <td className={TD_CLASS}>
                                    <span className={`${TD_TRUNCATE_CLASS} font-medium text-slate-900 dark:text-white`} title={i.title}>{i.title}</span>
                                    <span className="mt-1 flex items-center gap-2">
                                        <Badge variant={TYPE_VARIANTS[i.type]}>{TYPE_LABELS[i.type]}</Badge>
                                        {i.type === WorkItemType.Subtask && i.parentId && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">de {keyOf.get(i.parentId) ?? '—'}</span>
                                        )}
                                    </span>
                                </td>
                                <td className={TD_CLASS}><Badge variant={STATUS_VARIANTS[i.status]}>{STATUS_LABELS[i.status]}</Badge></td>
                                <td className={TD_CLASS}>{nameOf(i.assigneeUserId)}</td>
                                <td className={TD_CLASS}><Badge variant={PRIORITY_VARIANTS[i.priority]}>{PRIORITY_LABELS[i.priority]}</Badge></td>
                                <td className={TD_CLASS}>
                                    {formatDate(i.dueDate)}
                                    {isOverdue(i) && <span className="ml-2"><Badge variant="danger">Vencida</Badge></span>}
                                </td>
                                <td className={TD_CLASS}>{i.estimateHours != null ? formatNumber(i.estimateHours, 2) : '—'}</td>
                                <td className={`${TD_CLASS} text-right`}>
                                    {actions.length > 0 && <ActionMenu label={`Acciones de ${i.key}`} items={actions} />}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
