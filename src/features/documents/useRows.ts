import { useEffect, useState } from 'react';
import type { ApiResponse } from '../../shared/api';

/** Rows of one query: `undefined` while it loads, `null` when it failed. `load` must be a stable function. */
export const useRows = <T,>(load: () => Promise<ApiResponse<T[]>>, enabled = true): T[] | null | undefined => {
    const [rows, setRows] = useState<T[] | null | undefined>(undefined);
    useEffect(() => {
        if (!enabled) return;
        let live = true;
        load().then(
            (r) => { if (live) setRows(r.data ?? []); },
            () => { if (live) setRows(null); },
        );
        return () => { live = false; };
    }, [load, enabled]);
    return rows;
};
