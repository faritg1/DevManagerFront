import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { rbacService } from '../api';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface PermissionsContextValue {
    /** True when the signed-in user holds the code (server already prunes options and actions of ungranted ancestors); always true for admins. */
    has: (code: string) => boolean;
    isAdmin: boolean;
    isLoading: boolean;
    /** /permissions/me failed: callers fall back to the role-name `adminOnly` behavior. */
    failed: boolean;
    refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

/** Loads GET /permissions/me once per mount; mounted under the authenticated layout, so it refetches on every login. */
export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const roleIsAdmin = useIsAdmin();
    const [codes, setCodes] = useState<Set<string> | null>(null);
    const [isAdmin, setIsAdmin] = useState(roleIsAdmin);
    const [failed, setFailed] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const res = await rbacService.getMyPermissions();
            setCodes(new Set(res.data.effectivePermissions.map((p) => p.code)));
            setIsAdmin(res.data.isAdmin);
            setFailed(false);
        } catch {
            setFailed(true);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const value = useMemo<PermissionsContextValue>(() => ({
        has: (code) => (failed ? roleIsAdmin : isAdmin) || !!codes?.has(code),
        isAdmin: failed ? roleIsAdmin : isAdmin,
        isLoading: !codes && !failed,
        failed,
        refresh,
    }), [codes, isAdmin, roleIsAdmin, failed, refresh]);

    return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const usePermission = (): PermissionsContextValue => {
    const context = useContext(PermissionsContext);
    if (!context) throw new Error('usePermission must be used within a PermissionsProvider');
    return context;
};
