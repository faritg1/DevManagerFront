import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/context';
import { ROUTES } from '../../shared/config/constants';
import { ShieldX } from 'lucide-react';

interface RoleGuardProps {
    /** Roles permitidos para acceder a las rutas hijas */
    allowedRoles: string[];
    /** Ruta de redirección si el rol no está permitido (default: dashboard) */
    redirectTo?: string;
}

/**
 * Guard de rutas basado en rol del usuario.
 * Sólo renderiza las rutas hijas si el usuario autenticado
 * posee uno de los `allowedRoles`.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
    allowedRoles,
    redirectTo,
}) => {
    const { user, isAuthenticated } = useAuth();

    // Si no está autenticado, el ProtectedRoute padre ya redirige al login.
    if (!isAuthenticated || !user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    const userRole = (user.role ?? '').toLowerCase().trim();
    const hasAccess = allowedRoles.some(
        (r) => r.toLowerCase().trim() === userRole,
    );

    if (!hasAccess) {
        if (redirectTo) {
            return <Navigate to={redirectTo} replace />;
        }

        // Pantalla de "Acceso denegado" en lugar de redirigir silenciosamente
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                    <ShieldX className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Acceso denegado
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">
                    No tienes permisos para acceder a esta sección. Contacta a tu
                    administrador si crees que esto es un error.
                </p>
            </div>
        );
    }

    return <Outlet />;
};

export default RoleGuard;
