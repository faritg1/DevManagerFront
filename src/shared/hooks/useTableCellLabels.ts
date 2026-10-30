import { useEffect } from 'react';

/** Class (part of TABLE_CLASS) of the tables that turn into stacked "label: value" cards below md. */
export const RESPONSIVE_TABLE = 'responsive-table';

/** Copies each column header into data-label on its cells, so the mobile card layout (index.css) can show "label: value". */
const labelCells = (root: ParentNode) => {
    root.querySelectorAll<HTMLTableElement>(`table.${RESPONSIVE_TABLE}`).forEach((table) => {
        const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '');
        table.querySelectorAll('tbody tr').forEach((tr) => {
            [...tr.children].forEach((cell, i) => {
                const label = (cell as HTMLTableCellElement).colSpan > 1 ? '' : headers[i] ?? '';
                if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label);
            });
        });
    });
};

/** Mounted once by the app layout: keeps data-label in sync as tables render, page or filter. */
export const useTableCellLabels = () => {
    useEffect(() => {
        labelCells(document);
        // ponytail: relabels every responsive table on each DOM batch; fine for paged lists of a few rows.
        const observer = new MutationObserver(() => labelCells(document));
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);
};
