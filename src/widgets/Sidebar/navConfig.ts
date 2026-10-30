import {
    LayoutDashboard,
    Building2,
    Briefcase,
    Users,
    ShieldCheck,
    BarChart2,
    Bot,
    Key,
    Code2,
    HeartHandshake,
    FileText,
    Wallet,
    GraduationCap,
    Scale,
    HardHat,
    PiggyBank,
    Shield,
    Landmark,
    FileBarChart2,
    Sparkles,
    Award,
    Gauge,
    Crown,
    History,
    ListChecks,
    type LucideIcon,
} from 'lucide-react';
import { ROUTES, NAV_SECTIONS } from '../../shared/config/constants';

export interface NavItemConfig {
    /** Clave estable (para filtrar por permisos/opciones de menú y como id del DOM). */
    key: string;
    label: string;
    icon: LucideIcon;
    /** Ruta destino; los grupos con `children` no la necesitan. */
    to?: string;
    /** Código de permiso de menú (backend, Module="menu"); los grupos con `children` no lo llevan. */
    permission?: string;
    /** Sólo roles administrativos: el endpoint de la pantalla es admin-only en el backend. */
    adminOnly?: boolean;
    /** Sólo el superadministrador de la plataforma (GET /permissions/me → isSuperAdmin), no un permiso de menú. */
    superAdminOnly?: boolean;
    /** Además del permiso, visible para el superadministrador (backend RequirePermission allowSuperAdmin: true). */
    allowSuperAdmin?: boolean;
    /** Sub-elementos: el ítem se muestra como grupo desplegable. */
    children?: NavItemConfig[];
}

export interface NavSectionConfig {
    key: string;
    permission: string;
    title: string;
    /** Sección del superadministrador: se muestra por isSuperAdmin, no por `permission`. */
    superAdminOnly?: boolean;
    items: NavItemConfig[];
}

/** Menú lateral declarativo: secciones → ítems. El Sidebar sólo lo pinta. */
export const NAV_CONFIG: NavSectionConfig[] = [
    {
        key: 'platform', permission: 'menu.platform',
        title: NAV_SECTIONS.PLATFORM,
        items: [
            { key: 'dashboard', permission: 'menu.platform.dashboard', label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.DASHBOARD },
            { key: 'projects', permission: 'menu.platform.projects', label: 'Proyectos', icon: Briefcase, to: ROUTES.PROJECTS },
            { key: 'activities', permission: 'menu.platform.activities', label: 'Actividades', icon: ListChecks, to: ROUTES.ACTIVITIES },
            { key: 'skills', permission: 'menu.platform.skills', label: 'Habilidades', icon: Code2, to: ROUTES.SKILLS_CATALOG },
            { key: 'reports', permission: 'menu.platform.reports', label: 'Reportes IA', icon: BarChart2, to: ROUTES.REPORTS },
            { key: 'ai-usage', permission: 'menu.platform.ai_usage', label: 'Uso de IA', icon: Gauge, to: ROUTES.AI_USAGE },
        ],
    },
    {
        key: 'agents', permission: 'menu.agents',
        title: NAV_SECTIONS.AGENTS,
        items: [{ key: 'agents', permission: 'menu.agents.agents', label: 'Mis Agentes', icon: Bot, to: ROUTES.AGENTS }],
    },
    {
        key: 'solidario', permission: 'menu.solidarity',
        title: NAV_SECTIONS.SOLIDARIO,
        items: [
            { key: 'associates', permission: 'menu.solidarity.associates', label: 'Asociados', icon: HeartHandshake, to: ROUTES.ASSOCIATES },
            { key: 'data-policies', permission: 'menu.solidarity.data_policies', label: 'Políticas de datos', icon: FileText, to: ROUTES.DATA_POLICIES },
            { key: 'habeas-data', permission: 'menu.solidarity.habeas_data', label: 'Habeas Data (ARCO)', icon: Shield, to: ROUTES.HABEAS_DATA },
            { key: 'education', permission: 'menu.solidarity.education', label: 'Educación', icon: GraduationCap, to: ROUTES.EDUCATION },
            { key: 'organos', permission: 'menu.solidarity.governing_bodies', label: 'Órganos', icon: Landmark, to: ROUTES.ORGANOS },
            { key: 'competencias', permission: 'menu.solidarity.competencies', label: 'Competencias', icon: Award, to: ROUTES.COMPETENCIAS },
            { key: 'excedentes', permission: 'menu.solidarity.surplus', label: 'Excedentes', icon: PiggyBank, to: ROUTES.EXCEDENTES },
            { key: 'nomina', permission: 'menu.solidarity.payroll', label: 'Nómina', icon: Wallet, to: ROUTES.NOMINA },
            { key: 'bienestar', permission: 'menu.solidarity.welfare', label: 'Bienestar', icon: HeartHandshake, to: ROUTES.BIENESTAR },
            { key: 'sst', permission: 'menu.solidarity.sst', label: 'SST', icon: HardHat, to: ROUTES.SST },
            { key: 'balance-social', permission: 'menu.solidarity.social_balance', label: 'Balance Social', icon: Scale, to: ROUTES.BALANCE_SOCIAL },
            { key: 'reportes-supersolidaria', permission: 'menu.solidarity.supersolidaria_reports', label: 'Reportes Supersolidaria', icon: FileBarChart2, to: ROUTES.REPORTES_SUPERSOLIDARIA },
            { key: 'asistente', permission: 'menu.solidarity.assistant', label: 'Asistente', icon: Sparkles, to: ROUTES.ASISTENTE },
        ],
    },
    {
        key: 'admin', permission: 'menu.admin',
        title: NAV_SECTIONS.ADMIN,
        items: [
            { key: 'organizations', permission: 'menu.admin.organizations', label: 'Organizaciones', icon: Building2, to: ROUTES.ORGANIZATIONS, adminOnly: true },
            { key: 'users', permission: 'menu.admin.users', label: 'Usuarios', icon: Users, to: ROUTES.USERS, adminOnly: true },
            { key: 'audit', permission: 'menu.admin.audit', label: 'Auditoría', icon: History, to: ROUTES.AUDIT, allowSuperAdmin: true },
            {
                key: 'security',
                label: 'Seguridad',
                icon: ShieldCheck,
                adminOnly: true,
                children: [
                    { key: 'roles', permission: 'menu.admin.roles', label: 'Roles', icon: ShieldCheck, to: ROUTES.ROLES },
                    { key: 'permissions', permission: 'menu.admin.permissions', label: 'Permisos', icon: Key, to: ROUTES.PERMISSIONS },
                ],
            },
        ],
    },
    {
        key: 'super-admin', permission: '', superAdminOnly: true,
        title: NAV_SECTIONS.SUPER_ADMIN,
        items: [{ key: 'super-admin', label: 'Plataforma', icon: Crown, to: ROUTES.SUPER_ADMIN, superAdminOnly: true }],
    },
];

export interface NavAccess {
    has: (code: string) => boolean;
    isAdmin: boolean;
    /** Sin permisos cargados (error): se vuelve al filtro sólo por `adminOnly`. */
    failed: boolean;
    isSuperAdmin?: boolean;
}

/** visible = permiso concedido && (!adminOnly || admin); un grupo es visible si lo es algún hijo. */
export const isItemVisible = (item: NavItemConfig, access: NavAccess): boolean => {
    if (item.superAdminOnly || (item.allowSuperAdmin && access.isSuperAdmin)) return !!access.isSuperAdmin;
    if (item.adminOnly && !access.isAdmin) return false;
    if (item.children) return item.children.some((child) => isItemVisible(child, access));
    return access.failed || (!!item.permission && access.has(item.permission));
};

/** Secciones con sus ítems visibles; una sección sin permiso o sin ítems visibles desaparece. */
export const visibleNav = (access: NavAccess): NavSectionConfig[] =>
    NAV_CONFIG
        .filter((section) => (section.superAdminOnly
            ? !!access.isSuperAdmin
            : access.failed || access.has(section.permission) || (!!access.isSuperAdmin && section.items.some((item) => item.allowSuperAdmin))))
        .map((section) => ({
            ...section,
            items: section.items
                .filter((item) => isItemVisible(item, access))
                .map((item) => item.children ? { ...item, children: item.children.filter((child) => isItemVisible(child, access)) } : item),
        }))
        .filter((section) => section.items.length > 0);

/** Primera ruta navegable del menú visible (destino tras denegar una URL). */
export const firstVisibleRoute = (access: NavAccess): string | undefined => {
    const first = visibleNav(access)[0]?.items[0];
    return first?.to ?? first?.children?.[0]?.to;
};

/** Ítem del menú cuya ruta contiene `pathname` (incluye rutas hijas como /projects/:id). */
export const findNavItem = (pathname: string): NavItemConfig | undefined =>
    NAV_CONFIG.flatMap((section) => section.items.flatMap((item) => item.children ?? [item]))
        .find((item) => item.to && (pathname === item.to || pathname.startsWith(item.to + '/')));

/** Ruta de la pantalla que abre un código de permiso de menú (catálogo de permisos). */
export const routeForPermission = (code: string): string | undefined =>
    NAV_CONFIG.flatMap((section) => section.items.flatMap((item) => item.children ?? [item]))
        .find((item) => item.permission === code)?.to;

/** Menu label (section title or item label) for a permission code, e.g. `menu.solidarity` → "Gestión Solidaria". */
export const labelForPermission = (code: string): string | undefined => {
    const section = NAV_CONFIG.find((s) => s.permission === code);
    return section?.title ?? NAV_CONFIG.flatMap((s) => s.items.flatMap((item) => [item, ...(item.children ?? [])]))
        .find((item) => item.permission === code)?.label;
};
