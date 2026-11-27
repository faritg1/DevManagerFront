import React, { useEffect, useState } from 'react';
import { CheckCircle2, Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import { rbacService } from '../../../shared/api';
import type { EffectivePermissionsResponse, PermissionGroupDto, UserResponse } from '../../../shared/api/types';
import { useNotification } from '../../../shared/context';
import { Badge, Button, LoadingBlock, Modal, Select } from '../../../shared/ui';

interface UserPermissionsDialogProps {
    /** The user whose permissions are shown; null keeps the dialog closed. */
    user: UserResponse | null;
    onClose: () => void;
}

const SECTION_TITLE_CLASS = 'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const EMPTY_TEXT_CLASS = 'text-sm text-slate-500 dark:text-slate-400';

const choiceClass = (active: boolean, tone: 'emerald' | 'rose') =>
    `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
        active
            ? tone === 'emerald'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
            : `border-slate-200 dark:border-slate-600 text-slate-500 ${tone === 'emerald' ? 'hover:border-emerald-300' : 'hover:border-rose-300'}`
    }`;

/** Effective permissions of one user (roles, permissions, direct overrides) and a form to grant or deny one directly. */
export const UserPermissionsDialog: React.FC<UserPermissionsDialogProps> = ({ user, onClose }) => {
    const { showNotification } = useNotification();
    const [effective, setEffective] = useState<EffectivePermissionsResponse | null>(null);
    const [groups, setGroups] = useState<PermissionGroupDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [permissionId, setPermissionId] = useState('');
    const [isGrant, setIsGrant] = useState(true);
    const [saving, setSaving] = useState(false);
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;
        let alive = true;
        setEffective(null);
        setPermissionId('');
        setIsGrant(true);
        setLoading(true);
        Promise.all([rbacService.getUserEffectivePermissions(userId), rbacService.getGroupedPermissions()])
            .then(([effectiveRes, groupsRes]) => {
                if (!alive) return;
                setEffective(effectiveRes.data ?? null);
                setGroups(groupsRes.data ?? []);
            })
            .catch(() => { if (alive) showNotification({ type: 'error', message: 'No se pudieron cargar los permisos del usuario' }); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [userId, showNotification]);

    const addOverride = async () => {
        if (!userId || !permissionId || saving) return;
        setSaving(true);
        try {
            const res = await rbacService.assignPermissionToUser({ userId, permissionId, isGranted: isGrant });
            if (!res.success) {
                showNotification({ type: 'error', message: 'No se pudo guardar el override' });
                return;
            }
            showNotification({ type: 'success', message: `Override ${isGrant ? 'concedido' : 'denegado'} correctamente` });
            setPermissionId('');
            // The override changes what the user can do: show the new effective set.
            const updated = await rbacService.getUserEffectivePermissions(userId);
            if (updated.data) setEffective(updated.data);
        } catch {
            showNotification({ type: 'error', message: 'Error al guardar el override' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={!!user}
            onClose={onClose}
            onSubmit={addOverride}
            title={user ? `Permisos — ${user.fullName}` : 'Permisos'}
            size="lg"
            icon={<ShieldCheck size={20} className="text-primary" />}
            footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
        >
            {loading ? (
                <LoadingBlock className="py-8" />
            ) : effective ? (
                <div className="space-y-5">
                    <div>
                        <p className={`${SECTION_TITLE_CLASS} mb-2`}>Roles asignados</p>
                        <div className="flex flex-wrap gap-2">
                            {effective.roles.length > 0
                                ? effective.roles.map((r) => <Badge key={r.name} variant="purple">{r.name}</Badge>)
                                : <span className={EMPTY_TEXT_CLASS}>Sin roles asignados</span>}
                        </div>
                    </div>

                    <div>
                        <p className={`${SECTION_TITLE_CLASS} mb-2`}>Permisos efectivos</p>
                        {effective.effectivePermissions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                                {effective.effectivePermissions.map((p) => (
                                    <div key={p.code} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                                        <CheckCircle2 size={12} className="shrink-0" />
                                        {p.code}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className={EMPTY_TEXT_CLASS}>Sin permisos efectivos</span>
                        )}
                    </div>

                    <div>
                        <p className={`${SECTION_TITLE_CLASS} mb-2`}>Overrides directos</p>
                        {effective.directOverrides?.length > 0 ? (
                            <div className="space-y-1.5">
                                {effective.directOverrides.map((o) => (
                                    <div key={o.permissionCode} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border ${
                                        o.isGranted
                                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
                                            : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700'
                                    }`}>
                                        {o.isGranted
                                            ? <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                                            : <ShieldOff size={14} className="text-rose-600 shrink-0" />}
                                        <span className={`font-semibold text-xs ${o.isGranted ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                            {o.isGranted ? 'GRANT' : 'DENY'}
                                        </span>
                                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{o.permissionCode}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className={EMPTY_TEXT_CLASS}>Sin overrides configurados</span>
                        )}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <p className={`${SECTION_TITLE_CLASS} mb-3`}>Agregar / modificar override</p>
                        <div className="flex flex-col gap-3">
                            <Select label="Permiso *" required value={permissionId} onChange={(e) => setPermissionId(e.target.value)}>
                                <option value="">— Selecciona un permiso —</option>
                                {groups.map((group) => (
                                    <optgroup key={group.module} label={group.module}>
                                        {group.permissions.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                    </optgroup>
                                ))}
                            </Select>

                            <div className="flex gap-2">
                                <button type="button" aria-pressed={isGrant} onClick={() => setIsGrant(true)} className={choiceClass(isGrant, 'emerald')}>
                                    <CheckCircle2 size={16} />
                                    Conceder
                                </button>
                                <button type="button" aria-pressed={!isGrant} onClick={() => setIsGrant(false)} className={choiceClass(!isGrant, 'rose')}>
                                    <ShieldOff size={16} />
                                    Denegar
                                </button>
                            </div>

                            <Button type="submit" icon={Plus} isLoading={saving}>
                                Aplicar override
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={EMPTY_TEXT_CLASS}>No hay permisos disponibles</div>
            )}
        </Modal>
    );
};
