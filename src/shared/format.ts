const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const formatDate = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleDateString('es-ES', DATE_OPTIONS) : '—';

export const formatDateTime = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleString('es-ES', { ...DATE_OPTIONS, hour: '2-digit', minute: '2-digit' }) : '—';

export const currency = (n: number): string => COP.format(n);

/** Today as yyyy-MM-dd (UTC), the format date inputs expect. */
export const today = (): string => new Date().toISOString().slice(0, 10);
