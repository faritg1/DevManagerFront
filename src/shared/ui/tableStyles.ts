// Clases de tabla compartidas (mismo estilo que las tablas de Competencias/Nómina).
export const TABLE_CLASS = 'min-w-full text-left text-sm whitespace-nowrap';
// `sticky` mantiene el encabezado visible cuando la tabla vive en un contenedor con scroll vertical.
export const THEAD_CLASS = 'sticky top-0 z-10 bg-slate-50 dark:bg-background-dark text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-border-dark';
export const TH_CLASS = 'px-4 first:pl-6 last:pr-6 py-4 font-bold uppercase text-xs tracking-wider';
export const TH_ACTIONS_CLASS = `${TH_CLASS} text-right`;
export const TBODY_CLASS = 'divide-y divide-slate-100 dark:divide-border-dark';
export const TR_CLASS = 'transition-colors hover:bg-slate-50 dark:hover:bg-border-dark/50';
export const TD_CLASS = 'px-4 first:pl-6 last:pr-6 py-4';
// Texto largo dentro de una celda (aplicar a un span/p interno): se corta con "…"; acompáñalo de `title` con el valor completo.
export const TD_TRUNCATE_CLASS = 'block max-w-[16rem] truncate';
