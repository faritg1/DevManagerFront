import React, { useState } from 'react';
import { documentsService, type DocumentVersion } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { FormPanel, FormSection, Input, Textarea } from '../../../shared/ui';
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
    const error = file ? fileError(file) : null;

    const save = async () => {
        // The field already shows why the file is refused.
        if (error) return;
        await (version
            ? documentsService.updateVersion(documentId, version.id, summary, file)
            : documentsService.addVersion(documentId, summary, file!));
        showNotification({ type: 'success', message: version ? 'Versión corregida' : 'Versión creada' });
        onSaved();
    };

    return (
        <FormPanel
            isOpen
            onClose={onClose}
            onSubmit={save}
            title={version ? `Corregir versión ${version.versionNumber}` : 'Subir versión'}
        >
            <FormSection>
                <div className="sm:col-span-2">
                    <Textarea label="Resumen del cambio" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} rows={3} required />
                </div>
                <div className="sm:col-span-2">
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
            </FormSection>
        </FormPanel>
    );
};
