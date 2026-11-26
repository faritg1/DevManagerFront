import React, { useState } from 'react';
import { platformService } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { FormPanel, FormSection } from '../../../shared/ui';
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

    const save = async () => {
        const response = await platformService.createOrganization(toOrganizationRequest(form));
        showNotification({ type: 'success', message: response.message || 'Entidad creada' });
        onCreated();
        onClose();
    };

    return (
        <FormPanel isOpen onClose={onClose} onSubmit={save} title="Crear entidad">
            <FormSection>
                {/* The fields bring their own rows: they are shared with the public register. */}
                <div className="flex flex-col gap-4 sm:col-span-2">
                    <OrganizationFields value={form} onChange={setForm} />
                </div>
            </FormSection>
        </FormPanel>
    );
};
