import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/context';
import { ROUTES } from '../../shared/config/constants';
import { LoadingBlock } from '../../shared/ui';

export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingBlock label="Verificando sesión..." className="min-h-screen bg-background-light dark:bg-background-dark" />;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return <Outlet />;
};

