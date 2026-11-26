import React, { useEffect, useState } from 'react';
import { documentsService, organizationsService, usersService, type DocumentListItem, type UserResponse } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { usePermission } from '../../../shared/hooks';
import { FormPanel, FormSection, Input, Select } from '../../../shared/ui';
import { PERMISSIONS, seriesLabel, seriesOptions } from '../labels';
import { loadClassification, useRows } from '../useRows';

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
        classificationNodeId: document?.classificationNodeId ?? '',
    });
    const [users, setUsers] = useState<UserResponse[]>([]);
    // The organization's catalogs; while empty (or not loaded) type and process stay free text.
    const [catalogs, setCatalogs] = useState<{ documentTypes: string[]; processes: string[] }>({ documentTypes: [], processes: [] });
    // Without the chart permission there is no selector, and the form resends the series the document already had.
    const canClassify = usePermission().has(PERMISSIONS.CLASSIFICATION);
    const tree = useRows(loadClassification, canClassify);
    const series = seriesOptions(tree ?? []);
    // The document's own series is always an option: the chart may still be loading, or the series was deactivated later.
    const ownSeries = document?.classificationNodeId && !series.some((s) => s.id === document.classificationNodeId) ? document : null;

    useEffect(() => {
        usersService.getAll().then((r) => setUsers((r.data ?? []).filter((u) => u.isActive)), () => setUsers([]));
        organizationsService.getCurrent().then((r) => {
            const s = r.data?.documentSettings;
            if (s) setCatalogs({ documentTypes: s.documentTypes ?? [], processes: s.processes ?? [] });
        }, () => undefined);
    }, []);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { value } = e.target;
        setForm((f) => ({ ...f, [key]: value }));
    };

    /** A list when the catalog has values, free text otherwise. The value the document already had stays an option. */
    const catalogField = (key: 'type' | 'process', label: string, placeholder: string, options: string[]) => {
        if (options.length === 0) return <Input label={label} value={form[key]} onChange={set(key)} maxLength={100} required />;
        const own = document?.[key];
        return (
            <Select label={label} value={form[key]} onChange={set(key)} required>
                <option value="">{placeholder}</option>
                {own && !options.includes(own) && <option value={own}>{own}</option>}
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
        );
    };

    const save = async () => {
        const { code, ...fields } = form;
        const data = { ...fields, reviewDate: form.reviewDate || null, classificationNodeId: form.classificationNodeId || null };
        await (document ? documentsService.update(document.id, data) : documentsService.create({ code, ...data }));
        showNotification({ type: 'success', message: document ? 'Documento actualizado' : 'Documento creado' });
        onSaved();
    };

    return (
        <FormPanel
            isOpen
            onClose={onClose}
            onSubmit={save}
            title={document ? `Editar ${document.code}` : 'Nuevo documento'}
        >
            <FormSection>
                <Input label="Código" value={form.code} onChange={set('code')} maxLength={50} required disabled={!!document} hint={document ? 'El código no cambia después de creado.' : undefined} />
                <Input label="Título" value={form.title} onChange={set('title')} maxLength={200} required />
                {catalogField('type', 'Tipo', 'Selecciona un tipo', catalogs.documentTypes)}
                {catalogField('process', 'Proceso', 'Selecciona un proceso', catalogs.processes)}
                <Select label="Responsable" value={form.ownerUserId} onChange={set('ownerUserId')} required>
                    <option value="">Selecciona un responsable</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </Select>
                <Input label="Fecha de revisión" type="date" value={form.reviewDate} onChange={set('reviewDate')} />
                {canClassify && (
                    <div className="sm:col-span-2">
                        <Select label="Serie" value={form.classificationNodeId} onChange={set('classificationNodeId')} hint="Serie o subserie del cuadro de clasificación.">
                            <option value="">Sin clasificar</option>
                            {ownSeries && <option value={ownSeries.classificationNodeId ?? ''}>{seriesLabel(ownSeries)}{tree ? ' (inactiva)' : ''}</option>}
                            {series.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </Select>
                    </div>
                )}
            </FormSection>
        </FormPanel>
    );
};
