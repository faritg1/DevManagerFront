import React, { useEffect, useState } from 'react';
import { workItemsService, type LinkedWorkItem, type WorkItemLinksResponse, type WorkItemResponse } from '../../../shared/api';
import { useToast } from '../../../shared/context';
import { Badge, Button, Select } from '../../../shared/ui';
import { STATUS_LABELS, STATUS_VARIANTS } from '../workItemMeta';

interface Props {
    itemId: string;
    /** Items of the project, to pick the other end of a new link. */
    items: WorkItemResponse[];
    /** May add and remove links (edit permission, project not read-only). */
    canEdit: boolean;
    onOpenItem: (itemId: string) => void;
    /** Links changed: the parent refreshes the open-blocker counts. */
    onChange: () => void;
}

/** "Dependencias" of the activity detail: what it blocks, what blocks it, and a small form to link another item. */
export const WorkItemDependencies: React.FC<Props> = ({ itemId, items, canEdit, onOpenItem, onChange }) => {
    const toast = useToast();
    const [links, setLinks] = useState<WorkItemLinksResponse | null>(null);
    const [relation, setRelation] = useState<'blocks' | 'blockedBy'>('blocks');
    const [other, setOther] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setLinks(null);
        setOther('');
        workItemsService.links(itemId).then((r) => setLinks(r.data ?? { blocks: [], blockedBy: [] }), () => setLinks({ blocks: [], blockedBy: [] }));
    }, [itemId]);

    const linked = new Set([...(links?.blocks ?? []), ...(links?.blockedBy ?? [])].map((l) => l.itemId));
    const candidates = items.filter((i) => i.id !== itemId && !linked.has(i.id));

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!other) return;
        setBusy(true);
        try {
            const { data } = await workItemsService.addLink(itemId, relation === 'blocks' ? { blockedItemId: other } : { blockerItemId: other });
            setLinks(data);
            setOther('');
            onChange();
            toast.success('Dependencia agregada');
        } catch {
            // el listener global muestra el error
        } finally { setBusy(false); }
    };

    const remove = async (link: LinkedWorkItem) => {
        try {
            await workItemsService.removeLink(link.linkId);
            setLinks((l) => l && { blocks: l.blocks.filter((x) => x.linkId !== link.linkId), blockedBy: l.blockedBy.filter((x) => x.linkId !== link.linkId) });
            onChange();
            toast.success('Dependencia eliminada');
        } catch {
            // el listener global muestra el error
        }
    };

    const group = (title: string, list: LinkedWorkItem[]) => list.length > 0 && (
        <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
            <ul className="mt-1 space-y-1">
                {list.map((l) => (
                    <li key={l.linkId} className="flex items-center gap-2 text-sm">
                        <button type="button" className="min-w-0 truncate text-left text-primary hover:underline" onClick={() => onOpenItem(l.itemId)}>
                            <span className="font-mono text-xs font-semibold">{l.key}</span> {l.title}
                        </button>
                        <Badge variant={STATUS_VARIANTS[l.status]}>{STATUS_LABELS[l.status]}</Badge>
                        {canEdit && (
                            <Button size="sm" variant="ghost" className="ml-auto" aria-label={`Quitar dependencia con ${l.key}`} onClick={() => void remove(l)}>
                                Quitar
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <section aria-label="Dependencias" className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-border-dark">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dependencias</h3>
            {!links ? (
                <p className="text-sm text-slate-500">Cargando dependencias…</p>
            ) : (<>
                {links.blocks.length + links.blockedBy.length === 0 && <p className="text-sm text-slate-500">Sin dependencias.</p>}
                {group('Bloquea a', links.blocks)}
                {group('Bloqueada por', links.blockedBy)}
            </>)}
            {canEdit && links && (
                <form onSubmit={(e) => void add(e)} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[auto_1fr_auto]">
                    <Select label="Relación" value={relation} onChange={(e) => setRelation(e.target.value as 'blocks' | 'blockedBy')}>
                        <option value="blocks">Bloquea a</option>
                        <option value="blockedBy">Bloqueada por</option>
                    </Select>
                    <Select label="Actividad" required value={other} onChange={(e) => setOther(e.target.value)}>
                        <option value="">Selecciona…</option>
                        {candidates.map((i) => <option key={i.id} value={i.id}>{i.key} · {i.title}</option>)}
                    </Select>
                    <Button type="submit" size="sm" isLoading={busy} disabled={!other} className="col-span-2 sm:col-span-1">Agregar dependencia</Button>
                </form>
            )}
        </section>
    );
};
