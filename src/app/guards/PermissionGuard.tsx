import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePermission } from '../../shared/hooks';
import { LoadingBlock } from '../../shared/ui';
import { ROUTES } from '../../shared/config/constants';
import { findNavItem, firstVisibleRoute, isItemVisible } from '../../widgets/Sidebar/navConfig';

/**
 * Blocks any screen whose menu entry is hidden for the user, using the same rule as the sidebar
 * (codes come from NAV_CONFIG, so menu and routes cannot drift). Routes outside the menu pass through.
 * `require` additionally demands one permission code, e.g. an action such as `menu.platform.projects.create`.
 */
export const PermissionGuard: React.FC<{ require?: string }> = ({ require }) => {
    const { pathname } = useLocation();
    const access = usePermission();
    const item = findNavItem(pathname);

    if (!item && !require) return <Outlet />;
    if (access.isLoading) return <LoadingBlock />;
    if (require ? access.has(require) : isItemVisible(item!, access)) return <Outlet />;
    return <Navigate to={firstVisibleRoute(access) ?? ROUTES.PROFILE} replace />;
};
