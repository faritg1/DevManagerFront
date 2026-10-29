import React from 'react';
import { Modal, Button, Input } from '../../../shared/ui';
import { Award, ExternalLink, Save, Plus } from 'lucide-react';
import type { CertificationResponse, CreateCertificationRequest } from '../../../shared/api/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    saving: boolean;
    editing?: CertificationResponse | null;
    onSave: (payload: CreateCertificationRequest, id?: string) => Promise<boolean>;
}

export const CertificationModal: React.FC<Props> = ({
    isOpen,
    onClose,
    saving,
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
    const [savingLocal, setSavingLocal] = React.useState(false);

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
        if (savingLocal || saving || !formData.name || !formData.issuer || !formData.issueDate) return;
        
        setSavingLocal(true);
        const payload: CreateCertificationRequest = {
            name: formData.name,
            issuer: formData.issuer,
            issueDate: formData.issueDate,
            expirationDate: formData.expirationDate || null,
            evidenceUrl: formData.evidenceUrl || null,
        };

        await onSave(payload, editing?.id);
        setSavingLocal(false);
    };

    const handleClose = () => {
        setFormData({
            name: '',
            issuer: '',
            issueDate: '',
            expirationDate: '',
            evidenceUrl: '',
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSave}
            title={editing ? 'Editar Certificación' : 'Nueva Certificación'}
            icon={<Award className="text-primary" size={20} />}
            size="md"
            footer={
                <>
                    <Button type="submit" isLoading={savingLocal || saving} icon={editing ? Save : Plus}>
                        {editing ? 'Guardar cambios' : 'Crear Certificación'}
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <Input
                    label="URL de evidencia (opcional)"
                    value={formData.evidenceUrl ?? ''}
                    onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                    placeholder="https://..."
                    icon={ExternalLink}
                    hint="Agrega un link a tu certificación o credencial."
                />
            </div>
        </Modal>
    );
};
