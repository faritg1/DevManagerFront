import type { BadgeVariant } from '../../shared/ui';
import type { EnrollmentStatus, ProgramType } from '../../shared/api/types';

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
    1: 'Básica',
    2: 'Permanente',
    3: 'Gobierno / Dirigentes',
    4: 'Informal',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
    1: 'Inscrito',
    2: 'Completado',
    3: 'Retirado',
};

export const ENROLLMENT_STATUS_VARIANTS: Record<EnrollmentStatus, BadgeVariant> = {
    1: 'info',
    2: 'success',
    3: 'default',
};

export const HOURS_TYPE_LABELS: Record<string, string> = {
    Basic: 'Básica',
    Permanent: 'Permanente',
    Governance: 'Gobierno / Dirigentes',
    Informal: 'Informal',
};
