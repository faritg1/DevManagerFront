import { useMemo, useState } from 'react';

const normalize = (v: unknown) =>
    String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Options<T> {
    pageSize?: number;
    /** Values of an item the search box matches against (accent- and case-insensitive). */
    searchFields?: (item: T) => unknown[];
}

export interface PagedFilter<T> {
    query: string;
    setQuery: (q: string) => void;
    page: number;
    setPage: (p: number) => void;
    pageItems: T[];
    /** Items after the search filter, before paging. */
    total: number;
    pageCount: number;
    pageSize: number;
}

// ponytail: client-side filter/paging; move to server params if a list grows past a few hundred rows.
/** Client-side search + paging for small lists. */
export function usePagedFilter<T>(items: T[], { pageSize = 10, searchFields }: Options<T> = {}): PagedFilter<T> {
    const [query, setQueryState] = useState('');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        if (!q || !searchFields) return items;
        return items.filter(item => searchFields(item).some(v => normalize(v).includes(q)));
        // searchFields is usually an inline lambda, so it is left out of the deps on purpose.
    }, [items, query]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pageCount);

    return {
        query,
        setQuery: (q) => { setQueryState(q); setPage(1); },
        page: current,
        setPage,
        pageItems: filtered.slice((current - 1) * pageSize, current * pageSize),
        total: filtered.length,
        pageCount,
        pageSize,
    };
}
