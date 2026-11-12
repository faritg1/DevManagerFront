import type { ClassificationNode, DocumentRetention, DocumentSeries, DocumentVersionStatus, FinalDisposition } from '../../shared/api';
import { formatNumber } from '../../shared/format';
import type { BadgeVariant } from '../../shared/ui';

export const PERMISSIONS = {
    CREATE: 'menu.documents.master_list.create',
    APPROVE: 'menu.documents.master_list.approve',
    DISTRIBUTE: 'menu.documents.master_list.distribute',
    CLASSIFICATION: 'menu.documents.classification',
    CLASSIFICATION_MANAGE: 'menu.documents.classification.manage',
} as const;

export const DISPOSITION: Record<FinalDisposition, string> = { 1: 'Conservación total', 2: 'Eliminación', 3: 'Selección' };

/** Value of the series filter, and of `?serie=` in the master list URL, for documents without a series. */
export const UNCLASSIFIED = 'sin-clasificar';

const years = (n: number | null): string => (n === 1 ? '1 año' : `${n ?? 0} años`);

/** "Gestión 2 años · Central 8 años · Eliminación", or null when the series defines no retention. */
export const retentionText = (r: DocumentRetention | null | undefined): string | null =>
    r?.finalDisposition ? `Gestión ${years(r.managementYears)} · Central ${years(r.centralYears)} · ${DISPOSITION[r.finalDisposition]}` : null;

export const seriesLabel = (d: DocumentSeries): string => (d.seriesCode ? `${d.seriesCode} · ${d.seriesName ?? ''}` : '');

/** Active series and subseries, the only nodes a document can be assigned to; an inactive node hides its children too. */
export const seriesOptions = (tree: ClassificationNode[]): { id: string; label: string }[] =>
    tree.filter((n) => n.isActive).flatMap((section) => section.children.filter((n) => n.isActive).flatMap((series) => [
        { id: series.id, label: `${series.code} · ${series.name}` },
        ...series.children.filter((n) => n.isActive).map((sub) => ({ id: sub.id, label: `${series.code} / ${sub.code} · ${sub.name}` })),
    ]));

/** Same window as the API's DocumentReviewNotifier. */
export const REVIEW_WINDOW_DAYS = 30;

/** Document code that opens its detail; 44 px tall on touch screens. */
export const CODE_LINK_CLASS = 'font-semibold text-primary-600 dark:text-primary hover:underline underline-offset-2 [@media(pointer:coarse)]:inline-flex [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:items-center';

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
