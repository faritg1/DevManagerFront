import React, { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Plus, Search, Settings, User, type LucideIcon } from 'lucide-react';
import { Modal } from '../../shared/ui';
import { normalizeSearch, usePermission } from '../../shared/hooks';
import { ROUTES } from '../../shared/config/constants';
import { visibleNav } from '../Sidebar/navConfig';

interface Entry {
    key: string;
    label: string;
    group: string;
    to: string;
    icon: LucideIcon;
}

/** Lower is better: prefix, word initials ("bs" → "Balance Social"), substring, then any subsequence; -1 = no match. */
const score = (text: string, q: string): number => {
    const t = normalizeSearch(text);
    const at = t.indexOf(q);
    if (at === 0) return 0;
    if (t.split(/\s+/).map((w) => w[0]).join('').startsWith(q)) return 1;
    if (at > 0) return 2;
    let i = 0;
    for (const ch of t) if (ch === q[i]) i++;
    return i === q.length ? 3 : -1;
};

/** Ctrl/Cmd+K launcher over the menu entries the user can see (same filter as the sidebar) plus a few quick actions. */
export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const access = usePermission();
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const listId = useId();

    const entries = useMemo<Entry[]>(() => {
        if (access.isLoading) return [];
        const nav = visibleNav(access).flatMap((section) =>
            section.items.flatMap((item) => item.children ?? [item])
                .filter((item) => item.to)
                .map((item) => ({ key: item.key, label: item.label, group: section.title, to: item.to!, icon: item.icon })));
        const actions: Entry[] = [
            ...(access.has('menu.platform.projects.create')
                ? [{ key: 'new-project', label: 'Nuevo proyecto', group: 'Acciones', to: ROUTES.CREATE_PROJECT, icon: Plus }]
                : []),
            { key: 'profile', label: 'Mi perfil', group: 'Acciones', to: ROUTES.PROFILE, icon: User },
            { key: 'settings', label: 'Configuración', group: 'Acciones', to: ROUTES.SETTINGS, icon: Settings },
        ];
        return [...nav, ...actions];
    }, [access]);

    const results = useMemo(() => {
        const q = normalizeSearch(query.trim());
        if (!q) return entries;
        return entries
            .map((e) => {
                const s = score(e.label, q);
                // A section name ("solidario") lists its screens after the direct matches.
                return { e, s: s >= 0 ? s : normalizeSearch(e.group).includes(q) ? 4 : -1 };
            })
            .filter((r) => r.s >= 0)
            .sort((a, b) => a.s - b.s)
            .map((r) => r.e);
    }, [entries, query]);

    useEffect(() => { if (isOpen) { setQuery(''); setActive(0); } }, [isOpen]);
    useEffect(() => { setActive(0); }, [query]);

    const go = (entry: Entry | undefined) => {
        if (!entry) return;
        onClose();
        navigate(entry.to);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const move = (to: number) => { e.preventDefault(); setActive((to + results.length) % Math.max(1, results.length)); };
        if (e.key === 'ArrowDown') move(active + 1);
        else if (e.key === 'ArrowUp') move(active - 1);
        else if (e.key === 'Home') move(0);
        else if (e.key === 'End') move(results.length - 1);
        else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    };

    useEffect(() => {
        document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
    }, [active, listId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ir a…" icon={<Search size={20} className="text-primary" aria-hidden="true" />} size="lg">
            <input
                autoFocus
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
                aria-label="Buscar pantallas y acciones"
                placeholder="Buscar pantallas y acciones…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary dark:border-border-dark dark:bg-background-dark dark:text-white dark:placeholder:text-slate-400"
            />
            {results.length === 0 ? (
                <p role="status" className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Sin resultados para “{query}”.</p>
            ) : (
                <ul id={listId} role="listbox" aria-label="Resultados" className="mt-3 max-h-80 overflow-y-auto">
                    {results.map((entry, i) => (
                        <li
                            key={entry.key}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            onMouseMove={() => setActive(i)}
                            onClick={() => go(entry)}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                                i === active ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200'
                            }`}
                        >
                            <entry.icon size={18} className="shrink-0" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{entry.group}</span>
                            {i === active && <CornerDownLeft size={14} className="shrink-0" aria-hidden="true" />}
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
};
