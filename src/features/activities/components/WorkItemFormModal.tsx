import React, { useEffect, useState } from 'react';
import { SprintStatus, workItemsService, WorkItemPriority, WorkItemType, type SprintResponse, type WorkItemResponse } from '../../../shared/api';
import { Button, Input, Modal, Select, Textarea } from '../../../shared/ui';
import { dayOf, PRIORITY_LABELS, TYPE_LABELS } from '../workItemMeta';

export interface Member { id: string; name: string }

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    /** The item being edited; null creates a new one. */
    item: WorkItemResponse | null;
    members: Member[];
    /** Candidate parents for a subtask (top-level items). */
    parents: WorkItemResponse[];
    /** Sprints of the project; undefined hides the field (sprints off). The item's sprint is kept either way. */
    sprints?: SprintResponse[];
    /** Sprint preselected for a new item (the filtered one). */
    defaultSprintId?: string;
    onSaved: (item: WorkItemResponse) => void;
}

interface Form {
    type: WorkItemType; title: string; description: string; assignee: string;
    priority: WorkItemPriority; dueDate: string; estimate: string; parentId: string; sprint: string;
}

const blank = (sprint = ''): Form => ({
    type: WorkItemType.Task, title: '', description: '', assignee: '',
    priority: WorkItemPriority.Medium, dueDate: '', estimate: '', parentId: '', sprint,
});

const fromItem = (i: WorkItemResponse): Form => ({
    type: i.type, title: i.title, description: i.description ?? '', assignee: i.assigneeUserId ?? '',
    priority: i.priority, dueDate: dayOf(i.dueDate), estimate: i.estimateHours?.toString() ?? '', parentId: i.parentId ?? '',
    sprint: i.sprintId ?? '',
});

const numbers = <E extends number>(e: Record<string, string | E>): E[] => Object.values(e).filter((v): v is E => typeof v === 'number');

export const WorkItemFormModal: React.FC<Props> = ({ isOpen, onClose, projectId, item, members, parents, sprints, defaultSprintId = '', onSaved }) => {
    const [form, setForm] = useState<Form>(blank);
    const [saving, setSaving] = useState(false);
    const isSubtask = form.type === WorkItemType.Subtask;

    // eslint-disable-next-line react-hooks/exhaustive-deps -- the default only matters when the form opens
    useEffect(() => { if (isOpen) setForm(item ? fromItem(item) : blank(defaultSprintId)); }, [isOpen, item]);

    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

    const submit = async () => {
        const body = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            assigneeUserId: form.assignee || null,
            priority: form.priority,
            dueDate: form.dueDate || null,
            estimateHours: form.estimate === '' ? null : Number(form.estimate),
            sprintId: form.sprint || null,
        };
        setSaving(true);
        try {
            const { data } = item
                ? await workItemsService.update(item.id, body)
                : await workItemsService.create(projectId, { ...body, type: form.type, parentId: isSubtask ? form.parentId : null });
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
            isOpen={isOpen}
            onClose={onClose}
            title={item ? `Editar ${item.key}` : 'Nueva actividad'}
            size="lg"
            onSubmit={submit}
            footer={<>
                <Button type="submit" isLoading={saving}>{item ? 'Guardar cambios' : 'Crear actividad'}</Button>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {!item && (
                    <Select label="Tipo" value={form.type} onChange={(e) => set('type', Number(e.target.value))}>
                        {numbers<WorkItemType>(WorkItemType).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </Select>
                )}
                {!item && isSubtask && (
                    <Select label="Actividad padre" required value={form.parentId} onChange={(e) => set('parentId', e.target.value)}>
                        <option value="">Selecciona…</option>
                        {parents.map((p) => <option key={p.id} value={p.id}>{p.key} · {p.title}</option>)}
                    </Select>
                )}
                <div className="sm:col-span-2">
                    <Input label="Título" required maxLength={200} value={form.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                    <Textarea label="Descripción" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
                </div>
                <Select label="Responsable" value={form.assignee} onChange={(e) => set('assignee', e.target.value)}>
                    <option value="">Sin asignar</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
                <Select label="Prioridad" value={form.priority} onChange={(e) => set('priority', Number(e.target.value))}>
                    {numbers<WorkItemPriority>(WorkItemPriority).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </Select>
                <Input label="Fecha límite" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
                <Input label="Estimación (horas)" type="number" min={0} max={9999.99} step={0.25} value={form.estimate} onChange={(e) => set('estimate', e.target.value)} />
                {sprints && (
                    <Select label="Sprint" value={form.sprint} onChange={(e) => set('sprint', e.target.value)}>
                        <option value="">Sin sprint</option>
                        {/* A closed sprint takes no new items; the item's own one still shows */}
                        {sprints.filter((s) => s.status !== SprintStatus.Closed || s.id === item?.sprintId)
                            .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                )}
            </div>
        </Modal>
    );
};
