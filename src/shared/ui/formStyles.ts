// Clases compartidas para <select> nativos: mismo aspecto que <Input> (tamaño md) y su variante compacta para filtros.
export const SELECT_CLASS =
    'h-11 rounded-xl border border-control-border dark:border-input-border bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-[border-color,box-shadow] duration-[120ms] ease-standard disabled:opacity-50 disabled:cursor-not-allowed';
export const SELECT_SM_CLASS =
    'h-10 [@media(pointer:coarse)]:h-11 rounded-xl border border-control-border dark:border-input-border bg-white dark:bg-card-dark text-slate-900 dark:text-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-[border-color,box-shadow] duration-[120ms] ease-standard disabled:opacity-50 disabled:cursor-not-allowed';
// Textarea compartido: mismo borde, foco y estado deshabilitado que <Input>.
export const TEXTAREA_CLASS =
    'w-full rounded-xl border border-control-border dark:border-input-border bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-[border-color,box-shadow] duration-[120ms] ease-standard disabled:opacity-50 disabled:cursor-not-allowed';
