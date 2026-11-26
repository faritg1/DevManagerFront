import React, { useEffect, useState } from 'react';
import { Building2, Crown, History, LogIn, Plus, Search, Users } from 'lucide-react';
import { platformService, type ImpersonationLogEntry, type PlatformOrganization, type PlatformUser } from '../../shared/api';
import { useAuth, useNotification } from '../../shared/context';
import { asUtc, formatDateTime } from '../../shared/format';
import { useConfirm, usePermission } from '../../shared/hooks';
import { Badge, Button, Card, EmptyState, Input, LoadingBlock, PageContainer, PageHeader, TABLE_CLASS, TBODY_CLASS, TD_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS } from '../../shared/ui';
import { AiQuotasCard } from './components/AiQuotasCard';
import { CreateOrganizationDialog } from './components/CreateOrganizationDialog';
import { DemoAccessCard } from './components/DemoAccessCard';
import { OrganizationPlanDialog } from './components/OrganizationPlanDialog';
import { OrganizationProvidersDialog } from './components/OrganizationProvidersDialog';

/** Platform super administration: every organization, its users and the AI quotas (the API answers 403 to anyone else). */
export const SuperAdminPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [organizations, setOrganizations] = useState<PlatformOrganization[] | null>(null);
    const [selected, setSelected] = useState<PlatformOrganization | null>(null);
    const [users, setUsers] = useState<PlatformUser[] | null>(null);
    const [history, setHistory] = useState<ImpersonationLogEntry[] | null>(null);
    const [entering, setEntering] = useState<string | null>(null);
    const [planOf, setPlanOf] = useState<PlatformOrganization | null>(null);
    const [providersOf, setProvidersOf] = useState<PlatformOrganization | null>(null);
    const [creating, setCreating] = useState(false);
    const [deciding, setDeciding] = useState<string | null>(null);
    const { startImpersonation, impersonation } = useAuth();
    const { isSuperAdmin } = usePermission();
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    // The API refuses the plan, the providers, a new organization, approving and rejecting to anyone else and during an impersonation.
    const canManage = isSuperAdmin && !impersonation;

    const loadOrganizations = () =>
        platformService.listOrganizations(search).then(r => setOrganizations(r.data ?? []), () => setOrganizations([]));

    /** Approves or rejects a pending organization, then reloads the list (also after a refusal: it was out of date). */
    const decide = async (o: PlatformOrganization, reject: boolean) => {
        if (reject) {
            const ok = await confirm({
                title: 'Rechazar solicitud',
                message: `Vas a rechazar la solicitud de ${o.name}. Se eliminan la entidad y sus usuarios.`,
                confirmText: 'Rechazar',
                type: 'warning',
            });
            if (!ok) return;
        }
        setDeciding(o.id);
        try {
            const response = reject ? await platformService.rejectOrganization(o.id) : await platformService.approveOrganization(o.id);
            showNotification({ type: 'success', message: response.message || (reject ? 'Solicitud rechazada' : 'Entidad aprobada') });
            if (reject && selected?.id === o.id) setSelected(null);
        } catch {
            // el listener global muestra el error
        } finally {
            setDeciding(null);
            loadOrganizations();
        }
    };

    useEffect(() => {
        platformService.listImpersonations().then(r => setHistory(r.data ?? []), () => setHistory([]));
    }, []);

    const enterAs = async (u: PlatformUser) => {
        const ok = await confirm({
            title: 'Ingresar como otro usuario',
            message: `Vas a actuar como ${u.fullName} en ${selected?.name}. La sesión dura una hora, no se renueva y queda registrada; los cambios de permisos se atribuyen a ti.`,
            confirmText: 'Ingresar',
            type: 'warning',
        });
        if (!ok) return;
        setEntering(u.id);
        try {
            await startImpersonation(u.id); // reloads the app as that user
        } catch {
            // el listener global muestra el error
            setEntering(null);
        }
    };

    useEffect(() => {
        // Debounced search by name or NIT
        const id = setTimeout(loadOrganizations, 300);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the search changes
    }, [search]);

    useEffect(() => {
        if (!selected) return;
        setUsers(null);
        platformService.listUsers(selected.id).then(r => setUsers(r.data ?? []), () => setUsers([]));
    }, [selected]);

    return (
        <PageContainer>
            <PageHeader
                icon={<Crown className="text-primary" size={26} aria-hidden="true" />}
                title="Superadministración de la plataforma"
                description="Todas las organizaciones, sus usuarios y las cuotas de IA. Solo visible para el superadministrador."
            />

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Card padding="none" className="lg:col-span-2">
                    <div className="flex items-center gap-2 p-6 pb-3">
                        <Building2 className="text-primary-600 dark:text-primary" size={20} aria-hidden="true" />
                        <h2 className="flex-1 text-lg font-bold text-slate-900 dark:text-white">Organizaciones</h2>
                        {canManage && <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>Crear entidad</Button>}
                    </div>
                    <div className="px-6 pb-4">
                        <Input
                            icon={Search}
                            inputSize="sm"
                            placeholder="Buscar por nombre o NIT…"
                            aria-label="Buscar organizaciones"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {organizations === null ? (
                        <LoadingBlock label="Cargando organizaciones…" />
                    ) : organizations.length === 0 ? (
                        <EmptyState title="Sin organizaciones" description="Ninguna organización coincide con la búsqueda." icon={Building2} />
                    ) : (
                        <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto dark:divide-border-dark">
                            {organizations.map((o) => (
                                <li key={o.id} className="flex flex-wrap items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelected(o)}
                                        aria-pressed={selected?.id === o.id}
                                        className={`flex min-w-40 flex-1 items-center justify-between gap-3 px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 ${selected?.id === o.id ? 'bg-primary/5' : ''}`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{o.name}</span>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">
                                                {o.nit ? `NIT ${o.nit} · ` : ''}{o.userCount} usuarios
                                            </span>
                                        </span>
                                        {!o.isActive && <Badge variant="warning">Pendiente</Badge>}
                                    </button>
                                    {canManage && (
                                        <div className="flex flex-wrap justify-end gap-2 px-3 py-1">
                                            {!o.isActive && (
                                                <>
                                                    <Button size="sm" aria-label={`Aprobar ${o.name}`} isLoading={deciding === o.id}
                                                        disabled={deciding !== null} onClick={() => decide(o, false)}>
                                                        Aprobar
                                                    </Button>
                                                    <Button size="sm" variant="outline" aria-label={`Rechazar ${o.name}`}
                                                        disabled={deciding !== null} onClick={() => decide(o, true)}>
                                                        Rechazar
                                                    </Button>
                                                </>
                                            )}
                                            <Button size="sm" variant="outline" aria-label={`Plan y módulos de ${o.name}`} onClick={() => setPlanOf(o)}>
                                                Plan y módulos
                                            </Button>
                                            <Button size="sm" variant="outline" aria-label={`Proveedores de ${o.name}`} onClick={() => setProvidersOf(o)}>
                                                Proveedores
                                            </Button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card padding="none" className="lg:col-span-3">
                    <div className="flex items-center gap-2 p-6 pb-3">
                        <Users className="text-primary" size={20} aria-hidden="true" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {selected ? `Usuarios de ${selected.name}` : 'Usuarios'}
                        </h2>
                    </div>
                    {!selected ? (
                        <EmptyState title="Elige una organización" description="Sus usuarios aparecerán aquí." icon={Users} />
                    ) : users === null ? (
                        <LoadingBlock label="Cargando usuarios…" />
                    ) : users.length === 0 ? (
                        <EmptyState title="Sin usuarios" icon={Users} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={TABLE_CLASS}>
                                <thead className={THEAD_CLASS}>
                                    <tr>
                                        <th className={TH_CLASS}>Usuario</th>
                                        <th className={TH_CLASS}>Roles</th>
                                        <th className={TH_CLASS}>Estado</th>
                                        <th className={TH_CLASS}><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className={TBODY_CLASS}>
                                    {users.map((u) => (
                                        <tr key={u.id} className={TR_CLASS}>
                                            <td className={TD_CLASS}>
                                                <span className="block font-semibold text-slate-900 dark:text-white">{u.fullName}</span>
                                                <span className="block text-xs text-slate-500 dark:text-slate-400">{u.email}</span>
                                            </td>
                                            <td className={`${TD_CLASS} text-xs`}>{u.roles.join(', ') || '—'}</td>
                                            <td className={TD_CLASS}>
                                                {u.isSuperAdmin
                                                    ? <Badge variant="purple">Superadmin</Badge>
                                                    : <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge>}
                                            </td>
                                            <td className={`${TD_CLASS} text-right`}>
                                                {/* The API refuses super admins and inactive users anyway */}
                                                {!u.isSuperAdmin && u.isActive && (
                                                    <Button size="sm" variant="outline" icon={LogIn} isLoading={entering === u.id}
                                                        disabled={entering !== null} onClick={() => enterAs(u)}>
                                                        Ingresar como
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            <OrganizationPlanDialog organization={planOf} onClose={() => setPlanOf(null)} />
            <OrganizationProvidersDialog organization={providersOf} onClose={() => setProvidersOf(null)} />
            {creating && <CreateOrganizationDialog onClose={() => setCreating(false)} onCreated={loadOrganizations} />}

            <DemoAccessCard />

            <AiQuotasCard />

            <Card padding="none" className="mt-6">
                <div className="flex items-center gap-2 p-6 pb-2">
                    <History className="text-primary" size={20} aria-hidden="true" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial de suplantaciones</h2>
                </div>
                <p className="px-6 pb-4 text-sm text-slate-500 dark:text-slate-400">
                    Cada ingreso como otro usuario, más reciente primero (últimos 200). Sin fin registrado: la sesión venció sola.
                </p>
                {history === null ? (
                    <LoadingBlock label="Cargando historial…" />
                ) : history.length === 0 ? (
                    <EmptyState title="Sin suplantaciones" icon={History} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH_CLASS}>Inicio</th>
                                    <th className={TH_CLASS}>Superadmin</th>
                                    <th className={TH_CLASS}>Actuó como</th>
                                    <th className={TH_CLASS}>Fin</th>
                                    <th className={TH_CLASS}>IP</th>
                                </tr>
                            </thead>
                            <tbody className={TBODY_CLASS}>
                                {history.map((h) => (
                                    <tr key={h.id} className={TR_CLASS}>
                                        <td className={TD_CLASS}>{formatDateTime(asUtc(h.startedAt))}</td>
                                        <td className={TD_CLASS}>{h.actorName}</td>
                                        <td className={TD_CLASS}>
                                            <span className="block font-medium text-slate-800 dark:text-slate-100">{h.targetName}</span>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">{h.organizationName}</span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            {h.endedAt ? formatDateTime(asUtc(h.endedAt)) : `Vence ${formatDateTime(asUtc(h.expiresAt))}`}
                                        </td>
                                        <td className={`${TD_CLASS} text-xs`} title={h.userAgent ?? undefined}>{h.ipAddress ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </PageContainer>
    );
};
