import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, PageContainer, PageHeader, LoadingBlock, TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TH_CLASS as TH, TD_CLASS as TD, TR_CLASS, TD_TRUNCATE_CLASS, SELECT_CLASS, SELECT_SM_CLASS, EmptyState } from '../../../shared/ui';
import { useModal } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { associatesService, usersService } from '../../../shared/api';
import type { AssociateDto, AssociateStatus, UserResponse } from '../../../shared/api/types';
import { associateDetailPath } from '../../../shared/config/constants';
import { DOCUMENT_TYPES, ROLE_LABELS, STATUS_LABELS, STATUS_VARIANTS, errorText, formatDate, needsLocalToast } from '../labels';

export const AssociatesPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const createModal = useModal();
    const [items, setItems] = useState<AssociateDto[]>([]);
    const [status, setStatus] = useState<AssociateStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [userId, setUserId] = useState('');
    const [applicationDate, setApplicationDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await associatesService.getAll(status || undefined);
            setItems(res.data ?? []);
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setIsLoading(false);
        }
    }, [status, showNotification]);

    useEffect(() => { load(); }, [load]);

    const openCreate = async () => {
        setUserId('');
        setApplicationDate('');
        createModal.open();
        try {
            const res = await usersService.getAll();
            setUsers(res.data ?? []);
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        }
    };

    const create = async () => {
        setIsSaving(true);
        try {
            const res = await associatesService.create({ userId, applicationDate: applicationDate || undefined });
            if (res.success) {
                showNotification({ type: 'success', message: 'Asociado creado' });
                createModal.close();
                navigate(associateDetailPath(userId));
            }
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setIsSaving(false);
        }
    };

    const associateIds = new Set(items.map((i) => i.userId));

    return (
        <PageContainer>
            <PageHeader
                title="Asociados"
                description="Ciclo de vida de membresía y consentimiento de datos."
                actions={<>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value ? (Number(e.target.value) as AssociateStatus) : '')}
                        className={SELECT_SM_CLASS}
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <Button icon={UserPlus} onClick={openCreate}>Nuevo asociado</Button>
                </>}
            />

            <Card padding="none" className="overflow-hidden">
                {isLoading ? (
                    <LoadingBlock />
                ) : items.length === 0 ? (
                    <EmptyState title="No hay asociados con este filtro" description="Prueba con otro estado o registra un asociado nuevo." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH}>Nombre</th>
                                    <th className={TH}>Documento</th>
                                    <th className={TH}>Estado</th>
                                    <th className={TH}>Rol</th>
                                    <th className={TH}>Ingreso vigente</th>
                                </tr>
                            </thead>
                            <tbody className={`${TBODY_CLASS} text-slate-900 dark:text-white`}>
                                {items.map((a) => (
                                    <tr
                                        key={a.userId}
                                        onClick={() => navigate(associateDetailPath(a.userId))}
                                        className={`cursor-pointer ${TR_CLASS}`}
                                    >
                                        <td className={`${TD} font-semibold`}><span className={TD_TRUNCATE_CLASS} title={a.fullName}>{a.fullName}</span></td>
                                        <td className={TD}>
                                            {a.documentNumber ? `${DOCUMENT_TYPES[a.documentType ?? 0] ?? ''} ${a.documentNumber}` : '—'}
                                        </td>
                                        <td className={TD}><Badge variant={STATUS_VARIANTS[a.status]}>{STATUS_LABELS[a.status]}</Badge></td>
                                        <td className={TD}>{ROLE_LABELS[a.role]}</td>
                                        <td className={TD}>{formatDate(a.currentAdmissionDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={createModal.isOpen}
                onClose={createModal.close}
                title="Nuevo asociado"
                icon={<UserPlus className="text-primary" size={20} />}
                footer={
                    <>
                        <Button isLoading={isSaving} disabled={!userId} onClick={create}>Crear</Button>
                        <Button variant="outline" onClick={createModal.close}>Cancelar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Usuario existente *</label>
                        <select
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="">— Selecciona un usuario —</option>
                            {users.filter((u) => !associateIds.has(u.id)).map((u) => (
                                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Fecha de solicitud (opcional, por defecto hoy)"
                        type="date"
                        value={applicationDate}
                        onChange={(e) => setApplicationDate(e.target.value)}
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};
