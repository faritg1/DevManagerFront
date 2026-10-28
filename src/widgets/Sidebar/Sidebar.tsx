import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Hexagon, X, ChevronDown, type LucideIcon } from 'lucide-react';
import { ROUTES, STORAGE_KEYS } from '../../shared/config/constants';
import { useAuth, useNotification } from '../../shared/context';
import { useConfirm, usePermission } from '../../shared/hooks';
import { Avatar } from '../../shared/ui';
import { NAV_CONFIG, visibleNav, type NavItemConfig } from './navConfig';

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

const readCollapsedSections = (): Set<string> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SIDEBAR_SECTIONS);
        return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set();
    }
};

const saveCollapsedSections = (keys: Set<string>) => {
    try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_SECTIONS, JSON.stringify([...keys]));
    } catch {
        // Sin almacenamiento (modo privado, bloqueado): la preferencia dura sólo esta sesión.
    }
};

interface NavSectionProps {
    title: string;
    /** id del contenedor de ítems (aria-controls). */
    id: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

/** Sección del menú con encabezado desplegable; en modo compacto muestra sólo un separador y nunca se colapsa. */
const NavSection: React.FC<NavSectionProps> = ({ title, id, open, onToggle, children }) => {
    const collapsed = useContext(CollapsedContext);
    if (collapsed) {
        return (
            <div className="space-y-1">
                <div className="mx-3 my-2 border-t border-slate-200 dark:border-border-dark" role="separator" aria-label={title} />
                {children}
            </div>
        );
    }
    return (
        <div>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={id}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-400 dark:hover:text-white"
            >
                {title}
                <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
            </button>
            {/* grid-rows 0fr↔1fr anima la altura sin medirla; inert saca del tabulado los ítems ocultos. */}
            <div
                id={id}
                inert={!open}
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="min-h-0 space-y-1 overflow-hidden">{children}</div>
            </div>
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

    const itemActive = (item: NavItemConfig): boolean =>
        item.children ? item.children.some(itemActive) : !!item.to && isActive(item.to);

    // Menú filtrado por permisos de menú (GET /permissions/me); mientras cargan se muestra un esqueleto.
    const access = usePermission();
    const sections = access.isLoading ? [] : visibleNav(access);

    // Secciones plegadas (persistidas). La que contiene la ruta activa se despliega al navegar.
    const [collapsedSections, setCollapsedSections] = useState(readCollapsedSections);
    const activeSectionKey = sections.find((section) => section.items.some(itemActive))?.key;
    useEffect(() => {
        if (!activeSectionKey) return;
        setCollapsedSections((prev) => {
            if (!prev.has(activeSectionKey)) return prev;
            const next = new Set(prev);
            next.delete(activeSectionKey);
            saveCollapsedSections(next);
            return next;
        });
    }, [activeSectionKey]);
    const toggleSection = (key: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            if (!next.delete(key)) next.add(key);
            saveCollapsedSections(next);
            return next;
        });
    };

    // Grupos anidados (p. ej. Seguridad): abiertos de inicio si contienen la ruta activa.
    const [openGroups, setOpenGroups] = useState<Set<string>>(
        () => new Set(NAV_CONFIG.flatMap((section) => section.items).filter((item) => item.children && itemActive(item)).map((item) => item.key)),
    );
    const toggleGroup = (key: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (!next.delete(key)) next.add(key);
            return next;
        });
    };

    const readCompact = () => {
        try {
            return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
        } catch {
            return false;
        }
    };
    const [collapsed, setCollapsed] = useState(readCompact);
    // Configuración emite un StorageEvent al cambiar la preferencia (también llega desde otras pestañas).
    useEffect(() => {
        const sync = () => setCollapsed(readCompact());
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // Sidebar content shared by desktop & mobile views
    // idPrefix evita ids duplicados: el menú se pinta dos veces (escritorio y cajón móvil).
    const renderContent = (compact: boolean, idPrefix: string) => (
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
                <div className={`flex items-center gap-3 ${compact ? 'p-1.5' : 'p-3'} bg-slate-50 dark:bg-card-dark rounded-xl border border-slate-100 dark:border-border-dark`}>
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

            <nav className="flex-1 px-4 flex flex-col gap-3 overflow-y-auto" aria-label="Menú principal" aria-busy={access.isLoading}>
                {access.isLoading && [0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" aria-hidden="true" />
                ))}
                {sections.map((section) => (
                    <NavSection
                        key={section.key}
                        id={`${idPrefix}-nav-${section.key}`}
                        title={section.title}
                        open={!collapsedSections.has(section.key)}
                        onToggle={() => toggleSection(section.key)}
                    >
                        {section.items.map((item) => item.children ? (
                            <div key={item.key}>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(item.key)}
                                    aria-expanded={openGroups.has(item.key)}
                                    aria-controls={`${idPrefix}-nav-group-${item.key}`}
                                    title={compact ? item.label : undefined}
                                    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? 'justify-center' : 'justify-between'} ${
                                        itemActive(item)
                                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <item.icon size={20} className="shrink-0" aria-hidden="true" />
                                        <span className={compact ? 'sr-only' : 'text-sm font-medium'}>{item.label}</span>
                                    </span>
                                    {!compact && <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${openGroups.has(item.key) ? 'rotate-180' : ''}`} />}
                                </button>
                                <div
                                    id={`${idPrefix}-nav-group-${item.key}`}
                                    className={`mt-1 space-y-1 ${compact ? '' : 'pl-6'} ${openGroups.has(item.key) ? 'block' : 'hidden'}`}
                                >
                                    {item.children.map((child) => (
                                        <NavItem key={child.key} to={child.to!} icon={child.icon} label={child.label} isActive={itemActive(child)} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <NavItem key={item.key} to={item.to!} icon={item.icon} label={item.label} isActive={itemActive(item)} />
                        ))}
                    </NavSection>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-border-dark mt-auto space-y-1">
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
            <aside className={`${collapsed ? 'w-20' : 'w-64'} transition-[width] duration-200 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-border-dark flex-col hidden md:flex shrink-0 h-screen sticky top-0`}>
                {renderContent(collapsed, 'sidebar')}
            </aside>

            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-border-dark flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {renderContent(false, 'drawer')}
            </aside>
        </>
    );
};

