import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Input, SELECT_CLASS } from '../../../shared/ui';
import { associatesService } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { DOCUMENT_TYPES, errorText, isApiError, needsLocalToast } from '../labels';

interface Props {
    userId: string;
    documentType?: number;
    documentNumber?: string;
    hasActiveConsent: boolean;
    onSaved: () => void;
}

export const DocumentForm: React.FC<Props> = ({ userId, documentType, documentNumber, hasActiveConsent, onSaved }) => {
    const { showNotification } = useNotification();
    const [type, setType] = useState<number>(documentType ?? 1);
    const [number, setNumber] = useState(documentNumber ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [consentRequired, setConsentRequired] = useState(false);

    const save = async () => {
        setIsSaving(true);
        setConsentRequired(false);
        try {
            const res = await associatesService.setDocument(userId, { documentType: type, documentNumber: number.trim() });
            if (res.success) {
                showNotification({ type: 'success', message: 'Documento actualizado' });
                onSaved();
            }
        } catch (e) {
            if (isApiError(e) && e.errorCode === 'CONSENT_REQUIRED') setConsentRequired(true);
            else if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setIsSaving(false);
        }
    };

    const blocked = !hasActiveConsent || consentRequired;

    return (
        <div className="space-y-4">
            {blocked && (
                <div className="flex gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>
                        Para registrar o editar el documento de identidad se requiere un consentimiento de
                        tratamiento de datos (Habeas Data) activo. Registra el consentimiento en la sección inferior.
                    </span>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-2">
                    <label htmlFor="document-tipo" className="text-slate-700 dark:text-white text-sm font-bold">Tipo</label>
                    <select id="document-tipo"
                        value={type}
                        onChange={(e) => setType(Number(e.target.value))}
                        className={SELECT_CLASS}
                    >
                        {Object.entries(DOCUMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
                <Input label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
                <Button isLoading={isSaving} disabled={!hasActiveConsent || !number.trim()} onClick={save}>
                    Guardar documento
                </Button>
            </div>
        </div>
    );
};
