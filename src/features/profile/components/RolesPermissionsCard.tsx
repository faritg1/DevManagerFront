import React from 'react';
import { Card, CardHeader, CardTitle, Badge, LoadingBlock } from '../../../shared/ui';
import { Key } from 'lucide-react';
import type { EffectivePermissionsResponse } from '../../../shared/api/types';

interface Props {
    effectivePerms: EffectivePermissionsResponse | null;
    permsLoading: boolean;
}

export const RolesPermissionsCard: React.FC<Props> = ({ effectivePerms, permsLoading }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Key className="text-primary" size={20} />
                Roles & Permisos
            </CardTitle>
        </CardHeader>

        <div className="p-4">
            {permsLoading ? (
                <LoadingBlock className="py-4" />
            ) : effectivePerms ? (
                <>
                    <div className="mb-3">
                        <p className="text-sm text-slate-500 mb-2 dark:text-slate-400">Roles asignados</p>
                        <div className="flex gap-2 flex-wrap">
                            {effectivePerms.roles.map(r => <Badge key={r.name} variant="purple">{r.name}</Badge>)}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500 mb-2 dark:text-slate-400">Permisos efectivos</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {effectivePerms.effectivePermissions.map(p => (
                                <div key={p.code} className="p-2 bg-slate-50 dark:bg-background-dark rounded-md text-sm text-slate-600 dark:text-slate-300 break-all">{p.code}</div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No hay información de roles</p>
            )}
        </div>
    </Card>
);
