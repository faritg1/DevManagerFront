import React from 'react';
import { Card, CardHeader, CardTitle, Button, Badge } from '../../../shared/ui';
import { Key, Loader2, ShieldCheck } from 'lucide-react';
import type { EffectivePermissionsResponse, RoleDto } from '../../../shared/api/types';

interface Props {
    effectivePerms: EffectivePermissionsResponse | null;
    permsLoading: boolean;
    onRequestRoleOpen: () => void;
}

export const RolesPermissionsCard: React.FC<Props> = ({ effectivePerms, permsLoading, onRequestRoleOpen }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <Key className="text-primary" size={20} />
                    Roles & Permisos
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onRequestRoleOpen}>
                        Solicitar cambio de rol
                    </Button>
                </div>
            </CardTitle>
        </CardHeader>

        <div className="p-4">
            {permsLoading ? (
                <div className="text-center py-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : effectivePerms ? (
                <>
                    <div className="mb-3">
                        <p className="text-sm text-slate-500 mb-2">Roles asignados</p>
                        <div className="flex gap-2 flex-wrap">
                            {effectivePerms.roles.map(r => <Badge key={r.name} variant="purple">{r.name}</Badge>)}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500 mb-2">Permisos efectivos</p>
                        <div className="grid grid-cols-2 gap-2">
                            {effectivePerms.effectivePermissions.map(p => (
                                <div key={p.code} className="p-2 bg-slate-50 dark:bg-[#111b22] rounded-md text-sm text-slate-600 dark:text-slate-300">{p.code}</div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-sm text-slate-500">No hay información de roles</p>
            )}
        </div>
    </Card>
);
