import React from 'react';
import { Modal, Button, Input } from '../../../shared/ui';
import { Award, Loader2, Calendar, ExternalLink, Save, Plus } from 'lucide-react';
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
        if (!formData.name || !formData.issuer || !formData.issueDate) return;
        
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
            title={editing ? 'Editar Certificación' : 'Nueva Certificación'}
            icon={<Award className="text-primary" size={20} />}
            size="md"
            footer={
                <>
                    <Button 
                        onClick={handleSave}
                        disabled={savingLocal || saving || !formData.name || !formData.issuer || !formData.issueDate}
                        icon={savingLocal || saving ? Loader2 : (editing ? Save : Plus)}
                    >
                        {savingLocal || saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear Certificación')}
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                {/* Nombre de la certificación */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-white text-sm font-bold">
                        Nombre de la certificación *
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: AWS Certified Solutions Architect"
                    />
                </div>

                {/* Emisor */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-white text-sm font-bold">
                        Emisor *
                    </label>
                    <Input
                        value={formData.issuer}
                        onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                        placeholder="Ej: Amazon Web Services"
                    />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Fecha de emisión *
                        </label>
                        <Input
                            type="date"
                            value={formData.issueDate}
                            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Fecha de expiración
                        </label>
                        <Input
                            type="date"
                            value={formData.expirationDate}
                            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        />
                    </div>
                </div>

                {/* URL de evidencia */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-white text-sm font-bold">
                        URL de evidencia (opcional)
                    </label>
                    <Input
                        value={formData.evidenceUrl}
                        onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                        placeholder="https://..."
                        icon={ExternalLink}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Agrega un link a tu certificación o credencial.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
