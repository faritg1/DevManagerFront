import { useAuth } from '../context';

const ADMIN_ROLES = ['admin', 'administrator'];

/** Admin check by role name, case-insensitive. */
export const useIsAdmin = (): boolean => {
    const { user } = useAuth();
    return ADMIN_ROLES.includes((user?.role ?? '').toLowerCase().trim());
};
