import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import type { PagedFilter } from '../../hooks/usePagedFilter';

/** "Mostrando 1–10 de 42" + Anterior/Siguiente; renders nothing when everything fits on one page. */
export const Pager: React.FC<{ pager: PagedFilter<unknown>; className?: string }> = ({ pager, className = '' }) => {
    const { page, pageCount, pageSize, total, setPage } = pager;
    if (pageCount <= 1) return null;
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return (
        <nav aria-label="Paginación" className={`flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-border-dark dark:text-slate-400 ${className}`}>
            <p aria-live="polite">Mostrando {from}–{to} de {total}</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Siguiente</Button>
            </div>
        </nav>
    );
};

/** Search box bound to a usePagedFilter instance. */
export const SearchInput: React.FC<{ pager: PagedFilter<unknown>; label: string; className?: string }> = ({ pager, label, className = 'sm:max-w-xs' }) => (
    <div className={`w-full ${className}`}>
        <Input
            type="search"
            inputSize="sm"
            icon={Search}
            placeholder={label}
            aria-label={label}
            value={pager.query}
            onChange={(e) => pager.setQuery(e.target.value)}
        />
    </div>
);
