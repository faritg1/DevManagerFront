import React, { useEffect, useState } from 'react';
import { documentsService, usersService, type DossierListItem, type UserResponse } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { today } from '../../../shared/format';
import { Button, Input, Modal, Select } from '../../../shared/ui';
import { errorText, needsLocalToast } from '../../associates/labels';
import { dossierNodeLabel, seriesOptions } from '../labels';
import { loadClassification, useRows } from '../useRows';

interface Props {
    /** Null creates a new dossier, which needs the classification chart to choose its series. */
    dossier: DossierListItem | null;
    onClose: () => void;
    onSaved: () => void;
}

/** Creates or edits a dossier. Code and series never change, and a closed one only admits another owner or location. */
export const DossierFormDialog: React.FC<Props> = ({ dossier, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState({
        code: dossier?.code ?? '',
        title: dossier?.title ?? '',
        classificationNodeId: dossier?.classificationNodeId ?? '',
        ownerUserId: dossier?.ownerUserId ?? '',
        openedOn: dossier?.openedOn ?? today(),
        physicalLocation: dossier?.physicalLocation ?? '',
    });
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [saving, setSaving] = useState(false);
    const series = seriesOptions(useRows(loadClassification, !dossier) ?? []);
    const closed = dossier?.status === 'Closed';
    // The current owner stays an option while the users load, or when it was deactivated later.
    const ownOwner = dossier && !users.some((u) => u.id === dossier.ownerUserId) ? dossier : null;

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
        const { code, classificationNodeId, ...fields } = form;
        const data = { ...fields, physicalLocation: form.physicalLocation.trim() || null };
        try {
            await (dossier ? documentsService.updateDossier(dossier.id, data) : documentsService.createDossier({ code, classificationNodeId, ...data }));
            showNotification({ type: 'success', message: dossier ? 'Expediente actualizado' : 'Expediente creado' });
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
            title={dossier ? `Editar ${dossier.code}` : 'Nuevo expediente'}
            size="lg"
            footer={<>
                <Button type="submit" isLoading={saving}>Guardar</Button>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Código" value={form.code} onChange={set('code')} maxLength={50} required disabled={!!dossier} hint={dossier ? 'El código no cambia después de creado.' : undefined} />
                <Input label="Título" value={form.title} onChange={set('title')} maxLength={200} required disabled={closed} />
                <div className="sm:col-span-2">
                    {dossier ? (
                        <Input label="Serie" value={dossierNodeLabel(dossier)} disabled readOnly hint="La serie no cambia después de creado." />
                    ) : (
                        <Select label="Serie" value={form.classificationNodeId} onChange={set('classificationNodeId')} required hint="Serie o subserie del cuadro de clasificación.">
                            <option value="">Selecciona una serie</option>
                            {series.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </Select>
                    )}
                </div>
                <Select label="Responsable" value={form.ownerUserId} onChange={set('ownerUserId')} required>
                    <option value="">Selecciona un responsable</option>
                    {ownOwner && <option value={ownOwner.ownerUserId}>{ownOwner.ownerName ?? '—'}</option>}
                    {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </Select>
                <Input label="Fecha de apertura" type="date" value={form.openedOn} onChange={set('openedOn')} max={today()} required disabled={closed} />
                <div className="sm:col-span-2">
                    <Input
                        label="Ubicación física"
                        value={form.physicalLocation}
                        onChange={set('physicalLocation')}
                        maxLength={200}
                        placeholder="Ej. Archivo de gestión, estante 2, caja 4"
                        hint={closed ? 'El expediente está cerrado: solo cambian el responsable y la ubicación física.' : 'Opcional: dónde está el expediente en papel, si lo hay.'}
                    />
                </div>
            </div>
        </Modal>
    );
};
