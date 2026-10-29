import { formatNumber } from './format';

export interface CsvColumn<T> {
    header: string;
    /** Cell value: numbers use es-CO decimals ("1.234,5"); pass already formatted strings for dates or labels. */
    value: (row: T) => string | number | boolean | null | undefined;
}

// A leading = + - @ (or tab/CR) makes Excel evaluate the cell as a formula (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (v: string | number | boolean | null | undefined): string => {
    if (v == null) return '';
    let s = typeof v === 'number' ? formatNumber(v, 2) : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : v;
    if (typeof v === 'string' && FORMULA_START.test(s)) s = `'${s}`;
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV text for es-CO Excel: ";" separator (the locale uses "," for decimals) and CRLF rows. */
export const toCsv = <T,>(rows: T[], columns: CsvColumn<T>[]): string =>
    [columns.map((c) => cell(c.header)), ...rows.map((r) => columns.map((c) => cell(c.value(r))))]
        .map((line) => line.join(';'))
        .join('\r\n');

/** Downloads `rows` as `filename`.csv; the UTF-8 BOM makes Excel read accents correctly. */
export const exportToCsv = <T,>(rows: T[], columns: CsvColumn<T>[], filename: string): void => {
    const blob = new Blob(['﻿', toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
};
