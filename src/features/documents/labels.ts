import type { DocumentVersionStatus } from '../../shared/api';
import { formatNumber } from '../../shared/format';
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

export const ACCEPTED_FILES = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg';
// ponytail: mirrors the default of Storage:MaxFileBytes; if an installation raises it this blocks first, and the API has no endpoint to read it from.
export const MAX_FILE_MB = 20;

/** Same rules and messages as the API, which still checks the content. */
export const fileError = (file: File): string | null => {
    if (!ACCEPTED_FILES.split(',').some((ext) => file.name.toLowerCase().endsWith(ext))) return 'Solo se admiten archivos PDF, DOCX, XLSX, PNG y JPG';
    if (file.size === 0) return 'El archivo está vacío';
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `El archivo supera el tamaño máximo de ${MAX_FILE_MB} MB`;
    return null;
};

export const formatSize = (bytes: number): string =>
    bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${formatNumber(bytes / (1024 * 1024), 1)} MB`;
