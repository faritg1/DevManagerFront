import { useAuth } from '../context';

const ADMIN_ROLES = ['admin', 'administrator'];

/** Same admin check the Sidebar and Users pages use (role name, case-insensitive). */
export const useIsAdmin = (): boolean => {
    const { user } = useAuth();
    return ADMIN_ROLES.includes((user?.role ?? '').toLowerCase().trim());
};
