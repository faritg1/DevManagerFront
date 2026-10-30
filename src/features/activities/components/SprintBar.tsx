import React, { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, Play, Plus } from 'lucide-react';
import {
    SprintStatus, workItemsService, WorkItemStatus, type SprintResponse, type WorkItemResponse,
} from '../../../shared/api';
import { useToast } from '../../../shared/context';
import { formatDate } from '../../../shared/format';
import { useConfirm } from '../../../shared/hooks';
import { Badge, Button, Input, Modal, ProgressBar, Textarea } from '../../../shared/ui';
import { dayOf, SPRINT_STATUS_LABELS } from '../workItemMeta';

interface Props {
    projectId: string;
    /** The sprint chosen in the filter; null shows only "Nuevo sprint". */
    selected: SprintResponse | null;
    /** All items of the project; progress is computed from them so it follows every change at once. */
    items: WorkItemResponse[];
    /** Create, edit, start and close (edit permission, project not read-only). */
    canManage: boolean;
    onChanged: (sprint: SprintResponse) => void;
    /** Time tracking on: also shows the hours logged on the sprint's items. */
    showSpent?: boolean;
}

/** Compact bar of the selected sprint: dates, progress (done / non-cancelled) and its actions. */
export const SprintBar: React.FC<Props> = ({ projectId, selected, items, canManage, onChanged, showSpent }) => {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [form, setForm] = useState<SprintResponse | 'new' | null>(null);

    if (!selected && !canManage) return null;

    const mine = selected ? items.filter((i) => i.sprintId === selected.id && i.status !== WorkItemStatus.Cancelled) : [];
    const done = mine.filter((i) => i.status === WorkItemStatus.Done);
    const hours = (list: WorkItemResponse[]) => list.reduce((sum, i) => sum + (i.estimateHours ?? 0), 0);
    const percent = mine.length ? Math.round((1000 * done.length) / mine.length) / 10 : 0;
    const spent = selected ? Math.round(items.filter((i) => i.sprintId === selected.id).reduce((sum, i) => sum + (i.spentHours ?? 0), 0) * 100) / 100 : 0;

    const run = async (action: () => Promise<{ data: SprintResponse }>, message: string) => {
        try {
            onChanged((await action()).data);
            toast.success(message);
        } catch {
            // el listener global muestra el error
        }
    };

    const close = async (sprint: SprintResponse) => {
        const ok = await confirm({
            title: 'Cerrar sprint',
            message: `¿Cerrar "${sprint.name}"? Sus actividades abiertas quedarán sin sprint.`,
            confirmText: 'Cerrar sprint',
        });
        if (ok) await run(() => workItemsService.closeSprint(sprint.id), 'Sprint cerrado');
    };

    return (
        <section aria-label="Sprint seleccionado" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-border-dark dark:bg-white/5">
            {selected && (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{selected.name}</span>
                    <Badge variant={selected.status === SprintStatus.Active ? 'success' : 'default'}>{SPRINT_STATUS_LABELS[selected.status]}</Badge>
                    <span className="text-slate-600 dark:text-slate-400">{formatDate(selected.startDate)} – {formatDate(selected.endDate)}</span>
                    <span className="text-slate-600 dark:text-slate-400">{done.length} de {mine.length} hechas · {hours(done)} / {hours(mine)} h</span>
                    {showSpent && <span className="text-slate-600 dark:text-slate-400">{spent} h dedicadas</span>}
                    <ProgressBar value={percent} size="sm" variant="success" className="w-32" />
                    {selected.goal && <span className="w-full truncate text-slate-500 dark:text-slate-400">{selected.goal}</span>}
                </div>
            )}
            {canManage && (
                <div className="ml-auto flex flex-wrap gap-2">
                    {selected?.status === SprintStatus.Planned && (
                        <Button size="sm" variant="outline" icon={Play} onClick={() => void run(() => workItemsService.startSprint(selected.id), 'Sprint iniciado')}>Iniciar</Button>
                    )}
                    {selected && selected.status !== SprintStatus.Closed && (<>
                        <Button size="sm" variant="outline" icon={CheckCircle2} onClick={() => void close(selected)}>Cerrar sprint</Button>
                        <Button size="sm" variant="outline" icon={Edit2} onClick={() => setForm(selected)}>Editar</Button>
                    </>)}
                    <Button size="sm" icon={Plus} onClick={() => setForm('new')}>Nuevo sprint</Button>
                </div>
            )}
            <SprintFormModal
                projectId={projectId}
                sprint={form}
                onClose={() => setForm(null)}
                onSaved={(s) => { onChanged(s); toast.success(form === 'new' ? 'Sprint creado' : 'Sprint actualizado'); }}
            />
        </section>
    );
};

const SprintFormModal: React.FC<{
    projectId: string;
    /** 'new' creates; a sprint edits it; null is closed. */
    sprint: SprintResponse | 'new' | null;
    onClose: () => void;
    onSaved: (sprint: SprintResponse) => void;
}> = ({ projectId, sprint, onClose, onSaved }) => {
    const editing = sprint && sprint !== 'new' ? sprint : null;
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(editing?.name ?? '');
        setGoal(editing?.goal ?? '');
        setStart(dayOf(editing?.startDate));
        setEnd(dayOf(editing?.endDate));
    }, [sprint]); // eslint-disable-line react-hooks/exhaustive-deps

    const submit = async () => {
        const body = { name: name.trim(), goal: goal.trim() || null, startDate: start, endDate: end };
        setSaving(true);
        try {
            const { data } = editing ? await workItemsService.updateSprint(editing.id, body) : await workItemsService.createSprint(projectId, body);
            onSaved(data);
            onClose();
        } catch {
            // el listener global muestra el error
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={sprint !== null}
            onClose={onClose}
            title={editing ? `Editar ${editing.name}` : 'Nuevo sprint'}
            onSubmit={submit}
            footer={<>
                <Button type="submit" isLoading={saving}>{editing ? 'Guardar cambios' : 'Crear sprint'}</Button>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Input label="Nombre" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                    <Textarea label="Objetivo" rows={2} maxLength={500} value={goal} onChange={(e) => setGoal(e.target.value)} />
                </div>
                <Input label="Inicio" type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
                <Input label="Fin" type="date" required min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
        </Modal>
    );
};
