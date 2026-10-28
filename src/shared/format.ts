const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const formatDate = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleDateString('es-ES', DATE_OPTIONS) : '—';

export const formatDateTime = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleString('es-ES', { ...DATE_OPTIONS, hour: '2-digit', minute: '2-digit' }) : '—';

export const currency = (n: number): string => COP.format(n);

/** Today as yyyy-MM-dd (UTC), the format date inputs expect. */
export const today = (): string => new Date().toISOString().slice(0, 10);

export const SKILL_LEVELS = ['Básico', 'Intermedio', 'Competente', 'Avanzado', 'Experto'].map((name, i) => ({ id: i + 1, name }));

export const skillLevelLabel = (level: number): string => SKILL_LEVELS[level - 1]?.name ?? `Nivel ${level}`;

const RTF = new Intl.RelativeTimeFormat('es', { numeric: 'auto', style: 'short' });
const RTF_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];

/** "hace 5 min", "ayer"… relative to now. */
export const timeAgo = (d: string): string => {
    const seconds = (new Date(d).getTime() - Date.now()) / 1000;
    const unit = RTF_UNITS.find(([, s]) => Math.abs(seconds) >= s);
    return unit ? RTF.format(Math.round(seconds / unit[1]), unit[0]) : 'ahora';
};
