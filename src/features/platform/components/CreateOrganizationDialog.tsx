import React, { useState } from 'react';
import { platformService } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, Modal } from '../../../shared/ui';
import { EMPTY_ORGANIZATION, OrganizationFields, toOrganizationRequest } from '../../auth/components/OrganizationFields';

interface CreateOrganizationDialogProps {
    onClose: () => void;
    /** Called after the API created the organization, before closing. */
    onCreated: () => void;
}

/**
 * A new organization with its Admin, active from the start (super admin only; the API answers 403 to anyone else
 * and during an impersonation). Mount it to open it: every opening starts empty.
 */
export const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({ onClose, onCreated }) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState(EMPTY_ORGANIZATION);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const response = await platformService.createOrganization(toOrganizationRequest(form));
            showNotification({ type: 'success', message: response.message || 'Entidad creada' });
            onCreated();
            onClose();
        } catch {
            // el listener global muestra el error
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Crear entidad"
            size="lg"
            onSubmit={save}
            footer={
                <>
                    <Button type="submit" isLoading={saving}>Guardar</Button>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <OrganizationFields value={form} onChange={setForm} />
            </div>
        </Modal>
    );
};
