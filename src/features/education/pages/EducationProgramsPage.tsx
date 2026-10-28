import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, PageContainer, PageHeader, LoadingBlock, TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TH_CLASS as TH, TD_CLASS as TD, TH_ACTIONS_CLASS, TR_CLASS, TD_TRUNCATE_CLASS, IconButton, TableActions, SELECT_CLASS, EmptyState } from '../../../shared/ui';
import { useModal, useConfirm } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { educationService } from '../../../shared/api';
import type { EducationProgramDto, ProgramType } from '../../../shared/api/types';
import { educationProgramPath } from '../../../shared/config/constants';
import { errorText, formatDate, needsLocalToast } from '../../associates/labels';
import { PROGRAM_TYPE_LABELS } from '../labels';

const selectCls = SELECT_CLASS;

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
        <PageContainer>
            <PageHeader
                title="Educación cooperativa"
                description="Programas de formación e inscripción de asociados."
                actions={<Button icon={GraduationCap} onClick={() => openForm(null)}>Nuevo programa</Button>}
            />

            <Card padding="none" className="overflow-hidden">
                {isLoading ? (
                    <LoadingBlock />
                ) : items.length === 0 ? (
                    <EmptyState title="Aún no hay programas" description="Crea un programa de educación cooperativa para empezar a inscribir asociados." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH}>Nombre</th>
                                    <th className={TH}>Tipo</th>
                                    <th className={TH}>Horas requeridas</th>
                                    <th className={TH}>Inicio</th>
                                    <th className={TH}>Fin</th>
                                    <th className={TH_ACTIONS_CLASS}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className={`${TBODY_CLASS} text-slate-900 dark:text-white`}>
                                {items.map((p) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => navigate(educationProgramPath(p.id))}
                                        className={`cursor-pointer ${TR_CLASS}`}
                                    >
                                        <td className={`${TD} font-semibold`}><span className={TD_TRUNCATE_CLASS} title={p.name}>{p.name}</span></td>
                                        <td className={TD}><Badge variant="info">{PROGRAM_TYPE_LABELS[p.type]}</Badge></td>
                                        <td className={TD}>{p.requiredHours} h</td>
                                        <td className={TD}>{formatDate(p.startDate)}</td>
                                        <td className={TD}>{formatDate(p.endDate)}</td>
                                        <TableActions>
                                            <IconButton icon={Pencil} label={`Editar ${p.name}`} onClick={() => openForm(p)} />
                                            <IconButton icon={Trash2} label={`Eliminar ${p.name}`} variant="danger" onClick={() => remove(p)} />
                                        </TableActions>
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
        </PageContainer>
    );
};
