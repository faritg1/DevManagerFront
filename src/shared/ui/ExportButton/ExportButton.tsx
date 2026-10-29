import React from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { exportToCsv, type CsvColumn } from '../../export';
import { today } from '../../format';

interface ExportButtonProps<T> {
    /** Every row that passes the current filters (all pages, not only the visible one). */
    rows: T[];
    columns: CsvColumn<T>[];
    /** Base file name; the date is appended ("asociados-2026-10-29.csv"). */
    filename: string;
}

/** Toolbar pair: "Exportar" downloads the filtered rows as CSV; the printer prints the page (print stylesheet) or saves it as PDF. */
export function ExportButton<T>({ rows, columns, filename }: ExportButtonProps<T>) {
    return (
        <div className="flex items-center gap-1 print:hidden">
            <Button
                variant="outline"
                size="sm"
                icon={Download}
                disabled={rows.length === 0}
                onClick={() => exportToCsv(rows, columns, `${filename}-${today()}`)}
            >
                Exportar
            </Button>
            <IconButton icon={Printer} label="Imprimir / PDF" onClick={() => window.print()} />
        </div>
    );
}
