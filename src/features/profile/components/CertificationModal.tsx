import React from 'react';
import { FormPanel, FormSection, Input } from '../../../shared/ui';
import { Award, ExternalLink } from 'lucide-react';
import type { CertificationResponse, CreateCertificationRequest } from '../../../shared/api/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editing?: CertificationResponse | null;
    /** Rejects when the API refuses: the panel shows the error and stays open. */
    onSave: (payload: CreateCertificationRequest, id?: string) => Promise<void>;
}

export const CertificationModal: React.FC<Props> = ({
    isOpen,
    onClose,
    editing,
    onSave,
}) => {
    const [formData, setFormData] = React.useState<CreateCertificationRequest>({
        name: '',
        issuer: '',
        issueDate: '',
        expirationDate: '',
        evidenceUrl: '',
    });

    React.useEffect(() => {
        if (isOpen) {
            if (editing) {
                setFormData({
                    name: editing.name,
                    issuer: editing.issuer,
                    issueDate: editing.issueDate ? editing.issueDate.split('T')[0] : '',
                    expirationDate: editing.expirationDate ? editing.expirationDate.split('T')[0] : '',
                    evidenceUrl: editing.evidenceUrl || '',
                });
            } else {
                setFormData({
                    name: '',
                    issuer: '',
                    issueDate: '',
                    expirationDate: '',
                    evidenceUrl: '',
                });
            }
        }
    }, [isOpen, editing]);

    const handleSave = async () => {
        if (!formData.name || !formData.issuer || !formData.issueDate) return;

        await onSave({
            name: formData.name,
            issuer: formData.issuer,
            issueDate: formData.issueDate,
            expirationDate: formData.expirationDate || null,
            evidenceUrl: formData.evidenceUrl || null,
        }, editing?.id);
        onClose();
    };

    return (
        <FormPanel
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSave}
            title={editing ? 'Editar Certificación' : 'Nueva Certificación'}
            icon={<Award className="text-primary" size={20} />}
            submitText={editing ? 'Guardar cambios' : 'Crear Certificación'}
        >
            <FormSection>
                <Input
                    label="Nombre de la certificación *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: AWS Certified Solutions Architect"
                />

                <Input
                    label="Emisor *"
                    required
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    placeholder="Ej: Amazon Web Services"
                />

                <Input
                    label="Fecha de emisión *"
                    required
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
                <Input
                    label="Fecha de expiración"
                    type="date"
                    value={formData.expirationDate ?? ''}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />

                <div className="sm:col-span-2">
                    <Input
                        label="URL de evidencia (opcional)"
                        value={formData.evidenceUrl ?? ''}
                        onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                        placeholder="https://..."
                        icon={ExternalLink}
                        hint="Agrega un link a tu certificación o credencial."
                    />
                </div>
            </FormSection>
        </FormPanel>
    );
};
