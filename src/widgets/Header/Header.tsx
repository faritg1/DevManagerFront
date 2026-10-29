import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, Sun, Moon, ChevronRight } from 'lucide-react';
import { useTheme } from '../../shared/hooks';
import { ROUTES } from '../../shared/config/constants';
import { NotificationBell } from './NotificationBell';
import { CommandPalette } from './CommandPalette';

interface HeaderProps {
    onMenuClick?: () => void;
}

const ROUTE_NAMES: Record<string, string> = {
    [ROUTES.DASHBOARD]: 'Dashboard',
    [ROUTES.PROJECTS]: 'Proyectos',
    [ROUTES.CREATE_PROJECT]: 'Nuevo Proyecto',
    [ROUTES.REPORTS]: 'Reportes IA',
    [ROUTES.AGENTS]: 'Agentes IA',
    [ROUTES.ORGANIZATIONS]: 'Organizaciones',
    [ROUTES.USERS]: 'Usuarios',
    [ROUTES.ASSOCIATES]: 'Asociados',
    [ROUTES.DATA_POLICIES]: 'Políticas de datos',
    [ROUTES.ROLES]: 'Roles',
    [ROUTES.PERMISSIONS]: 'Permisos',
    [ROUTES.PROFILE]: 'Mi Perfil',
    [ROUTES.SETTINGS]: 'Configuración',
    [ROUTES.SKILLS_CATALOG]: 'Habilidades',
    [ROUTES.EDUCATION]: 'Educación',
    [ROUTES.NOMINA]: 'Nómina',
    [ROUTES.BIENESTAR]: 'Bienestar',
    [ROUTES.BALANCE_SOCIAL]: 'Balance Social',
    [ROUTES.SST]: 'SST',
    [ROUTES.EXCEDENTES]: 'Excedentes',
    [ROUTES.HABEAS_DATA]: 'Habeas Data',
    [ROUTES.ORGANOS]: 'Órganos',
    [ROUTES.COMPETENCIAS]: 'Competencias',
    [ROUTES.REPORTES_SUPERSOLIDARIA]: 'Reportes Supersolidaria',
    [ROUTES.ASISTENTE]: 'Asistente',
};

// Segmentos finales de rutas anidadas (p. ej. /projects/:id/edit, /roles/:id/permissions).
const SEGMENT_NAMES: Record<string, string> = {
    edit: 'Editar',
    permissions: 'Permisos',
};

// Obtener nombre de la ruta o generar uno a partir del path
const getRouteName = (path: string): string => {
    if (ROUTE_NAMES[path]) {
        return ROUTE_NAMES[path];
    }
    
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'Inicio';
    if (SEGMENT_NAMES[lastSegment]) return SEGMENT_NAMES[lastSegment];
    // Un segundo nivel que no es una ruta conocida es un identificador (/users/:id, /education/:programId…).
    if (segments.length >= 2) return 'Detalle';
    // Every top-level route is in ROUTE_NAMES, so anything else is the 404 page.
    return segments.length ? 'Página no encontrada' : 'Inicio';
};

const generateBreadcrumbs = (pathname: string): Array<{ path: string; name: string }> => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ path: string; name: string }> = [];
    
    let currentPath = '';
    for (const segment of segments) {
        currentPath += `/${segment}`;
        breadcrumbs.push({
            path: currentPath,
            name: getRouteName(currentPath),
        });
    }
    
    return breadcrumbs;
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { resolvedTheme, toggleTheme } = useTheme();
    const location = useLocation();
    
    const [paletteOpen, setPaletteOpen] = useState(false);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const breadcrumbs = useMemo(() => {
        return generateBreadcrumbs(location.pathname);
    }, [location.pathname]);

    return (
        <>
        <header className="print:hidden h-16 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
            {/* Left: Hamburger + Title (mobile) / Breadcrumbs (desktop) */}
            <div className="flex items-center gap-2 min-w-0">
                <button aria-label="Abrir menú" 
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <Menu size={24} />
                </button>

                <h1 className="md:hidden text-base font-semibold text-slate-900 dark:text-white truncate">
                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'DevManager'}
                </h1>
            
                <nav className="hidden md:flex text-sm text-slate-500 dark:text-slate-400 font-medium items-center gap-1">
                    <Link 
                        to={ROUTES.DASHBOARD} 
                        className="text-slate-900 dark:text-white font-semibold hover:text-primary dark:hover:text-primary transition-colors"
                    >
                        DevManager
                    </Link>
                    {breadcrumbs.map((crumb, index) => {
                        const isRoleIdPath = /^\/roles\/[^\/]+$/.test(crumb.path);
                        const displayName = isRoleIdPath ? (location.state as { roleName?: string } | null)?.roleName ?? 'Rol' : crumb.name;
                        const linkTo = isRoleIdPath ? ROUTES.ROLES : crumb.path;

                        return (
                            <React.Fragment key={crumb.path}>
                                <ChevronRight size={14} className="text-slate-400 mx-1" />
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="text-slate-500 dark:text-slate-400">{displayName}</span>
                                ) : (
                                    <Link 
                                        to={linkTo}
                                        className="hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        {displayName}
                                    </Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>

            <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-keyshortcuts="Control+K Meta+K"
                className="hidden lg:flex flex-1 max-w-md mx-8 h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-card-dark px-3 text-sm text-slate-500 dark:text-slate-400 hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Search size={18} aria-hidden="true" />
                <span className="flex-1 text-left">Buscar pantallas y acciones…</span>
                <kbd className="rounded border border-slate-300 dark:border-border-dark px-1.5 font-sans text-xs">Ctrl K</kbd>
            </button>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    aria-label="Buscar pantallas y acciones"
                    title="Buscar (Ctrl+K)"
                    className="lg:hidden p-2 text-slate-500 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <Search size={20} aria-hidden="true" />
                </button>
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <NotificationBell />
            </div>
        </header>
        {/* Outside <header>: its backdrop-blur would become the containing block of the fixed modal. */}
        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </>
    );
};

