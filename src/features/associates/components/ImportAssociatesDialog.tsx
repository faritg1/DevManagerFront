import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button, Input, Modal, TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TH_CLASS as TH, TD_CLASS as TD } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { associatesService } from '../../../shared/api';
import type { AssociateImportReport } from '../../../shared/api/types';
import { exportToCsv, type CsvColumn } from '../../../shared/export';
import { errorText, needsLocalToast } from '../labels';

const TEMPLATE_COLUMNS: CsvColumn<never>[] = ['Nombres', 'Apellidos', 'Email', 'Telefono', 'FechaSolicitud']
    .map((header) => ({ header, value: () => '' }));

interface Props {
    onClose: () => void;
    onImported: () => void;
}

/** Mounted only while open, so every import starts from a clean state. */
export const ImportAssociatesDialog: React.FC<Props> = ({ onClose, onImported }) => {
    const { showNotification } = useNotification();
    const [file, setFile] = useState<File | null>(null);
    const [report, setReport] = useState<AssociateImportReport | null>(null);
    const [imported, setImported] = useState<number | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const canConfirm = !!report && report.errorCount === 0 && report.validCount > 0 && !isPreviewing && !isSaving;

    const showError = (e: unknown) => {
        if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
    };

    const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null;
        e.target.value = ''; // Choosing the same file again after fixing it in Excel must fire a new change
        setFile(picked);
        setReport(null);
        setImported(null);
        if (!picked) return;
        setIsPreviewing(true);
        try {
            const res = await associatesService.previewImport(picked);
            setReport(res.data);
        } catch (err) {
            setFile(null);
            showError(err);
        } finally {
            setIsPreviewing(false);
        }
    };

    const confirm = async () => {
        if (!canConfirm || !file) return;
        setIsSaving(true);
        try {
            const res = await associatesService.importFile(file);
            setReport(res.data);
            if (res.data.imported > 0) {
                setImported(res.data.imported);
                onImported();
            }
        } catch (err) {
            showError(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            onSubmit={confirm}
            size="3xl"
            title="Importar asociados desde CSV"
            icon={<Upload className="text-primary" size={20} />}
            footer={imported !== null ? (
                <Button variant="outline" onClick={onClose}>Cerrar</Button>
            ) : (
                <>
                    <Button type="submit" isLoading={isSaving} disabled={!canConfirm}>Confirmar</Button>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                </>
            )}
        >
            {imported !== null ? (
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    <p className="font-semibold">Se importaron {imported} asociados.</p>
                    <p>Los importados quedan como aspirantes, sin documento ni consentimiento. Regístralos persona por persona desde el detalle de cada asociado.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <Button variant="outline" icon={Download} onClick={() => exportToCsv([], TEMPLATE_COLUMNS, 'plantilla-asociados')}>
                            Descargar plantilla
                        </Button>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Separado por ";", máximo 1 MB y 200 filas.</p>
                    </div>
                    <Input
                        label="Archivo CSV"
                        type="file"
                        accept=".csv"
                        disabled={isPreviewing || isSaving}
                        hint={isPreviewing ? 'Validando…' : file?.name}
                        onChange={choose}
                    />
                    {report && (<>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {report.validCount} filas válidas, {report.errorCount} con error
                        </p>
                        <div className="max-h-80 overflow-auto">
                            <table className={TABLE_CLASS}>
                                <thead className={THEAD_CLASS}>
                                    <tr>
                                        <th className={TH}>Fila</th>
                                        <th className={TH}>Nombre</th>
                                        <th className={TH}>Email</th>
                                        <th className={TH}>Errores</th>
                                    </tr>
                                </thead>
                                <tbody className={`${TBODY_CLASS} text-slate-900 dark:text-white`}>
                                    {report.rows.map((row) => (
                                        <tr key={row.rowNumber}>
                                            <td className={TD}>{row.rowNumber}</td>
                                            <td className={TD}>{row.name}</td>
                                            <td className={TD}>{row.email}</td>
                                            <td className={`${TD} text-rose-600 dark:text-rose-400`}>{row.errors.join('. ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>)}
                </div>
            )}
        </Modal>
    );
};
