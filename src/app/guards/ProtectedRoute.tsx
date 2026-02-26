import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/context';
import { ROUTES } from '../../shared/config/constants';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
