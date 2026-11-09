// Clases de tabla compartidas (mismo estilo que las tablas de Competencias/Nómina).
// responsive-table: below md each row becomes a "label: value" card (index.css + useTableCellLabels).
export const TABLE_CLASS = 'responsive-table min-w-full text-left text-sm whitespace-nowrap';
// `sticky` mantiene el encabezado visible cuando la tabla vive en un contenedor con scroll vertical.
export const THEAD_CLASS = 'sticky top-0 z-10 bg-slate-50 dark:bg-background-dark text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-border-dark';
// Opaque surface + left shade for the sticky actions column, so "Acciones" never scrolls out of view (md+ only: below md rows are cards).
const STICKY_END = 'md:sticky md:right-0 md:shadow-[-8px_0_8px_-8px_rgba(15,23,42,.12)] dark:md:shadow-[-8px_0_8px_-8px_rgba(0,0,0,.5)]';
export const TH_CLASS = 'px-4 first:pl-5 last:pr-5 py-3 font-semibold uppercase text-xs leading-4 tracking-wider';
export const TH_ACTIONS_CLASS = `${TH_CLASS} text-right ${STICKY_END} bg-slate-50 dark:bg-background-dark`;
/** Sticky actions cell: matches the row surface and its hover (rows use TR_CLASS's `group`). */
export const TD_ACTIONS_CLASS = `${STICKY_END} bg-white dark:bg-card-dark group-hover:bg-slate-50 dark:group-hover:bg-[#1d2931]`;
export const TBODY_CLASS = 'divide-y divide-slate-100 dark:divide-border-dark';
export const TR_CLASS = 'group transition-colors duration-[120ms] hover:bg-slate-50 dark:hover:bg-white/[.03] focus-visible:bg-primary/5';
export const TD_CLASS = 'px-4 first:pl-5 last:pr-5 py-3';
// Texto largo dentro de una celda (aplicar a un span/p interno): se corta con "…"; acompáñalo de `title` con el valor completo.
export const TD_TRUNCATE_CLASS = 'block max-w-[16rem] truncate';
