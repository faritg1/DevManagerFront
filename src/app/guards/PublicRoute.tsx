import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/context';
import { ROUTES } from '../../shared/config/constants';
import { LoadingBlock } from '../../shared/ui';

export const PublicRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingBlock label="Cargando..." className="min-h-screen bg-background-light dark:bg-background-dark" />;
    }

    if (isAuthenticated) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <Outlet />;
};

