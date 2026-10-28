const GRADIENTS = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-400',
    'from-orange-500 to-yellow-400',
    'from-rose-500 to-red-400',
    'from-indigo-500 to-blue-400',
];

/** Stable gradient per project name, so a project keeps its color on every page. */
export const getProjectGradient = (name: string): string =>
    GRADIENTS[[...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % GRADIENTS.length];

export const getProjectInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
