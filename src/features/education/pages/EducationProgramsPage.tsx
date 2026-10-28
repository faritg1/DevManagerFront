import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../../../shared/ui';
import { useModal, useConfirm } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { educationService } from '../../../shared/api';
import type { EducationProgramDto, ProgramType } from '../../../shared/api/types';
import { educationProgramPath } from '../../../shared/config/constants';
import { errorText, formatDate, needsLocalToast } from '../../associates/labels';
import { PROGRAM_TYPE_LABELS } from '../labels';

const selectCls = 'h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-3';

export const EducationProgramsPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const modal = useModal();
    const [items, setItems] = useState<EducationProgramDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editing, setEditing] = useState<EducationProgramDto | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<ProgramType>(1);
    const [hours, setHours] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const toast = useCallback((e: unknown) => {
        if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
    }, [showNotification]);

    const load = useCallback(async () => {
        try {
            const res = await educationService.getPrograms();
            setItems(res.data ?? []);
        } catch (e) {
            toast(e);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const openForm = (p: EducationProgramDto | null) => {
        setEditing(p);
        setName(p?.name ?? '');
        setType(p?.type ?? 1);
        setHours(p ? String(p.requiredHours) : '');
        setStartDate(p?.startDate ?? '');
        setEndDate(p?.endDate ?? '');
        modal.open();
    };

    const save = async () => {
        setIsSaving(true);
        const body = { name: name.trim(), type, requiredHours: Number(hours), startDate: startDate || undefined, endDate: endDate || undefined };
        try {
            const res = editing ? await educationService.updateProgram(editing.id, body) : await educationService.createProgram(body);
            if (res.success) {
                showNotification({ type: 'success', message: editing ? 'Programa actualizado' : 'Programa creado' });
                modal.close();
                await load();
            }
        } catch (e) {
            toast(e);
        } finally {
            setIsSaving(false);
        }
    };

    const remove = async (p: EducationProgramDto) => {
        const ok = await confirm({
            title: 'Eliminar programa',
            message: `¿Eliminar el programa "${p.name}"?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            type: 'warning',
        });
        if (!ok) return;
        try {
            await educationService.deleteProgram(p.id);
            showNotification({ type: 'success', message: 'Programa eliminado' });
            await load();
        } catch (e) {
            toast(e);
        }
    };

    const valid = name.trim().length > 0 && Number(hours) > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Educación cooperativa</h1>
                    <p className="text-sm text-slate-500">Programas de formación e inscripción de asociados.</p>
                </div>
                <Button icon={GraduationCap} onClick={() => openForm(null)}>Nuevo programa</Button>
            </div>

            <Card padding="md">
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Aún no hay programas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-[#233948]">
                                    <th className="py-2 pr-4">Nombre</th>
                                    <th className="py-2 pr-4">Tipo</th>
                                    <th className="py-2 pr-4">Horas requeridas</th>
                                    <th className="py-2 pr-4">Inicio</th>
                                    <th className="py-2 pr-4">Fin</th>
                                    <th className="py-2" />
                                </tr>
                            </thead>
                            <tbody className="text-slate-900 dark:text-white">
                                {items.map((p) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => navigate(educationProgramPath(p.id))}
                                        className="border-b border-slate-100 dark:border-[#233948]/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                    >
                                        <td className="py-3 pr-4 font-semibold">{p.name}</td>
                                        <td className="py-3 pr-4"><Badge variant="info">{PROGRAM_TYPE_LABELS[p.type]}</Badge></td>
                                        <td className="py-3 pr-4">{p.requiredHours} h</td>
                                        <td className="py-3 pr-4">{formatDate(p.startDate)}</td>
                                        <td className="py-3 pr-4">{formatDate(p.endDate)}</td>
                                        <td className="py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline" size="sm" icon={Pencil} onClick={() => openForm(p)}>Editar</Button>{' '}
                                            <Button variant="outline" size="sm" icon={Trash2} onClick={() => remove(p)}>Eliminar</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modal.isOpen}
                onClose={modal.close}
                title={editing ? 'Editar programa' : 'Nuevo programa'}
                footer={
                    <>
                        <Button isLoading={isSaving} disabled={!valid} onClick={save}>Guardar</Button>
                        <Button variant="outline" onClick={modal.close}>Cancelar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} />
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo *</label>
                        <select value={type} onChange={(e) => setType(Number(e.target.value) as ProgramType)} className={selectCls}>
                            {Object.entries(PROGRAM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <Input label="Horas requeridas *" type="number" min={1} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
                    <Input label="Fecha de inicio" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <Input label="Fecha de fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            </Modal>
        </div>
    );
};
