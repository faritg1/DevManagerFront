import React, { useState } from 'react';
import { documentsService, type ClassificationNode, type FinalDisposition, type UpdateClassificationNodeRequest } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, Input, Modal, Select, Textarea } from '../../../shared/ui';
import { errorText, needsLocalToast } from '../../associates/labels';
import { DISPOSITION } from '../labels';

/** A node to edit, or the parent of a new one; neither creates a section. */
export interface NodeTarget {
    node?: ClassificationNode;
    parent?: ClassificationNode;
}

interface Props extends NodeTarget {
    onClose: () => void;
    onSaved: () => void;
}

const NEW_TITLE = { 1: 'Nueva sección', 2: 'Nueva serie', 3: 'Nueva subserie' } as const;

const text = (v: string): string | null => v.trim() || null;
const count = (v: string): number | null => (v === '' ? null : Number(v));

/** Creates or edits a section, series or subseries. The API owns every rule; its message is shown as it comes. */
export const ClassificationNodeDialog: React.FC<Props> = ({ node, parent, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const level = node?.level ?? (parent ? ((parent.level + 1) as 2 | 3) : 1);
    // The node's own values, not the retention that applies: an inheriting subseries stays empty.
    const [form, setForm] = useState({
        code: node?.code ?? '',
        name: node?.name ?? '',
        isActive: node?.isActive ?? true,
        managementYears: node?.managementYears?.toString() ?? '',
        centralYears: node?.centralYears?.toString() ?? '',
        finalDisposition: node?.finalDisposition?.toString() ?? '',
        procedure: node?.procedure ?? '',
        legalBasis: node?.legalBasis ?? '',
    });
    const [saving, setSaving] = useState(false);

    const set = (key: Exclude<keyof typeof form, 'isActive'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { value } = e.target;
        setForm((f) => ({ ...f, [key]: value }));
    };

    const save = async () => {
        if (saving) return;
        setSaving(true);
        // Always the whole node: the PUT clears whatever is left out. A section carries no retention.
        const data: UpdateClassificationNodeRequest = {
            code: form.code.trim(),
            name: form.name.trim(),
            isActive: form.isActive,
            ...(level > 1 && {
                managementYears: count(form.managementYears),
                centralYears: count(form.centralYears),
                finalDisposition: count(form.finalDisposition) as FinalDisposition | null,
                procedure: text(form.procedure),
                legalBasis: text(form.legalBasis),
            }),
        };
        try {
            await (node ? documentsService.updateNode(node.id, data) : documentsService.createNode({ level, parentId: parent?.id ?? null, ...data }));
            showNotification({ type: 'success', message: node ? 'Elemento actualizado' : 'Elemento creado' });
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
            title={node ? `Editar ${node.code}` : parent ? `${NEW_TITLE[level]} en ${parent.code}` : NEW_TITLE[level]}
            size="lg"
            footer={<>
                <Button type="submit" isLoading={saving}>Guardar</Button>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </>}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Código" value={form.code} onChange={set('code')} maxLength={20} required />
                <Input label="Nombre" value={form.name} onChange={set('name')} maxLength={200} required />
                {level > 1 && <>
                    <Input label="Tiempo en gestión (años)" type="number" inputMode="numeric" value={form.managementYears} onChange={set('managementYears')} />
                    <Input label="Tiempo en central (años)" type="number" inputMode="numeric" value={form.centralYears} onChange={set('centralYears')} />
                    <div className="sm:col-span-2">
                        <Select
                            label="Disposición final"
                            value={form.finalDisposition}
                            onChange={set('finalDisposition')}
                            hint={level === 3 ? 'Si no indicas retención, hereda la de su serie.' : 'Los dos tiempos y la disposición van juntos.'}
                        >
                            <option value="">Sin definir</option>
                            {Object.entries(DISPOSITION).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </Select>
                    </div>
                    <div className="sm:col-span-2">
                        <Textarea label="Procedimiento" value={form.procedure} onChange={set('procedure')} maxLength={500} rows={2} />
                    </div>
                    <div className="sm:col-span-2">
                        <Textarea label="Soporte legal" value={form.legalBasis} onChange={set('legalBasis')} maxLength={500} rows={2} hint="La norma o el acuerdo interno que cita la entidad." />
                    </div>
                </>}
                {node && (
                    <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 sm:col-span-2 dark:text-slate-200">
                        <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                        Activo
                    </label>
                )}
            </div>
        </Modal>
    );
};
