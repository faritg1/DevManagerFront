import { formatDate as formatSharedDate } from '../../shared/format';
import type { ApiError } from '../../shared/api';
import type { AssociateRole, AssociateStatus } from '../../shared/api/types';
import type { BadgeVariant } from '../../shared/ui';

export const STATUS_LABELS: Record<AssociateStatus, string> = {
    1: 'Aspirante',
    2: 'Activo',
    3: 'Suspendido',
    4: 'Retirado',
};

export const STATUS_VARIANTS: Record<AssociateStatus, BadgeVariant> = {
    1: 'info',
    2: 'success',
    3: 'warning',
    4: 'default',
};

// Transiciones válidas (espejo de la regla del backend; el backend sigue siendo la autoridad)
export const ALLOWED_TRANSITIONS: Record<AssociateStatus, AssociateStatus[]> = {
    1: [2, 4],
    2: [3, 4],
    3: [2, 4],
    4: [1],
};

export const ROLE_LABELS: Record<AssociateRole, string> = {
    Associate: 'Asociado',
    Employee: 'Empleado',
    Both: 'Asociado y empleado',
    None: 'Ninguno',
};

export const DOCUMENT_TYPES: Record<number, string> = {
    1: 'CC', 2: 'CE', 3: 'TI', 4: 'PA', 5: 'NIT', 6: 'PEP',
};

export const ENTITY_TYPES: Record<number, string> = {
    1: 'Cooperativa de trabajo asociado',
    2: 'Ahorro y crédito',
    3: 'Multiactiva',
    4: 'Mutual',
    5: 'Fondo de empleados',
    6: 'Otra',
};

/** Shows only the calendar day of a date or timestamp. */
export const formatDate = (d?: string | null): string => formatSharedDate(d?.slice(0, 10));

export { formatDateTime } from '../../shared/format';

/** Errores del API ya se notifican globalmente (excepto 404); esto cubre el resto. */
export const isApiError = (e: unknown): e is ApiError =>
    typeof e === 'object' && e !== null && 'status' in e;
export const needsLocalToast = (e: unknown): boolean => !isApiError(e) || e.status === 404;
export const errorText = (e: unknown, fallback = 'Error de conexión'): string =>
    isApiError(e) && e.message ? e.message : fallback;
