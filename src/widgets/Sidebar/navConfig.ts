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
    /** Visible sólo para roles administrativos (comportamiento actual, previo a los permisos por menú). */
    adminOnly?: boolean;
    /** Sub-elementos: el ítem se muestra como grupo desplegable. */
    children?: NavItemConfig[];
}

export interface NavSectionConfig {
    key: string;
    title: string;
    items: NavItemConfig[];
}

/** Menú lateral declarativo: secciones → ítems. El Sidebar sólo lo pinta. */
export const NAV_CONFIG: NavSectionConfig[] = [
    {
        key: 'platform',
        title: NAV_SECTIONS.PLATFORM,
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.DASHBOARD },
            { key: 'projects', label: 'Proyectos', icon: Briefcase, to: ROUTES.PROJECTS },
            { key: 'skills', label: 'Habilidades', icon: Code2, to: ROUTES.SKILLS_CATALOG },
            { key: 'reports', label: 'Reportes IA', icon: BarChart2, to: ROUTES.REPORTS },
        ],
    },
    {
        key: 'agents',
        title: NAV_SECTIONS.AGENTS,
        items: [{ key: 'agents', label: 'Mis Agentes', icon: Bot, to: ROUTES.AGENTS }],
    },
    {
        key: 'solidario',
        title: NAV_SECTIONS.SOLIDARIO,
        items: [
            { key: 'associates', label: 'Asociados', icon: HeartHandshake, to: ROUTES.ASSOCIATES, adminOnly: true },
            { key: 'data-policies', label: 'Políticas de datos', icon: FileText, to: ROUTES.DATA_POLICIES, adminOnly: true },
            { key: 'habeas-data', label: 'Habeas Data (ARCO)', icon: Shield, to: ROUTES.HABEAS_DATA },
            { key: 'education', label: 'Educación', icon: GraduationCap, to: ROUTES.EDUCATION, adminOnly: true },
            { key: 'organos', label: 'Órganos', icon: Landmark, to: ROUTES.ORGANOS },
            { key: 'competencias', label: 'Competencias', icon: Award, to: ROUTES.COMPETENCIAS },
            { key: 'excedentes', label: 'Excedentes', icon: PiggyBank, to: ROUTES.EXCEDENTES },
            { key: 'nomina', label: 'Nómina', icon: Wallet, to: ROUTES.NOMINA },
            { key: 'bienestar', label: 'Bienestar', icon: HeartHandshake, to: ROUTES.BIENESTAR },
            { key: 'sst', label: 'SST', icon: HardHat, to: ROUTES.SST },
            { key: 'balance-social', label: 'Balance Social', icon: Scale, to: ROUTES.BALANCE_SOCIAL },
            { key: 'reportes-supersolidaria', label: 'Reportes Supersolidaria', icon: FileBarChart2, to: ROUTES.REPORTES_SUPERSOLIDARIA },
            { key: 'asistente', label: 'Asistente', icon: Sparkles, to: ROUTES.ASISTENTE },
        ],
    },
    {
        key: 'admin',
        title: NAV_SECTIONS.ADMIN,
        items: [
            { key: 'organizations', label: 'Organizaciones', icon: Building2, to: ROUTES.ORGANIZATIONS, adminOnly: true },
            { key: 'users', label: 'Usuarios', icon: Users, to: ROUTES.USERS, adminOnly: true },
            {
                key: 'security',
                label: 'Seguridad',
                icon: ShieldCheck,
                adminOnly: true,
                children: [
                    { key: 'roles', label: 'Roles', icon: ShieldCheck, to: ROUTES.ROLES },
                    { key: 'permissions', label: 'Permisos', icon: Key, to: ROUTES.PERMISSIONS },
                ],
            },
        ],
    },
];
