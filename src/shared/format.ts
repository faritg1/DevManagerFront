const LOCALE = 'es-CO';
const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
const COP = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Parses API dates. A date-only "yyyy-mm-dd" (DateOnly) is a calendar day, so it is read as local midnight, not UTC (which shows the previous day in Colombia). */
export const toDate = (d: string): Date => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d);
};

/** "05 may 2026"; pass options for other shapes, e.g. { month: 'long', year: 'numeric' }. */
export const formatDate = (d: string | null | undefined, options: Intl.DateTimeFormatOptions = DATE_OPTIONS, fallback = '—'): string => {
    if (!d) return fallback;
    const date = toDate(d);
    return isNaN(date.getTime()) ? fallback : date.toLocaleDateString(LOCALE, options);
};

export const formatDateTime = (d: string | null | undefined): string =>
    d ? toDate(d).toLocaleString(LOCALE, { ...DATE_OPTIONS, hour: '2-digit', minute: '2-digit' }) : '—';

export const formatTime = (d: Date): string => d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });

/** Locale number with up to `digits` decimals ("3,5"). */
export const formatNumber = (n: number, digits = 1): string => n.toLocaleString(LOCALE, { maximumFractionDigits: digits });

export const currency = (n: number): string => COP.format(n);

const USD = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
export const usd = (n: number): string => USD.format(n);

/** Today as yyyy-MM-dd in local time, the format date inputs expect (en-CA formats as ISO). */
export const today = (): string => new Date().toLocaleDateString('en-CA');

export const SKILL_LEVELS = ['Básico', 'Intermedio', 'Competente', 'Avanzado', 'Experto'].map((name, i) => ({ id: i + 1, name }));

export const skillLevelLabel = (level: number): string => SKILL_LEVELS[level - 1]?.name ?? `Nivel ${level}`;

const RTF = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' });
const RTF_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];

/** "hace 5 min", "ayer"… relative to now. The API sends UTC timestamps without offset, so a bare one is read as UTC. */
export const timeAgo = (d: string): string => {
    const utc = /(?:[zZ]|[+-]\d\d:?\d\d)$/.test(d) ? d : `${d}Z`;
    const seconds = (new Date(utc).getTime() - Date.now()) / 1000;
    const unit = RTF_UNITS.find(([, s]) => Math.abs(seconds) >= s);
    return unit ? RTF.format(Math.round(seconds / unit[1]), unit[0]) : 'ahora';
};
