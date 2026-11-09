const TINTS = [
    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
];

/** Stable solid tint per project name, so a project keeps its color on every page. */
export const getProjectTint = (name: string): string =>
    TINTS[[...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % TINTS.length];

export const getProjectInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
