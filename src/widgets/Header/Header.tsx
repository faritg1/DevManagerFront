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
    [ROUTES.AUDIT]: 'Auditoría',
    [ROUTES.DOCUMENTS]: 'Documentos',
    [ROUTES.DOCUMENTS_HOME]: 'Gestión documental',
    [ROUTES.DOCUMENT_READS]: 'Mis lecturas',
    [ROUTES.DOCUMENT_APPROVALS]: 'Por aprobar',
    [ROUTES.ACTIVITIES]: 'Actividades',
    [ROUTES.MY_ACTIVITIES]: 'Mis actividades',
    [ROUTES.TIME_REPORT]: 'Reporte de horas',
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
    if (segments.length === 2 && segments[0] === 'activities') return 'Proyecto';
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
        <header className="print:hidden h-14 md:h-16 border-b border-slate-200 dark:border-border-dark bg-white/85 dark:bg-background-dark/85 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 md:px-6 shrink-0 z-10">
            {/* Left: Hamburger + Title (mobile) / Breadcrumbs (desktop) */}
            <div className="flex items-center gap-2 min-w-0">
                <button aria-label="Abrir menú" 
                    onClick={onMenuClick}
                    className="md:hidden inline-flex size-9 [@media(pointer:coarse)]:size-11 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-[120ms] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <Menu size={22} aria-hidden="true" />
                </button>

                <h1 className="md:hidden text-base font-semibold text-slate-900 dark:text-white truncate">
                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'DevManager'}
                </h1>
            
                <nav aria-label="Migas de pan" className="hidden md:flex min-w-0 text-sm text-slate-600 dark:text-slate-400 items-center gap-1">
                    <Link 
                        to={ROUTES.DASHBOARD} 
                        className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary transition-colors"
                    >
                        DevManager
                    </Link>
                    {breadcrumbs.map((crumb, index) => {
                        const isRoleIdPath = /^\/roles\/[^\/]+$/.test(crumb.path);
                        const displayName = isRoleIdPath ? (location.state as { roleName?: string } | null)?.roleName ?? 'Rol' : crumb.name;
                        const linkTo = isRoleIdPath ? ROUTES.ROLES : crumb.path;

                        return (
                            <React.Fragment key={crumb.path}>
                                <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 mx-0.5 shrink-0" aria-hidden="true" />
                                {index === breadcrumbs.length - 1 ? (
                                    <span aria-current="page" className="truncate font-semibold text-slate-900 dark:text-white">{displayName}</span>
                                ) : (
                                    <Link 
                                        to={linkTo}
                                        className="hover:text-primary-600 dark:hover:text-primary transition-colors"
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
                className="hidden lg:flex flex-1 max-w-md mx-8 h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-card-dark px-3 text-sm text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-input-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Search size={18} aria-hidden="true" />
                <span className="flex-1 text-left">Buscar pantallas y acciones…</span>
                <kbd className="rounded border border-slate-300 dark:border-border-dark px-1.5 font-sans text-xs">Ctrl K</kbd>
            </button>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    aria-label="Buscar pantallas y acciones"
                    title="Buscar (Ctrl+K)"
                    className="lg:hidden inline-flex size-9 [@media(pointer:coarse)]:size-11 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-[120ms] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <Search size={20} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex size-9 [@media(pointer:coarse)]:size-11 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-[120ms] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {resolvedTheme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                </button>

                <NotificationBell />
            </div>
        </header>
        {/* Outside <header>: its backdrop-blur would become the containing block of the fixed modal. */}
        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </>
    );
};

