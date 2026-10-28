import React from 'react';
import { Modal, Button, Select, LoadingBlock } from '../../../shared/ui';
import { ShieldCheck } from 'lucide-react';
import type { RoleDto } from '../../../shared/api/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    availableRoles: RoleDto[];
    loading: boolean;
    selectedRoleId: string | null;
    setSelectedRoleId: (id: string | null) => void;
    onRequest: () => Promise<boolean>;
}

export const RequestRoleModal: React.FC<Props> = ({
    isOpen,
    onClose,
    availableRoles,
    loading,
    selectedRoleId,
    setSelectedRoleId,
    onRequest,
}) => (
    <Modal
        isOpen={isOpen}
        onClose={() => { onClose(); setSelectedRoleId(null); }}
        onSubmit={onRequest}
        title="Solicitar cambio de rol"
        icon={<ShieldCheck className="text-primary" size={20} />}
        size="sm"
        footer={
            <>
                <Button type="submit" disabled={loading}>
                    Solicitar
                </Button>
                <Button variant="outline" onClick={() => { onClose(); setSelectedRoleId(null); }}>Cancelar</Button>
            </>
        }
    >
        <div className="space-y-4">
            {loading ? (
                <LoadingBlock className="py-4" />
            ) : (
                <Select label="Rol *" required value={selectedRoleId ?? ''} onChange={(e) => setSelectedRoleId(e.target.value || null)}>
                    <option value="">Selecciona un rol...</option>
                    {availableRoles.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.permissionCount} permisos)</option>
                    ))}
                </Select>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">Nota: El cambio de rol puede requerir aprobación por un administrador.</p>
        </div>
    </Modal>
);
