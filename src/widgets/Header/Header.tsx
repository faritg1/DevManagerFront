import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, Sun, Moon, ChevronRight } from 'lucide-react';
import { useTheme } from '../../shared/hooks';
import { ROUTES } from '../../shared/config/constants';
import { NotificationBell } from './NotificationBell';

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
    
    const breadcrumbs = useMemo(() => {
        return generateBreadcrumbs(location.pathname);
    }, [location.pathname]);

    return (
        <header className="h-16 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
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

            <div className="hidden lg:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar proyectos, agentes..." aria-label="Buscar"
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-card-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
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
    );
};

