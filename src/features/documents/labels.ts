import type { DocumentVersionStatus } from '../../shared/api';
import type { BadgeVariant } from '../../shared/ui';

export const PERMISSIONS = {
    CREATE: 'menu.platform.documents.create',
    APPROVE: 'menu.platform.documents.approve',
    DISTRIBUTE: 'menu.platform.documents.distribute',
} as const;

export const STATUS: Record<DocumentVersionStatus, [string, BadgeVariant]> = {
    Draft: ['Borrador', 'default'],
    InReview: ['En revisión', 'warning'],
    Approved: ['Aprobado', 'success'],
    Obsolete: ['Obsoleto', 'danger'],
};
