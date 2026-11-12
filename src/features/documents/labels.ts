import type {
    ClassificationNode, DocumentRetention, DocumentSeries, DocumentVersionStatus, DocumentaryType, DossierListItem, DossierStage, DossierStatus, FinalDisposition,
} from '../../shared/api';
import { formatDate, formatNumber } from '../../shared/format';
import type { BadgeVariant } from '../../shared/ui';

export const PERMISSIONS = {
    CREATE: 'menu.documents.master_list.create',
    APPROVE: 'menu.documents.master_list.approve',
    DISTRIBUTE: 'menu.documents.master_list.distribute',
    CLASSIFICATION: 'menu.documents.classification',
    CLASSIFICATION_MANAGE: 'menu.documents.classification.manage',
    DOSSIERS: 'menu.documents.dossiers',
    DOSSIERS_MANAGE: 'menu.documents.dossiers.manage',
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

/** Saves a downloaded file under its original name. */
export const saveBlob = (blob: Blob, name: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const DOSSIER_STATUS: Record<DossierStatus, [string, BadgeVariant]> = { Open: ['Abierto', 'success'], Closed: ['Cerrado', 'default'] };

export const DOSSIER_STAGE: Record<DossierStage, string> = { Management: 'Gestión', Central: 'Central', FinalDispositionPending: 'Disposición final pendiente' };

/** "15/01/2026", or nothing: the date of the dossier screens and of their two CSV reports, which Excel reads as a date. */
export const shortDate = (d: string | null | undefined): string => formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' }, '');

type DossierNodes = Pick<DossierListItem, 'sectionCode' | 'sectionName' | 'seriesCode' | 'seriesName' | 'subseriesCode' | 'subseriesName'>;

export const dossierSection = (d: DossierNodes): string => `${d.sectionCode} · ${d.sectionName}`;
export const dossierSeries = (d: DossierNodes): string => `${d.seriesCode} · ${d.seriesName}`;
export const dossierSubseries = (d: DossierNodes): string => (d.subseriesCode ? `${d.subseriesCode} · ${d.subseriesName ?? ''}` : '');

/** The node the dossier hangs from, written as its option of the series selector. */
export const dossierNodeLabel = (d: DossierNodes): string => (d.subseriesCode ? `${d.seriesCode} / ${dossierSubseries(d)}` : dossierSeries(d));

/** "Gestión hasta 01/04/2028", "Central hasta 01/04/2036" or "Disposición final pendiente: Eliminación"; nothing while open. */
export const stageText = (d: DossierListItem): string => {
    if (!d.stage) return '';
    if (d.stage === 'FinalDispositionPending') return `${DOSSIER_STAGE[d.stage]}${d.finalDisposition ? `: ${DISPOSITION[d.finalDisposition]}` : ''}`;
    return `${DOSSIER_STAGE[d.stage]} hasta ${shortDate(d.stage === 'Management' ? d.managementUntil : d.centralUntil)}`;
};

/** Types a document of the dossier may take: those of its series and, for a subseries, those of its parent series too. */
export const dossierTypes = (tree: ClassificationNode[], nodeId: string): DocumentaryType[] => {
    for (const series of tree.flatMap((section) => section.children)) {
        if (series.id === nodeId) return series.types;
        const subseries = series.children.find((n) => n.id === nodeId);
        if (subseries) return [...subseries.types, ...series.types];
    }
    return [];
};

export const formatSize = (bytes: number): string =>
    bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${formatNumber(bytes / (1024 * 1024), 1)} MB`;
