import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config/constants';

export type Theme = 'light' | 'dark' | 'system';

const getSystemTheme = (): 'light' | 'dark' =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = (resolved: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
};

const getStoredTheme = (): Theme => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
};

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(getStoredTheme);
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

    useEffect(() => {
        applyTheme(resolvedTheme);
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }, [theme, resolvedTheme]);

    useEffect(() => {
        if (theme !== 'system') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme(getSystemTheme());
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

    return { theme, resolvedTheme, setTheme, toggleTheme };
};
