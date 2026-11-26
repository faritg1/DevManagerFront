import React, { useEffect, useId, useState } from 'react';
import { platformService, rbacService, type OrganizationPlan, type PermissionTreeNode, type PlatformOrganization } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { formatNumber } from '../../../shared/format';
import { FormPanel, FormSection, Input, LoadingBlock } from '../../../shared/ui';

const GB = 1024 ** 3;
/** The API refuses to turn this section off: nobody could administer the organization. */
const LOCKED = 'menu.admin';

interface ModuleSwitchProps {
    node: PermissionTreeNode;
    on: boolean;
    disabled: boolean;
    child?: boolean;
    onToggle: () => void;
}

const ModuleSwitch: React.FC<ModuleSwitchProps> = ({ node, on, disabled, child, onToggle }) => {
    const labelId = useId();
    return (
        <div className={`flex items-center justify-between gap-3 py-1.5 ${child ? 'pl-5' : ''}`}>
            <span id={labelId} className={`min-w-0 text-sm ${child ? 'text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'}`}>
                {node.name}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-labelledby={labelId}
                disabled={disabled}
                onClick={onToggle}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-background-dark ${
                    on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
            >
                <span className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

interface OrganizationPlanDialogProps {
    /** The organization whose plan is edited; null keeps the dialog closed. */
    organization: PlatformOrganization | null;
    onClose: () => void;
}

/**
 * Modules and caps of one organization (super admin only; the API answers 403 to anyone else). A module is a
 * section or a screen of the permission tree: turning a section off also turns off everything under it.
 */
export const OrganizationPlanDialog: React.FC<OrganizationPlanDialogProps> = ({ organization, onClose }) => {
    const { showNotification } = useNotification();
    const [plan, setPlan] = useState<OrganizationPlan | null>(null);
    const [tree, setTree] = useState<PermissionTreeNode[]>([]);
    const [off, setOff] = useState<ReadonlySet<string>>(new Set());
    const [maxUsers, setMaxUsers] = useState('');
    const [maxGb, setMaxGb] = useState('');
    const organizationId = organization?.id;

    useEffect(() => {
        if (!organizationId) return;
        let alive = true;
        setPlan(null);
        Promise.all([platformService.getPlan(organizationId), rbacService.getPermissionTree()]).then(
            ([p, t]) => {
                if (!alive) return;
                setTree(t.data ?? []);
                setOff(new Set(p.data.disabledModules));
                setMaxUsers(p.data.maxUsers?.toString() ?? '');
                setMaxGb(p.data.maxStorageBytes == null ? '' : String(p.data.maxStorageBytes / GB));
                setPlan(p.data);
            },
            // el listener global muestra el error
            () => { if (alive) onClose(); },
        );
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another organization is opened
    }, [organizationId]);

    const toggle = (code: string) => setOff(prev => {
        const next = new Set(prev);
        if (!next.delete(code)) next.add(code);
        return next;
    });

    const save = async () => {
        if (!organizationId || !plan) return;
        await platformService.setPlan(organizationId, {
            disabledModules: [...off].sort(),
            maxUsers: maxUsers === '' ? null : Number(maxUsers),
            maxStorageBytes: maxGb === '' ? null : Math.round(Number(maxGb) * GB),
        });
        showNotification({ type: 'success', message: 'Plan actualizado' });
        onClose();
    };

    // The switches are buttons: they emit no input event, so the panel cannot see them change.
    const switchesChanged = !!plan && [...off].sort().join() !== [...plan.disabledModules].sort().join();

    return (
        <FormPanel isOpen={!!organization} onClose={onClose} onSubmit={save} title="Plan y módulos" submitDisabled={!plan} dirty={switchesChanged}>
            {!plan ? (
                <LoadingBlock label="Cargando plan…" />
            ) : (
                <>
                    <FormSection>
                        <div className="sm:col-span-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{organization?.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {plan.activeUsers} usuarios activos · {formatNumber(plan.usedStorageBytes / GB, 2)} GB usados
                            </p>
                        </div>
                        <Input label="Tope de usuarios" type="number" min={1} step={1} inputMode="numeric" hint="Vacío es sin tope"
                            name="maxUsers" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
                        <Input label="Tope de almacenamiento (GB)" type="number" min={0} step="any" inputMode="decimal" hint="Vacío es sin tope"
                            name="maxStorageBytes" value={maxGb} onChange={(e) => setMaxGb(e.target.value)} />
                    </FormSection>
                    <FormSection title="Secciones y pantallas">
                        <ul className="divide-y divide-slate-100 dark:divide-border-dark sm:col-span-2">
                            {tree.map((section) => {
                                const locked = section.code === LOCKED;
                                const sectionOn = locked || !off.has(section.code);
                                return (
                                    <li key={section.code} className="py-1">
                                        <ModuleSwitch node={section} on={sectionOn} disabled={locked} onToggle={() => toggle(section.code)} />
                                        {/* Two levels only: actions under a screen follow their screen. */}
                                        {section.children.map((screen) => (
                                            <ModuleSwitch key={screen.code} node={screen} child
                                                on={sectionOn && (locked || !off.has(screen.code))}
                                                disabled={locked || !sectionOn}
                                                onToggle={() => toggle(screen.code)} />
                                        ))}
                                    </li>
                                );
                            })}
                        </ul>
                    </FormSection>
                </>
            )}
        </FormPanel>
    );
};
