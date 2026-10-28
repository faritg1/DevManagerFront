import React from 'react';
import { Modal, Button, SELECT_CLASS } from '../../../shared/ui';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
        title="Solicitar cambio de rol"
        icon={<ShieldCheck className="text-primary" size={20} />}
        size="sm"
        footer={
            <>
                <Button
                    onClick={onRequest}
                    disabled={!selectedRoleId}
                >
                    Solicitar
                </Button>
                <Button variant="outline" onClick={() => { onClose(); setSelectedRoleId(null); }}>Cancelar</Button>
            </>
        }
    >
        <div className="space-y-4">
            {loading ? (
                <div className="text-center py-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
                <select className={`${SELECT_CLASS} w-full`} value={selectedRoleId ?? ''} onChange={(e) => setSelectedRoleId(e.target.value || null)}>
                    <option value="">Selecciona un rol...</option>
                    {availableRoles.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.permissionCount} permisos)</option>
                    ))}
                </select>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">Nota: El cambio de rol puede requerir aprobación por un administrador.</p>
        </div>
    </Modal>
);
