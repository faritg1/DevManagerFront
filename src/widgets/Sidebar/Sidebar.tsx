import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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
    X,
    ChevronDown,
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
    LucideIcon
} from 'lucide-react';
import { ROUTES, NAV_SECTIONS, STORAGE_KEYS } from '../../shared/config/constants';
import { useAuth, useNotification } from '../../shared/context';
import { useConfirm, useIsAdmin } from '../../shared/hooks';
import { Avatar } from '../../shared/ui';

const CollapsedContext = createContext(false);

interface NavItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isActive }) => {
    const collapsed = useContext(CollapsedContext);
    return (
    <Link
        to={to}
        title={collapsed ? label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${collapsed ? 'justify-center' : ''} ${
            isActive 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
    >
        <Icon size={20} className={`shrink-0 ${isActive ? 'fill-current' : ''}`} />
        <span className={collapsed ? 'sr-only' : 'text-sm font-medium'}>{label}</span>
    </Link>
    );
};

interface NavSectionProps {
    title: string;
    children: React.ReactNode;
}

const NavSection: React.FC<NavSectionProps> = ({ title, children }) => {
    const collapsed = useContext(CollapsedContext);
    return (
    <div className="space-y-1">
        {collapsed ? (
            <div className="mx-3 my-2 border-t border-slate-200 dark:border-[#233948]" role="separator" aria-label={title} />
        ) : (
            <div className="px-3 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                {title}
            </div>
        )}
        {children}
    </div>
    );
};

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();

    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });
    useEffect(() => {
        onCloseRef.current?.();
    }, [location.pathname]);

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleLogout = async () => {
        const ok = await confirm({
            message: '¿Estás seguro de que deseas cerrar sesión?'
        });
        if (ok) {
            logout();
            showNotification({ type: 'success', message: 'Sesión cerrada' });
        }
    };

    // Función que verifica si una ruta está activa (incluyendo rutas hijas)
    const isActive = (path: string) => {
        if (path === ROUTES.DASHBOARD) {
            return location.pathname === path;
        }
        // Para otras rutas, verificar si la ruta actual comienza con el path
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const [securityOpen, setSecurityOpen] = useState<boolean>(
        () => isActive(ROUTES.ROLES) || isActive(ROUTES.PERMISSIONS),
    );

    // Sólo roles con acceso administrativo ven la sección de Seguridad
    const isAdmin = useIsAdmin();

    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true');
    // Configuración emite un StorageEvent al cambiar la preferencia (también llega desde otras pestañas).
    useEffect(() => {
        const sync = () => setCollapsed(localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true');
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // Sidebar content shared by desktop & mobile views
    const renderContent = (compact = false) => (
        <CollapsedContext.Provider value={compact}>
            <div className={`p-6 flex items-center ${compact ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className="size-8 text-primary shrink-0">
                        <Hexagon fill="currentColor" className="w-full h-full" />
                    </div>
                    <span className={compact ? 'sr-only' : 'text-xl font-bold tracking-tight text-slate-900 dark:text-white'}>DevManager</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className={compact ? 'px-3 pb-6 flex justify-center' : 'px-6 pb-6'} title={compact ? user?.name : undefined}>
                <div className={`flex items-center gap-3 ${compact ? 'p-1.5' : 'p-3'} bg-slate-50 dark:bg-[#16222b] rounded-xl border border-slate-100 dark:border-[#233948]`}>
                    <Avatar 
                        src={user?.avatar} 
                        name={user?.name || 'Usuario'} 
                        size="sm"
                    />
                    <div className={compact ? 'sr-only' : 'flex flex-col overflow-hidden'}>
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.name || 'Usuario'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.role || 'Sin rol'}
                        </span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto">
                <NavSection title={NAV_SECTIONS.PLATFORM}>
                    <NavItem to={ROUTES.DASHBOARD} icon={LayoutDashboard} label="Dashboard" isActive={isActive(ROUTES.DASHBOARD)} />
                    <NavItem to={ROUTES.PROJECTS} icon={Briefcase} label="Proyectos" isActive={isActive(ROUTES.PROJECTS)} />
                    <NavItem to={ROUTES.SKILLS_CATALOG} icon={Code2} label="Habilidades" isActive={isActive(ROUTES.SKILLS_CATALOG)} />
                    <NavItem to={ROUTES.REPORTS} icon={BarChart2} label="Reportes IA" isActive={isActive(ROUTES.REPORTS)} />
                </NavSection>

                <NavSection title={NAV_SECTIONS.AGENTS}>
                    <NavItem to={ROUTES.AGENTS} icon={Bot} label="Mis Agentes" isActive={isActive(ROUTES.AGENTS)} />
                </NavSection>

                <NavSection title={NAV_SECTIONS.SOLIDARIO}>
                    {isAdmin && (
                        <>
                            <NavItem to={ROUTES.ASSOCIATES} icon={HeartHandshake} label="Asociados" isActive={isActive(ROUTES.ASSOCIATES)} />
                            <NavItem to={ROUTES.DATA_POLICIES} icon={FileText} label="Políticas de datos" isActive={isActive(ROUTES.DATA_POLICIES)} />
                        </>
                    )}
                    <NavItem to={ROUTES.HABEAS_DATA} icon={Shield} label="Habeas Data (ARCO)" isActive={isActive(ROUTES.HABEAS_DATA)} />
                    {isAdmin && (
                        <NavItem to={ROUTES.EDUCATION} icon={GraduationCap} label="Educación" isActive={isActive(ROUTES.EDUCATION)} />
                    )}
                    <NavItem to={ROUTES.ORGANOS} icon={Landmark} label="Órganos" isActive={isActive(ROUTES.ORGANOS)} />
                    <NavItem to={ROUTES.COMPETENCIAS} icon={Award} label="Competencias" isActive={isActive(ROUTES.COMPETENCIAS)} />
                    <NavItem to={ROUTES.EXCEDENTES} icon={PiggyBank} label="Excedentes" isActive={isActive(ROUTES.EXCEDENTES)} />
                    <NavItem to={ROUTES.NOMINA} icon={Wallet} label="Nómina" isActive={isActive(ROUTES.NOMINA)} />
                    <NavItem to={ROUTES.BIENESTAR} icon={HeartHandshake} label="Bienestar" isActive={isActive(ROUTES.BIENESTAR)} />
                    <NavItem to={ROUTES.SST} icon={HardHat} label="SST" isActive={isActive(ROUTES.SST)} />
                    <NavItem to={ROUTES.BALANCE_SOCIAL} icon={Scale} label="Balance Social" isActive={isActive(ROUTES.BALANCE_SOCIAL)} />
                    <NavItem to={ROUTES.REPORTES_SUPERSOLIDARIA} icon={FileBarChart2} label="Reportes Supersolidaria" isActive={isActive(ROUTES.REPORTES_SUPERSOLIDARIA)} />
                    <NavItem to={ROUTES.ASISTENTE} icon={Sparkles} label="Asistente" isActive={isActive(ROUTES.ASISTENTE)} />
                </NavSection>

                <NavSection title={NAV_SECTIONS.ADMIN}>
                    {isAdmin && (
                        <>
                            <NavItem to={ROUTES.ORGANIZATIONS} icon={Building2} label="Organizaciones" isActive={isActive(ROUTES.ORGANIZATIONS)} />
                            <NavItem to={ROUTES.USERS} icon={Users} label="Usuarios" isActive={isActive(ROUTES.USERS)} />
                        </>
                    )}

                    {/* Seguridad (Roles & Permisos) - solo admins */}
                    {isAdmin && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setSecurityOpen((s) => !s)}
                            aria-expanded={securityOpen}
                            title={compact ? 'Seguridad' : undefined}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? 'justify-center' : 'justify-between'} ${
                                isActive(ROUTES.ROLES) || isActive(ROUTES.PERMISSIONS)
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="shrink-0" />
                                <span className={compact ? 'sr-only' : 'text-sm font-medium'}>Seguridad</span>
                            </div>
                            {!compact && <ChevronDown size={18} className={`transition-transform ${securityOpen ? 'rotate-180' : ''}`} />}
                        </button>

                        <div className={`mt-2 space-y-2 ${compact ? '' : 'pl-10'} ${securityOpen ? 'block' : 'hidden'}`}>
                            <NavItem to={ROUTES.ROLES} icon={ShieldCheck} label="Roles" isActive={isActive(ROUTES.ROLES)} />
                            <NavItem to={ROUTES.PERMISSIONS} icon={Key} label="Permisos" isActive={isActive(ROUTES.PERMISSIONS)} />
                        </div>
                    </div>
                    )}
                </NavSection>
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-[#233948] mt-auto space-y-1">
                <NavItem to={ROUTES.PROFILE} icon={User} label="Mi Perfil" isActive={isActive(ROUTES.PROFILE)} />
                <button
                    onClick={handleLogout}
                    title={compact ? 'Cerrar Sesión' : undefined}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} className="shrink-0" />
                    <span className={compact ? 'sr-only' : 'text-sm font-medium'}>Cerrar Sesión</span>
                </button>
            </div>
        </CollapsedContext.Provider>
    );

    return (
        <>
            {/* ── Desktop Sidebar ── visible md+ ── */}
            <aside className={`${collapsed ? 'w-20' : 'w-64'} transition-[width] duration-200 bg-white dark:bg-[#111b22] border-r border-slate-200 dark:border-[#233948] flex-col hidden md:flex shrink-0 h-screen sticky top-0`}>
                {renderContent(collapsed)}
            </aside>

            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#111b22] border-r border-slate-200 dark:border-[#233948] flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {renderContent()}
            </aside>
        </>
    );
};

