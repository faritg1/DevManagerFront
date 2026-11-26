import React, { useEffect, useState } from 'react';
import { platformService, type OrganizationProviders, type PlatformOrganization } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, LoadingBlock, Modal, Select } from '../../../shared/ui';

/** A stored profile that left the hosting stays listed: the select must show what a save would send. */
const withStored = (names: string[], stored: string | null) => (stored && !names.includes(stored) ? [...names, stored] : names);

interface OrganizationProvidersDialogProps {
    /** The organization whose providers are edited; null keeps the dialog closed. */
    organization: PlatformOrganization | null;
    onClose: () => void;
}

/**
 * Storage and email profile of one organization (super admin only; the API answers 403 to anyone else).
 * The profiles are defined in the hosting; only their names travel. Empty is the hosting default (null).
 */
export const OrganizationProvidersDialog: React.FC<OrganizationProvidersDialogProps> = ({ organization, onClose }) => {
    const { showNotification } = useNotification();
    const [providers, setProviders] = useState<OrganizationProviders | null>(null);
    const [storage, setStorage] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const organizationId = organization?.id;

    useEffect(() => {
        if (!organizationId) return;
        let alive = true;
        setProviders(null);
        platformService.getProviders(organizationId).then(
            (r) => {
                if (!alive) return;
                setStorage(r.data.storageProfile ?? '');
                setEmail(r.data.emailProfile ?? '');
                setProviders(r.data);
            },
            // el listener global muestra el error
            () => { if (alive) onClose(); },
        );
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another organization is opened
    }, [organizationId]);

    const save = async () => {
        if (!organizationId || !providers) return;
        setSaving(true);
        try {
            const response = await platformService.setProviders(organizationId, { storageProfile: storage || null, emailProfile: email || null });
            showNotification({ type: 'success', message: response.message || 'Proveedores actualizados' });
            onClose();
        } catch {
            // el listener global muestra el error
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={!!organization}
            onClose={onClose}
            title="Proveedores"
            onSubmit={save}
            footer={
                <>
                    <Button type="submit" isLoading={saving} disabled={!providers}>Guardar</Button>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                </>
            }
        >
            {!providers ? (
                <LoadingBlock label="Cargando proveedores…" />
            ) : (
                <div className="flex flex-col gap-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{organization?.name}</p>
                    <Select label="Almacenamiento" value={storage} onChange={(e) => setStorage(e.target.value)}>
                        <option value="">Por defecto del hosting</option>
                        {withStored(providers.storageProfiles, providers.storageProfile).map((p) => <option key={p} value={p}>{p}</option>)}
                    </Select>
                    <Select label="Correo" value={email} onChange={(e) => setEmail(e.target.value)}>
                        <option value="">Por defecto del hosting</option>
                        {withStored(providers.emailProfiles, providers.emailProfile).map((p) => <option key={p} value={p}>{p}</option>)}
                    </Select>
                </div>
            )}
        </Modal>
    );
};
