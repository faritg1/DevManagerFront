import React, { useId, useState } from 'react';
import { Card, CardHeader, CardTitle, Badge, LoadingBlock } from '../../../shared/ui';
import { ChevronDown, Key } from 'lucide-react';
import { labelForPermission } from '../../../widgets/Sidebar/navConfig';
import type { EffectivePermissionsResponse } from '../../../shared/api/types';

interface Props {
    effectivePerms: EffectivePermissionsResponse | null;
    permsLoading: boolean;
}

interface PermissionGroup {
    code: string;
    items: Map<string, string[]>;
}

/** Groups `menu.<section>.<item>.<action>` codes as section → item → actions. */
const groupPermissions = (codes: string[]): PermissionGroup[] => {
    const groups = new Map<string, PermissionGroup>();
    for (const code of codes) {
        const parts = code.split('.');
        const sectionCode = parts.slice(0, 2).join('.');
        const group = groups.get(sectionCode) ?? { code: sectionCode, items: new Map() };
        groups.set(sectionCode, group);
        if (parts.length < 3) continue;
        const itemCode = parts.slice(0, 3).join('.');
        const actions = group.items.get(itemCode) ?? [];
        if (parts.length > 3) actions.push(parts.slice(3).join('.'));
        group.items.set(itemCode, actions);
    }
    return [...groups.values()];
};

export const RolesPermissionsCard: React.FC<Props> = ({ effectivePerms, permsLoading }) => {
    const [open, setOpen] = useState(false);
    const detailId = useId();
    const count = effectivePerms?.effectivePermissions.length ?? 0;

    return (
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                {effectivePerms.roles.map((r) => <Badge key={r.name} variant="purple">{r.name}</Badge>)}
                                {effectivePerms.roles.length === 0 && <span className="text-sm text-slate-500 dark:text-slate-400">Sin roles asignados</span>}
                            </div>
                            <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={detailId}
                                disabled={count === 0}
                                onClick={() => setOpen((v) => !v)}
                                className="flex shrink-0 items-center gap-1.5 self-start rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-default disabled:text-slate-500 disabled:hover:bg-transparent sm:self-auto"
                            >
                                {count} {count === 1 ? 'permiso' : 'permisos'}
                                {count > 0 && <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />}
                            </button>
                        </div>

                        <div id={detailId} role="region" aria-label="Permisos efectivos" hidden={!open} className="mt-4 space-y-3">
                            {open && groupPermissions(effectivePerms.effectivePermissions.map((p) => p.code)).map((group) => (
                                <section key={group.code} className="rounded-xl border border-slate-200 dark:border-border-dark">
                                    <h3 className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 dark:border-border-dark dark:bg-background-dark dark:text-white">
                                        {labelForPermission(group.code) ?? group.code}
                                    </h3>
                                    {group.items.size > 0 && (
                                        <ul className="divide-y divide-slate-100 dark:divide-border-dark">
                                            {[...group.items].map(([itemCode, actions]) => (
                                                <li key={itemCode} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-sm">
                                                    <span className="text-slate-700 dark:text-slate-200">{labelForPermission(itemCode) ?? itemCode.split('.').pop()}</span>
                                                    {actions.map((action) => (
                                                        <code key={action} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:border-border-dark dark:text-slate-300">{action}</code>
                                                    ))}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No hay información de roles</p>
                )}
            </div>
        </Card>
    );
};
