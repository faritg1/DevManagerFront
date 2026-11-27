import React, { useEffect, useState } from 'react';
import { rbacService } from '../../../shared/api';
import type { RoleDto, UserResponse } from '../../../shared/api/types';
import { useNotification } from '../../../shared/context';
import { Button, LoadingBlock, Modal } from '../../../shared/ui';

interface UserRolesDialogProps {
    /** The user whose roles are managed; null keeps the dialog closed. */
    user: UserResponse | null;
    onClose: () => void;
    /** A role was assigned or revoked: the list shows each user's main role. */
    onChanged: () => void;
}

/** Roles of one user: each checkbox assigns or revokes its role right away. */
export const UserRolesDialog: React.FC<UserRolesDialogProps> = ({ user, onClose, onChanged }) => {
    const { showNotification } = useNotification();
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [assigned, setAssigned] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;
        let alive = true;
        setRoles([]);
        setAssigned(new Set());
        setLoading(true);
        Promise.all([rbacService.getRoles(), rbacService.getUserEffectivePermissions(userId)])
            .then(([rolesRes, effectiveRes]) => {
                if (!alive) return;
                const all = rolesRes.data ?? [];
                // The effective permissions name the user's roles; the checkboxes work by id.
                const names = new Set((effectiveRes.data?.roles ?? []).map((r) => r.name));
                setRoles(all);
                setAssigned(new Set(all.filter((r) => names.has(r.name)).map((r) => r.id)));
            })
            .catch(() => { if (alive) showNotification({ type: 'error', message: 'No se pudieron cargar los roles del usuario' }); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [userId, showNotification]);

    const toggle = async (role: RoleDto, isAssigned: boolean) => {
        if (!userId) return;
        setSaving(true);
        try {
            const request = { userId, roleId: role.id };
            await (isAssigned ? rbacService.revokeRoleFromUser(request) : rbacService.assignRoleToUser(request));
            setAssigned((prev) => {
                const next = new Set(prev);
                if (isAssigned) next.delete(role.id); else next.add(role.id);
                return next;
            });
            showNotification({ type: 'success', message: isAssigned ? 'Rol revocado' : 'Rol asignado' });
            onChanged();
        } catch {
            showNotification({ type: 'error', message: 'No se pudo actualizar el rol' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={!!user}
            onClose={onClose}
            title={user ? `Roles — ${user.fullName}` : 'Roles'}
            size="md"
            footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
        >
            <div className="space-y-4">
                {loading ? (
                    <LoadingBlock className="py-8" />
                ) : (
                    roles.map((role) => {
                        const checked = assigned.has(role.id);
                        return (
                            <label key={role.id} className="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-background-dark">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{role.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{role.description || `${role.permissionCount} permisos`}</p>
                                </div>
                                <input type="checkbox" checked={checked} disabled={saving} onChange={() => toggle(role, checked)} className="size-4" />
                            </label>
                        );
                    })
                )}
            </div>
        </Modal>
    );
};
