import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Bell, Search, Sun, Moon, ChevronRight } from 'lucide-react';
import { useTheme } from '../../shared/hooks';
import { ROUTES } from '../../shared/config/constants';

interface HeaderProps {
    onMenuClick?: () => void;
}

// Mapeo de rutas a nombres legibles
const ROUTE_NAMES: Record<string, string> = {
    [ROUTES.DASHBOARD]: 'Dashboard',
    [ROUTES.PROJECTS]: 'Proyectos',
    [ROUTES.CREATE_PROJECT]: 'Nuevo Proyecto',
    [ROUTES.MARKETPLACE]: 'Marketplace',
    [ROUTES.REPORTS]: 'Reportes IA',
    [ROUTES.AGENTS]: 'Agentes IA',
    [ROUTES.ORGANIZATIONS]: 'Organizaciones',
    [ROUTES.USERS]: 'Usuarios',
    [ROUTES.ROLES]: 'Roles',
    [ROUTES.PROFILE]: 'Mi Perfil',
    [ROUTES.SETTINGS]: 'Configuración',
};

// Obtener nombre de la ruta o generar uno a partir del path
const getRouteName = (path: string): string => {
    // Buscar coincidencia exacta primero
    if (ROUTE_NAMES[path]) {
        return ROUTE_NAMES[path];
    }
    
    // Manejar rutas con parámetros dinámicos (e.g., /projects/:id)
    if (path.startsWith('/projects/')) {
        // /projects/:id/edit
        if (path.endsWith('/edit')) {
            return 'Editar';
        }
        // /projects/:id
        return 'Detalle';
    }
    if (path.startsWith('/agents/')) {
        if (path.endsWith('/edit')) {
            return 'Editar';
        }
        return 'Detalle';
    }
    
    // Fallback: capitalizar el último segmento
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'Inicio';
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
};

// Generar breadcrumbs a partir del pathname
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
        <header className="h-16 border-b border-slate-200 dark:border-[#233948] bg-white/80 dark:bg-[#111b22]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
            {/* Mobile Menu Button */}
            <button 
                onClick={onMenuClick}
                className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <Menu size={24} />
            </button>
            
            {/* Breadcrumbs Dinámicos */}
            <nav className="hidden md:flex text-sm text-slate-500 dark:text-slate-400 font-medium items-center gap-1">
                <Link 
                    to={ROUTES.DASHBOARD} 
                    className="text-slate-900 dark:text-white font-semibold hover:text-primary dark:hover:text-primary transition-colors"
                >
                    DevManager
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                        <ChevronRight size={14} className="text-slate-400 mx-1" />
                        {index === breadcrumbs.length - 1 ? (
                            <span className="text-slate-500 dark:text-slate-400">{crumb.name}</span>
                        ) : (
                            <Link 
                                to={crumb.path}
                                className="hover:text-primary dark:hover:text-primary transition-colors"
                            >
                                {crumb.name}
                            </Link>
                        )}
                    </React.Fragment>
                ))}
            </nav>

            {/* Search (optional) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar proyectos, agentes..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-[#233948] bg-slate-50 dark:bg-[#16222b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                    title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#111b22]" />
                </button>
            </div>
        </header>
    );
};

export default Header;
