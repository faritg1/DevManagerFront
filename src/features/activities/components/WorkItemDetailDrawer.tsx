import { Edit2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { workItemsService, type WorkItemCommentResponse, type WorkItemHistoryEntry, type WorkItemResponse } from '../../../shared/api';
import { useToast } from '../../../shared/context';
import { formatDate, formatDateTime } from '../../../shared/format';
import { useConfirm } from '../../../shared/hooks';
import { Badge, Button, LoadingBlock, Markdown, Modal } from '../../../shared/ui';
import { isOverdue, PRIORITY_LABELS, PRIORITY_VARIANTS, STATUS_LABELS, STATUS_VARIANTS, TYPE_LABELS, TYPE_VARIANTS } from '../workItemMeta';
import { MentionInput } from './MentionInput';
import type { Member } from './WorkItemFormModal';
import { WorkItemHistory } from './WorkItemHistory';

interface Props {
    item: WorkItemResponse | null;
    onClose: () => void;
    members: Member[];
    nameOf: (userId: string | null | undefined) => string;
    /** May the user comment (permission, project not read-only). */
    canComment: boolean;
    userId?: string;
    /** Comment to scroll to and highlight (notification link). */
    highlightCommentId?: string | null;
    /** Opens the edit form; omitted when the user cannot edit. */
    onEdit?: (item: WorkItemResponse) => void;
}

const TOKEN = /@\[([^\]]*)\]\(user:([0-9a-fA-F-]{36})\)/g;

/** Real mentions (the API lists their users) become inline chips; any other token is plain text. */
const withChips = (c: WorkItemCommentResponse) =>
    c.body.replace(TOKEN, (_, name: string, id: string) =>
        c.mentionedUserIds.some((m) => m.toLowerCase() === id.toLowerCase()) ? `\`@${name}\`` : `@${name}`);

const CHIP_CLASS = '[&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:text-primary [&_code::before]:content-none [&_code::after]:content-none';

/** Detail of one activity: comments with @mentions and the change history. */
export const WorkItemDetailDrawer: React.FC<Props> = ({ item, onClose, members, nameOf, canComment, userId, highlightCommentId, onEdit }) => {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [tab, setTab] = useState<'comments' | 'history'>('comments');
    const [comments, setComments] = useState<WorkItemCommentResponse[] | null>(null);
    const [history, setHistory] = useState<WorkItemHistoryEntry[] | null>(null);
    const [draft, setDraft] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const highlighted = useRef<HTMLElement | null>(null);
    const id = item?.id;

    useEffect(() => {
        setTab('comments'); setComments(null); setHistory(null); setDraft(''); setEditingId(null);
        if (id) workItemsService.comments(id).then((r) => setComments(r.data ?? []), () => setComments([]));
    }, [id]);

    const loadHistory = useCallback(() => {
        if (id) workItemsService.history(id).then((r) => setHistory(r.data ?? []), () => setHistory([]));
    }, [id]);
    useEffect(() => { if (tab === 'history' && !history) loadHistory(); }, [tab, history, loadHistory]);

    useEffect(() => { highlighted.current?.scrollIntoView?.({ block: 'center' }); }, [comments, highlightCommentId]);

    const submit = async () => {
        if (!item || !draft.trim()) return;
        setBusy(true);
        try {
            if (editingId) {
                const { data } = await workItemsService.editComment(editingId, draft.trim());
                setComments((l) => l?.map((c) => (c.id === data.id ? data : c)) ?? null);
            } else {
                const { data } = await workItemsService.addComment(item.id, draft.trim());
                setComments((l) => [...(l ?? []), data]);
            }
            setDraft(''); setEditingId(null); setHistory(null);
        } catch {
            // el listener global muestra el error
        } finally { setBusy(false); }
    };

    const remove = async (c: WorkItemCommentResponse) => {
        if (!await confirm({ title: 'Eliminar comentario', message: '¿Eliminar este comentario?', confirmText: 'Eliminar' })) return;
        try {
            await workItemsService.removeComment(c.id);
            setComments((l) => l?.filter((x) => x.id !== c.id) ?? null);
            setHistory(null);
            toast.success('Comentario eliminado');
        } catch {
            // el listener global muestra el error
        }
    };

    return (
        <Modal isOpen={!!item} onClose={onClose} variant="drawer" size="xl" title={item ? `${item.key} · ${item.title}` : undefined}>
            {item && (
                <div className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={TYPE_VARIANTS[item.type]}>{TYPE_LABELS[item.type]}</Badge>
                        <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                        <Badge variant={PRIORITY_VARIANTS[item.priority]}>{PRIORITY_LABELS[item.priority]}</Badge>
                        {isOverdue(item) && <Badge variant="danger">Vencida</Badge>}
                        {onEdit && <Button size="sm" variant="outline" icon={Edit2} className="ml-auto" onClick={() => onEdit(item)}>Editar</Button>}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3 dark:bg-white/5">
                        {([
                            ['Responsable', item.assigneeUserId ? nameOf(item.assigneeUserId) : 'Sin asignar'],
                            ['Reportó', nameOf(item.reporterUserId)],
                            ['Estimado', item.estimateHours != null ? `${item.estimateHours} h` : '—'],
                            ['Vence', formatDate(item.dueDate)],
                            ['Creada', formatDate(item.createdAt)],
                            ...(item.completedAt ? [['Completada', formatDate(item.completedAt)]] : []),
                        ] as [string, string][]).map(([k, v]) => (
                            <div key={k} className="min-w-0">
                                <dt className="text-xs text-slate-500 dark:text-slate-400">{k}</dt>
                                <dd className="truncate font-medium text-slate-900 dark:text-white">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    {item.description && <Markdown text={item.description} />}

                    <div role="tablist" aria-label="Detalle" className="flex gap-2">
                        {([['comments', 'Comentarios'], ['history', 'Historial']] as const).map(([key, label]) => (
                            <Button key={key} role="tab" aria-selected={tab === key} size="sm" variant={tab === key ? 'primary' : 'outline'} onClick={() => setTab(key)}>
                                {label}
                            </Button>
                        ))}
                    </div>

                    {tab === 'history' ? (
                        history ? <WorkItemHistory entries={history} nameOf={nameOf} /> : <LoadingBlock label="Cargando historial…" />
                    ) : !comments ? (
                        <LoadingBlock label="Cargando comentarios…" />
                    ) : (<>
                        {comments.length === 0 && <p className="text-sm text-slate-500">Aún no hay comentarios.</p>}
                        <ul className="space-y-3">
                            {comments.map((c) => {
                                const mine = !!userId && c.authorUserId === userId;
                                const hl = c.id === highlightCommentId;
                                return (
                                    <li
                                        key={c.id}
                                        ref={hl ? (el) => { highlighted.current = el; } : undefined}
                                        data-highlighted={hl || undefined}
                                        className={`rounded-lg border p-3 ${hl ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-border-dark'}`}
                                    >
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-semibold text-slate-900 dark:text-white">{c.authorName}</span>
                                            {' · '}{formatDateTime(c.createdAt)}{c.updatedAt && ' (editado)'}
                                        </p>
                                        <Markdown text={withChips(c)} className={CHIP_CLASS} />
                                        {mine && canComment && (
                                            <div className="mt-1 flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(c.id); setDraft(c.body); }}>Editar</Button>
                                                <Button size="sm" variant="ghost" onClick={() => void remove(c)}>Eliminar</Button>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                        {canComment && (
                            <div className="space-y-2">
                                <MentionInput label={editingId ? 'Editar comentario' : 'Nuevo comentario'} value={draft} onChange={setDraft} members={members} />
                                <div className="flex gap-2">
                                    <Button onClick={() => void submit()} isLoading={busy} disabled={!draft.trim()}>{editingId ? 'Guardar' : 'Comentar'}</Button>
                                    {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setDraft(''); }}>Cancelar</Button>}
                                </div>
                            </div>
                        )}
                    </>)}
                </div>
            )}
        </Modal>
    );
};
