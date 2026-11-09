import React, { useState } from 'react';
import { documentsService, type DocumentVersion } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, Input, Modal, Textarea } from '../../../shared/ui';
import { errorText, needsLocalToast } from '../../associates/labels';
import { ACCEPTED_FILES, MAX_FILE_MB, fileError } from '../labels';

interface Props {
    documentId: string;
    /** The draft to correct; null uploads a new version. */
    version: DocumentVersion | null;
    onClose: () => void;
    onSaved: () => void;
}

export const VersionFormDialog: React.FC<Props> = ({ documentId, version, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const [summary, setSummary] = useState(version?.changeSummary ?? '');
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const error = file ? fileError(file) : null;

    const save = async () => {
        if (saving || error) return;
        setSaving(true);
        try {
            await (version
                ? documentsService.updateVersion(documentId, version.id, summary, file)
                : documentsService.addVersion(documentId, summary, file!));
            showNotification({ type: 'success', message: version ? 'Versión corregida' : 'Versión creada' });
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
            title={version ? `Corregir versión ${version.versionNumber}` : 'Subir versión'}
            footer={<>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" isLoading={saving}>Guardar</Button>
            </>}
        >
            <div className="space-y-4">
                <Textarea label="Resumen del cambio" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} rows={3} required />
                <Input
                    label="Archivo"
                    type="file"
                    accept={ACCEPTED_FILES}
                    required={!version}
                    error={error ?? undefined}
                    hint={version ? `Déjalo vacío para conservar ${version.fileName}.` : `PDF, DOCX, XLSX, PNG o JPG, hasta ${MAX_FILE_MB} MB.`}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
            </div>
        </Modal>
    );
};
