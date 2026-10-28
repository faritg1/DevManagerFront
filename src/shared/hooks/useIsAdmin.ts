import { useAuth } from '../context';

const ADMIN_ROLES = ['admin', 'administrator'];

/** Role names the backend treats as admin (they always receive every permission). */
export const isAdminRoleName = (name: string | null | undefined): boolean =>
    ADMIN_ROLES.includes((name ?? '').toLowerCase().trim());

/** Admin check by role name, case-insensitive. */
export const useIsAdmin = (): boolean => isAdminRoleName(useAuth().user?.role);
