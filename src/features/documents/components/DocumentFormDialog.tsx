import React, { useEffect, useState } from 'react';
import { documentsService, usersService, type DocumentListItem, type UserResponse } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, Input, Modal, Select } from '../../../shared/ui';
import { errorText, needsLocalToast } from '../../associates/labels';

interface Props {
    /** Null creates a new document. */
    document: DocumentListItem | null;
    onClose: () => void;
    onSaved: () => void;
}

export const DocumentFormDialog: React.FC<Props> = ({ document, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState({
        code: document?.code ?? '',
        title: document?.title ?? '',
        type: document?.type ?? '',
        process: document?.process ?? '',
        ownerUserId: document?.ownerUserId ?? '',
        reviewDate: document?.reviewDate ?? '',
    });
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        usersService.getAll().then((r) => setUsers((r.data ?? []).filter((u) => u.isActive)), () => setUsers([]));
    }, []);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { value } = e.target;
        setForm((f) => ({ ...f, [key]: value }));
    };

    const save = async () => {
        if (saving) return;
        setSaving(true);
        const { code, ...fields } = form;
        const data = { ...fields, reviewDate: form.reviewDate || null };
        try {
            await (document ? documentsService.update(document.id, data) : documentsService.create({ code, ...data }));
            showNotification({ type: 'success', message: document ? 'Documento actualizado' : 'Documento creado' });
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
            title={document ? `Editar ${document.code}` : 'Nuevo documento'}
            size="lg"
            footer={<>
                <Button type="submit" isLoading={saving}>Guardar</Button>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Código" value={form.code} onChange={set('code')} maxLength={50} required disabled={!!document} hint={document ? 'El código no cambia después de creado.' : undefined} />
                <Input label="Título" value={form.title} onChange={set('title')} maxLength={200} required />
                <Input label="Tipo" value={form.type} onChange={set('type')} maxLength={100} required />
                <Input label="Proceso" value={form.process} onChange={set('process')} maxLength={100} required />
                <Select label="Responsable" value={form.ownerUserId} onChange={set('ownerUserId')} required>
                    <option value="">Selecciona un responsable</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </Select>
                <Input label="Fecha de revisión" type="date" value={form.reviewDate} onChange={set('reviewDate')} />
            </div>
        </Modal>
    );
};
