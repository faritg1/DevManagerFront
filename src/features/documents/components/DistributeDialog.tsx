import React, { useEffect, useState } from 'react';
import { documentsService, rbacService, usersService } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, LoadingBlock, Modal } from '../../../shared/ui';
import { errorText, needsLocalToast } from '../../associates/labels';

interface Option { id: string; name: string }

const Choices: React.FC<{ legend: string; options: Option[]; selected: Set<string>; onToggle: (id: string) => void }> = ({ legend, options, selected, onToggle }) => (
    <fieldset>
        <legend className="mb-2 text-sm font-bold text-slate-700 dark:text-white">{legend}</legend>
        <div className="max-h-48 space-y-1 overflow-y-auto">
            {options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={selected.has(o.id)} onChange={() => onToggle(o.id)} />
                    <span className="min-w-0 break-words">{o.name}</span>
                </label>
            ))}
        </div>
    </fieldset>
);

const toggled = (id: string) => (set: Set<string>) => {
    const next = new Set(set);
    if (!next.delete(id)) next.add(id);
    return next;
};

/** Distribution belongs to the document, so whoever is chosen here also gets the future versions. */
export const DistributeDialog: React.FC<{ documentId: string; onClose: () => void; onSaved: () => void }> = ({ documentId, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const [users, setUsers] = useState<Option[] | null>(null);
    const [roles, setRoles] = useState<Option[]>([]);
    const [userIds, setUserIds] = useState<Set<string>>(new Set());
    const [roleIds, setRoleIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        usersService.getAll().then(
            (r) => setUsers((r.data ?? []).filter((u) => u.isActive).map((u) => ({ id: u.id, name: u.fullName }))),
            () => setUsers([]),
        );
        rbacService.getRoles().then((r) => setRoles(r.data ?? []), () => setRoles([]));
    }, []);

    const save = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const { data } = await documentsService.distribute(documentId, [...userIds], [...roleIds]);
            const n = data.newRecipients;
            showNotification({ type: 'success', message: n === 0 ? 'Sin destinatarios nuevos' : n === 1 ? '1 destinatario nuevo' : `${n} destinatarios nuevos` });
            onSaved();
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            onSubmit={save}
            title="Distribuir documento"
            footer={<>
                <Button type="submit" isLoading={saving} disabled={userIds.size + roleIds.size === 0}>Distribuir</Button>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            {!users ? <LoadingBlock label="Cargando destinatarios…" /> : (
                <div className="space-y-4">
                    <Choices legend="Usuarios" options={users} selected={userIds} onToggle={(id) => setUserIds(toggled(id))} />
                    <Choices legend="Roles" options={roles} selected={roleIds} onToggle={(id) => setRoleIds(toggled(id))} />
                </div>
            )}
        </Modal>
    );
};
