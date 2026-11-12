import React, { useState } from 'react';
import { documentsService, type DossierDetail, type DossierItem } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { today } from '../../../shared/format';
import { Button, Input, Modal, Select } from '../../../shared/ui';
import { errorText, needsLocalToast } from '../../associates/labels';
import { ACCEPTED_FILES, MAX_FILE_MB, dossierTypes, fileError } from '../labels';
import { loadClassification, useRows } from '../useRows';

interface Props {
    dossier: DossierDetail;
    /** The document to correct; null incorporates a new one with its file. */
    item: DossierItem | null;
    onClose: () => void;
    onSaved: () => void;
}

/** Incorporates a document or corrects its title, type and date. Its file is never replaced: the index only grows. */
export const DossierItemDialog: React.FC<Props> = ({ dossier, item, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState({
        title: item?.title ?? '',
        documentaryTypeId: item?.documentaryTypeId ?? '',
        documentDate: item?.documentDate ?? '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const error = file ? fileError(file) : null;
    // The types come from the chart, which the dossiers permission also reads.
    const tree = useRows(loadClassification, true);
    const types = dossierTypes(tree ?? [], dossier.classificationNodeId);
    // The document's own type is always an option: the chart may still be loading.
    const ownType = item?.documentaryTypeId && !types.some((t) => t.id === item.documentaryTypeId) ? item : null;

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { value } = e.target;
        setForm((f) => ({ ...f, [key]: value }));
    };

    const save = async () => {
        if (saving || error) return;
        setSaving(true);
        const data = { ...form, documentaryTypeId: form.documentaryTypeId || null };
        try {
            await (item ? documentsService.updateDossierItem(dossier.id, item.id, data) : documentsService.addDossierItem(dossier.id, data, file!));
            showNotification({ type: 'success', message: item ? 'Documento corregido' : 'Documento incorporado' });
            onSaved();
        } catch (e) {
            // An upload that runs out of time is not an ApiError: nothing else would tell the user.
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e, 'No se pudo subir el archivo. Intenta de nuevo.') });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            onSubmit={save}
            title={item ? `Corregir documento ${item.position}` : 'Incorporar documento'}
            footer={<>
                <Button type="submit" isLoading={saving}>Guardar</Button>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            <div className="space-y-4">
                <Input label="Título" value={form.title} onChange={set('title')} maxLength={200} required />
                <Select label="Tipo documental" value={form.documentaryTypeId} onChange={set('documentaryTypeId')} hint="Tipos de la serie del expediente.">
                    <option value="">Sin tipo</option>
                    {ownType && <option value={ownType.documentaryTypeId ?? ''}>{ownType.documentaryTypeName ?? '—'}</option>}
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
                <Input label="Fecha del documento" type="date" value={form.documentDate} onChange={set('documentDate')} max={today()} required />
                {!item && (
                    <Input
                        label="Archivo"
                        type="file"
                        accept={ACCEPTED_FILES}
                        required
                        error={error ?? undefined}
                        hint={`PDF, DOCX, XLSX, PNG o JPG, hasta ${MAX_FILE_MB} MB. No se reemplaza después de incorporado.`}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                )}
            </div>
        </Modal>
    );
};
