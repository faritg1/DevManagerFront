import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Building2, 
    Briefcase, 
    Users, 
    ShieldCheck, 
    BarChart2, 
    User, 
    LogOut,
    Hexagon,
    Bot,
    Cpu,
    Settings,
    LucideIcon
} from 'lucide-react';
import { ROUTES, NAV_SECTIONS } from '../../shared/config/constants';
import { useAuth } from '../../shared/context';
import { Avatar } from '../../shared/ui';

interface NavItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isActive }) => (
    <Link 
        to={to} 
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
            isActive 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
    >
        <Icon size={20} className={isActive ? 'fill-current' : ''} />
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

interface NavSectionProps {
    title: string;
    children: React.ReactNode;
}

const NavSection: React.FC<NavSectionProps> = ({ title, children }) => (
    <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            {title}
        </div>
        {children}
    </div>
);

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Función que verifica si una ruta está activa (incluyendo rutas hijas)
    const isActive = (path: string) => {
        // Caso especial: Dashboard solo match exacto
        if (path === ROUTES.DASHBOARD) {
            return location.pathname === path;
        }
        // Para otras rutas, verificar si la ruta actual comienza con el path
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <aside className="w-64 bg-white dark:bg-[#111b22] border-r border-slate-200 dark:border-[#233948] flex-col hidden md:flex shrink-0 h-screen sticky top-0">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3">
                <div className="size-8 text-primary">
                    <Hexagon fill="currentColor" className="w-full h-full" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">DevManager</span>
            </div>

            {/* User Mini Profile */}
            <div className="px-6 pb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#16222b] rounded-xl border border-slate-100 dark:border-[#233948]">
                    <Avatar 
                        src={user?.avatar} 
                        name={user?.name || 'Usuario'} 
                        size="sm"
                    />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.name || 'Usuario'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.role || 'Sin rol'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto">
                <NavSection title={NAV_SECTIONS.PLATFORM}>
                    <NavItem to={ROUTES.DASHBOARD} icon={LayoutDashboard} label="Dashboard" isActive={isActive(ROUTES.DASHBOARD)} />
                    <NavItem to={ROUTES.PROJECTS} icon={Briefcase} label="Proyectos" isActive={isActive(ROUTES.PROJECTS)} />
                    <NavItem to={ROUTES.REPORTS} icon={BarChart2} label="Reportes IA" isActive={isActive(ROUTES.REPORTS)} />
                </NavSection>

                <NavSection title={NAV_SECTIONS.AGENTS}>
                    <NavItem to={ROUTES.AGENTS} icon={Bot} label="Mis Agentes" isActive={isActive(ROUTES.AGENTS)} />
                    <NavItem to={ROUTES.MARKETPLACE} icon={Cpu} label="Marketplace" isActive={isActive(ROUTES.MARKETPLACE)} />
                </NavSection>

                <NavSection title={NAV_SECTIONS.ADMIN}>
                    <NavItem to={ROUTES.ORGANIZATIONS} icon={Building2} label="Organizaciones" isActive={isActive(ROUTES.ORGANIZATIONS)} />
                    <NavItem to={ROUTES.USERS} icon={Users} label="Usuarios" isActive={isActive(ROUTES.USERS)} />
                    <NavItem to={ROUTES.ROLES} icon={ShieldCheck} label="Roles y Permisos" isActive={isActive(ROUTES.ROLES)} />
                </NavSection>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#233948] mt-auto space-y-1">
                <NavItem to={ROUTES.PROFILE} icon={User} label="Mi Perfil" isActive={isActive(ROUTES.PROFILE)} />
                <button 
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
