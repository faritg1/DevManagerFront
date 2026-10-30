import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Edit2, Eye, KanbanSquare, ListChecks, Plus, Table2, Trash2 } from 'lucide-react';
import {
    assignmentsService, projectsService, workItemsService,
    WorkItemType, type ProjectResponse, type WorkItemResponse, type WorkItemStatus,
} from '../../shared/api';
import { ROUTES } from '../../shared/config/constants';
import { useAuth, useToast } from '../../shared/context';
import type { CsvColumn } from '../../shared/export';
import { formatDate } from '../../shared/format';
import { useConfirm, usePermission } from '../../shared/hooks';
import {
    Button, Card, EmptyState, ExportButton, Input, LoadingBlock, PageContainer, PageHeader, Select, type ActionMenuItem,
} from '../../shared/ui';
import { KanbanBoard } from './components/KanbanBoard';
import { KeyPrefixSetup } from './components/KeyPrefixSetup';
import { WorkItemDetailDrawer } from './components/WorkItemDetailDrawer';
import { WorkItemFormModal, type Member } from './components/WorkItemFormModal';
import { WorkItemTable } from './components/WorkItemTable';
import { isProjectReadOnly, PRIORITY_LABELS, STATUS_LABELS, STATUS_ORDER, TYPE_LABELS } from './workItemMeta';

/** Active member (AssignmentStatus.Active = 1, not ended), one entry per user. */
const ACTIVE_ASSIGNMENT = 1;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Activities (work items) of one project: backlog list with filters, create/edit/delete and CSV export. */
export const ActivitiesPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [search, setSearch] = useSearchParams();
    const toast = useToast();
    const { confirm } = useConfirm();
    const { has } = usePermission();
    const { user } = useAuth();

    const [projects, setProjects] = useState<ProjectResponse[] | null>(null);
    const [items, setItems] = useState<WorkItemResponse[] | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [failed, setFailed] = useState(false);
    const [editing, setEditing] = useState<WorkItemResponse | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');
    const [assignee, setAssignee] = useState('');
    const [view, setView] = useState<'list' | 'board'>('list');

    const project = projects?.find((p) => p.id === projectId);
    const readOnly = isProjectReadOnly(project);

    useEffect(() => {
        projectsService.getAll().then((r) => setProjects(r.data ?? []), () => setProjects([]));
    }, []);

    const load = useCallback(() => {
        if (!projectId) return;
        setItems(null);
        setFailed(false);
        workItemsService.list(projectId).then((r) => setItems(r.data ?? []), () => setFailed(true));
        assignmentsService.getAll({ projectId }).then((r) => {
            const byUser = new Map<string, Member>();
            for (const a of r.data ?? []) {
                if (a.status === ACTIVE_ASSIGNMENT && !a.endedAt) byUser.set(a.userId, { id: a.userId, name: a.userName });
            }
            setMembers([...byUser.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')));
        }, () => setMembers([]));
    }, [projectId]);

    useEffect(() => {
        setQuery(''); setStatus(''); setType(''); setAssignee('');
        load();
    }, [load]);

    const nameOf = useCallback(
        (id: string | null | undefined) => (id ? members.find((m) => m.id === id)?.name ?? '—' : 'Sin asignar'),
        [members],
    );

    const visible = useMemo(() => {
        const q = norm(query.trim());
        return (items ?? []).filter((i) =>
            (!status || i.status === Number(status))
            && (!type || i.type === Number(type))
            && (!assignee || (assignee === 'none' ? !i.assigneeUserId : i.assigneeUserId === assignee))
            && (!q || norm(`${i.key} ${i.title}`).includes(q)));
    }, [items, query, status, type, assignee]);

    const noPrefix = !!project && !project.keyPrefix;
    const canCreate = has('menu.platform.activities.create') && !readOnly && !noPrefix;
    const canEdit = has('menu.platform.activities.edit') && !readOnly;
    const canDelete = has('menu.platform.activities.delete') && !readOnly;

    const openForm = (item: WorkItemResponse | null) => { setEditing(item); setFormOpen(true); };

    const saved = (item: WorkItemResponse) => {
        setItems((list) => (list?.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...(list ?? []), item]));
        toast.success(editing ? 'Actividad actualizada' : `Actividad ${item.key} creada`);
    };

    const remove = async (item: WorkItemResponse) => {
        const ok = await confirm({
            title: 'Eliminar actividad',
            message: `¿Eliminar ${item.key} "${item.title}"? Sus subtareas también se eliminarán.`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        try {
            await workItemsService.remove(item.id);
            // Deleting a parent removes its subtasks too.
            setItems((list) => list?.filter((i) => i.id !== item.id && i.parentId !== item.id) ?? null);
            toast.success('Actividad eliminada');
        } catch {
            // el listener global muestra el error
        }
    };

    // The API lets the assignee move an item without the move permission.
    const canMoveItem = (item: WorkItemResponse) =>
        !readOnly && (has('menu.platform.activities.move') || (!!user && item.assigneeUserId === user.id));

    /** Optimistic move: the card jumps at once and goes back (with a toast) if the API refuses. */
    const move = async (item: WorkItemResponse, status: WorkItemStatus, beforeId?: string) => {
        if (!items || (item.status === status && !beforeId)) return;
        const snapshot = items;
        const rest = items.filter((i) => i.id !== item.id);
        const at = beforeId ? rest.findIndex((i) => i.id === beforeId) : -1;
        rest.splice(at >= 0 ? at : rest.length, 0, { ...item, status });
        setItems(rest);
        try {
            const { data } = await workItemsService.move(item.id, { status, beforeId: beforeId ?? null });
            setItems((list) => list?.map((i) => (i.id === item.id ? data : i)) ?? null);
        } catch {
            setItems(snapshot); // the global listener shows the one error toast
        }
    };

    const actionsFor = (item: WorkItemResponse): ActionMenuItem[] => [
        { label: 'Ver detalle', icon: Eye, onSelect: () => setSearch({ item: item.id }) },
        ...(canMoveItem(item)
            ? STATUS_ORDER.filter((s) => s !== item.status)
                .map((s) => ({ label: `Mover a ${STATUS_LABELS[s]}`, icon: ArrowRightLeft, onSelect: () => void move(item, s) }))
            : []),
        ...(canEdit ? [{ label: 'Editar', icon: Edit2, separated: true, onSelect: () => openForm(item) }] : []),
        ...(canDelete ? [{ label: 'Eliminar', icon: Trash2, danger: true, separated: canEdit || canMoveItem(item), onSelect: () => void remove(item) }] : []),
    ];

    const columns: CsvColumn<WorkItemResponse>[] = [
        { header: 'Clave', value: (i) => i.key },
        { header: 'Tipo', value: (i) => TYPE_LABELS[i.type] },
        { header: 'Título', value: (i) => i.title },
        { header: 'Estado', value: (i) => STATUS_LABELS[i.status] },
        { header: 'Responsable', value: (i) => nameOf(i.assigneeUserId) },
        { header: 'Prioridad', value: (i) => PRIORITY_LABELS[i.priority] },
        { header: 'Vence', value: (i) => formatDate(i.dueDate, undefined, '') },
        { header: 'Horas estimadas', value: (i) => i.estimateHours },
    ];

    const openItem = items?.find((i) => i.id === search.get('item')) ?? null;
    const parents = (items ?? []).filter((i) => i.type !== WorkItemType.Subtask);

    return (
        <PageContainer>
            <PageHeader
                icon={<ListChecks className="text-primary" size={26} aria-hidden="true" />}
                title="Actividades"
                description="Tareas, historias, bugs y subtareas de cada proyecto."
                actions={project && items && (
                    <>
                        <ExportButton rows={visible} columns={columns} filename={`actividades-${project.keyPrefix ?? 'proyecto'}`} />
                        {canCreate && <Button icon={Plus} onClick={() => openForm(null)}>Nueva actividad</Button>}
                    </>
                )}
            />

            <Card className="mb-4">
                <Select
                    label="Proyecto"
                    value={projectId ?? ''}
                    disabled={!projects}
                    onChange={(e) => navigate(e.target.value ? `${ROUTES.ACTIVITIES}/${e.target.value}` : ROUTES.ACTIVITIES)}
                >
                    <option value="">Selecciona un proyecto…</option>
                    {projects?.map((p) => <option key={p.id} value={p.id}>{p.keyPrefix ? `${p.keyPrefix} · ` : ''}{p.name}</option>)}
                </Select>
            </Card>

            {!projectId ? (
                <EmptyState icon={ListChecks} title="Elige un proyecto" description="Selecciona un proyecto para ver y gestionar sus actividades." />
            ) : !projects ? (
                <LoadingBlock label="Cargando proyectos…" />
            ) : !project ? (
                <EmptyState title="Proyecto no encontrado" description="No existe o no tienes acceso a él." />
            ) : (<>
                {noPrefix && (
                    <KeyPrefixSetup
                        projectId={project.id}
                        canSet={has('menu.platform.projects.edit') && !readOnly}
                        onSaved={(keyPrefix) => setProjects((ps) => ps?.map((p) => (p.id === project.id ? { ...p, keyPrefix } : p)) ?? null)}
                    />
                )}
                {readOnly && (
                    <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300" role="status">
                        Este proyecto está cerrado o cancelado: las actividades son de solo lectura.
                    </p>
                )}

                <div role="tablist" aria-label="Vista de actividades" className="mb-3 flex gap-2">
                    {([['list', 'Backlog', Table2], ['board', 'Tablero', KanbanSquare]] as const).map(([key, label, Icon]) => (
                        <Button
                            key={key}
                            role="tab"
                            aria-selected={view === key}
                            variant={view === key ? 'primary' : 'outline'}
                            size="sm"
                            icon={Icon}
                            onClick={() => setView(key)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                <Card padding="none" className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-border-dark">
                        <Input label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Clave o título" />
                        <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">Todos</option>
                            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </Select>
                        <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="">Todos</option>
                            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </Select>
                        <Select label="Responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="none">Sin asignar</option>
                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Select>
                    </div>

                    {failed ? (
                        <EmptyState title="No se pudieron cargar las actividades" description="Es posible que no seas miembro de este proyecto." />
                    ) : !items ? (
                        <LoadingBlock label="Cargando actividades…" />
                    ) : items.length === 0 ? (
                        <EmptyState
                            icon={ListChecks}
                            title="Aún no hay actividades"
                            description={canCreate ? 'Crea la primera con "Nueva actividad".' : undefined}
                        />
                    ) : visible.length === 0 ? (
                        <EmptyState icon={ListChecks} title="Sin resultados con estos filtros" />
                    ) : view === 'board' ? (
                        <KanbanBoard items={visible} nameOf={nameOf} canMove={canMoveItem} onMove={move} actionsFor={actionsFor} />
                    ) : (
                        <WorkItemTable items={visible} allItems={items} nameOf={nameOf} actionsFor={actionsFor} />
                    )}
                </Card>

                <WorkItemDetailDrawer
                    item={openItem}
                    onClose={() => setSearch({})}
                    members={members}
                    nameOf={nameOf}
                    canComment={has('menu.platform.activities.comment') && !readOnly}
                    userId={user?.id}
                    highlightCommentId={search.get('comment')}
                />

                <WorkItemFormModal
                    isOpen={formOpen}
                    onClose={() => setFormOpen(false)}
                    projectId={project.id}
                    item={editing}
                    members={members}
                    parents={parents}
                    onSaved={saved}
                />
            </>)}
        </PageContainer>
    );
};
