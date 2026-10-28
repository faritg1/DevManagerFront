import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useIsAdmin } from '../../shared/hooks';

/** Renders child routes only for admins; ProtectedRoute above already handles unauthenticated users. */
export const AdminGuard: React.FC = () => {
    const isAdmin = useIsAdmin();
    if (isAdmin) {
        return <Outlet />;
    }

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
};
