import React, { useEffect, useState } from 'react';
import { workItemsService, type TimeEntryResponse } from '../../../shared/api';
import { useToast } from '../../../shared/context';
import { formatDate } from '../../../shared/format';
import { useConfirm } from '../../../shared/hooks';
import { Button, Input, LoadingBlock } from '../../../shared/ui';
import { dayOf } from '../workItemMeta';

interface Props {
    itemId: string;
    /** May the user log hours (project not read-only). */
    canLog: boolean;
    userId?: string;
    /** Org admins may delete anyone's entry. */
    isAdmin?: boolean;
    /** Hours added (positive) or removed (negative), so the parent updates the item's spent hours. */
    onChange: (deltaHours: number) => void;
}

const today = () => new Date().toLocaleDateString('en-CA');

/** "Horas" tab of the activity detail: logged entries and a small form to log the caller's own time. */
export const WorkItemTimeEntries: React.FC<Props> = ({ itemId, canLog, userId, isAdmin, onChange }) => {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [entries, setEntries] = useState<TimeEntryResponse[] | null>(null);
    const [form, setForm] = useState({ workDate: today(), hours: '', note: '' });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setEntries(null);
        workItemsService.timeEntries(itemId).then((r) => setEntries(r.data ?? []), () => setEntries([]));
    }, [itemId]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await workItemsService.addTimeEntry(itemId, {
                workDate: form.workDate, hours: Number(form.hours), note: form.note.trim() || null,
            });
            setEntries((l) => [data, ...(l ?? [])].sort((a, b) => dayOf(b.workDate).localeCompare(dayOf(a.workDate))));
            setForm((f) => ({ ...f, hours: '', note: '' }));
            onChange(data.hours);
            toast.success('Horas registradas');
        } catch {
            // el listener global muestra el error
        } finally { setBusy(false); }
    };

    const remove = async (entry: TimeEntryResponse) => {
        if (!await confirm({ title: 'Eliminar registro', message: `¿Eliminar ${entry.hours} h del ${formatDate(entry.workDate)}?`, confirmText: 'Eliminar' })) return;
        try {
            await workItemsService.removeTimeEntry(entry.id);
            setEntries((l) => l?.filter((x) => x.id !== entry.id) ?? null);
            onChange(-entry.hours);
            toast.success('Registro eliminado');
        } catch {
            // el listener global muestra el error
        }
    };

    if (!entries) return <LoadingBlock label="Cargando horas…" />;

    return (<>
        {entries.length === 0 && <p className="text-sm text-slate-500">Aún no hay horas registradas.</p>}
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm dark:divide-border-dark dark:border-border-dark">
            {entries.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <span className="text-slate-500 dark:text-slate-400">{formatDate(t.workDate)}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{t.userName}</span>
                    <span className="font-medium">{t.hours} h</span>
                    {t.note && <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-400">{t.note}</span>}
                    {canLog && (t.userId === userId || isAdmin) && (
                        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void remove(t)}>Eliminar</Button>
                    )}
                </li>
            ))}
        </ul>
        {canLog && (
            <form onSubmit={(e) => void submit(e)} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
                <Input label="Fecha" type="date" required max={today()} value={form.workDate} onChange={(e) => setForm((f) => ({ ...f, workDate: e.target.value }))} />
                <Input label="Horas" type="number" required min={0.01} max={24} step={0.01} value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} />
                <div className="col-span-2">
                    <Input label="Nota" maxLength={500} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
                </div>
                <Button type="submit" isLoading={busy} className="col-span-2 sm:col-span-1">Registrar horas</Button>
            </form>
        )}
    </>);
};
