import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context';
import { rbacService } from '../api';
import type { EffectivePermissionsResponse } from '../api/types';

/** Effective permissions of the signed-in user; denies everything until (or if) they fail to load. */
export const usePermission = () => {
    const { user, isAuthenticated } = useAuth();
    const [effective, setEffective] = useState<EffectivePermissionsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Avoids the StrictMode double fetch.
    const fetchedFor = useRef<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !user?.id || fetchedFor.current === user.id) return;
        const userId = user.id;
        setIsLoading(true);
        rbacService.getUserEffectivePermissions(userId)
            .then((res) => {
                if (res.success && res.data) {
                    setEffective(res.data);
                    fetchedFor.current = userId;
                }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [isAuthenticated, user?.id]);

    const permSet = useMemo(
        () => new Set(effective?.effectivePermissions.map((p) => p.code) ?? []),
        [effective],
    );
    const hasPermission = useCallback((code: string) => permSet.has(code), [permSet]);

    return { hasPermission, isLoading };
};
