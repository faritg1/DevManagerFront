import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context';
import { rbacService } from '../api';
import type { EffectivePermissionsResponse } from '../api/types';

interface UsePermissionReturn {
    /** true si el usuario tiene el permiso consultado */
    hasPermission: (code: string) => boolean;
    /** true si el usuario tiene TODOS los permisos del array */
    hasAllPermissions: (codes: string[]) => boolean;
    /** true si el usuario tiene AL MENOS UNO de los permisos del array */
    hasAnyPermission: (codes: string[]) => boolean;
    /** Roles asignados al usuario actual */
    roles: string[];
    /** true mientras se carga la lista de permisos efectivos */
    isLoading: boolean;
    /** Forzar recarga de permisos (útil tras cambio de rol) */
    refresh: () => void;
}

/**
 * Hook para consultar los permisos efectivos del usuario autenticado.
 *
 * Ejemplo de uso:
 * ```tsx
 * const { hasPermission } = usePermission();
 * if (!hasPermission('users.delete')) return null;
 * ```
 */
export const usePermission = (): UsePermissionReturn => {
    const { user, isAuthenticated } = useAuth();
    const [effective, setEffective] = useState<EffectivePermissionsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Evitar doble-fetch en StrictMode
    const fetchedFor = useRef<string | null>(null);

    const load = useCallback(async () => {
        if (!isAuthenticated || !user?.id) return;
        // No volver a pedir si ya tenemos datos para este usuario
        if (fetchedFor.current === user.id) return;

        setIsLoading(true);
        try {
            const res = await rbacService.getUserEffectivePermissions(user.id);
            if (res.success && res.data) {
                setEffective(res.data);
                fetchedFor.current = user.id;
            }
        } catch {
            // Falla silenciosa — deniega todo por defecto
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = useCallback(() => {
        fetchedFor.current = null;
        setEffective(null);
        load();
    }, [load]);

    const permSet = new Set(effective?.effectivePermissions.map((p) => p.code) ?? []);

    const hasPermission = useCallback(
        (code: string) => permSet.has(code),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [effective],
    );

    const hasAllPermissions = useCallback(
        (codes: string[]) => codes.every((c) => permSet.has(c)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [effective],
    );

    const hasAnyPermission = useCallback(
        (codes: string[]) => codes.some((c) => permSet.has(c)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [effective],
    );

    const roles = effective?.roles.map((r) => r.name) ?? [];

    return {
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
        roles,
        isLoading,
        refresh,
    };
};

export default usePermission;
