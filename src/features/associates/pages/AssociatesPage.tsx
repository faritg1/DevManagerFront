import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, Select, Pager, SearchInput, PageContainer, PageHeader, LoadingBlock, TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TH_CLASS as TH, TD_CLASS as TD, TR_CLASS, TD_TRUNCATE_CLASS, SELECT_SM_CLASS, EmptyState, ExportButton } from '../../../shared/ui';
import { useModal, usePagedFilter, usePermission } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { associatesService, usersService } from '../../../shared/api';
import type { AssociateDto, AssociateStatus, UserResponse } from '../../../shared/api/types';
import { associateDetailPath } from '../../../shared/config/constants';
import { DOCUMENT_TYPES, ROLE_LABELS, STATUS_LABELS, STATUS_VARIANTS, errorText, formatDate, needsLocalToast } from '../labels';
import { AskAiButton } from '../../ai/AskAiButton';
import type { CsvColumn } from '../../../shared/export';

const EXPORT_COLUMNS: CsvColumn<AssociateDto>[] = [
    { header: 'Nombre', value: (a) => a.fullName },
    { header: 'Tipo de documento', value: (a) => (a.documentNumber ? DOCUMENT_TYPES[a.documentType ?? 0] : '') },
    { header: 'Documento', value: (a) => a.documentNumber },
    { header: 'Estado', value: (a) => STATUS_LABELS[a.status] },
    { header: 'Rol', value: (a) => ROLE_LABELS[a.role] },
    { header: 'Ingreso vigente', value: (a) => (a.currentAdmissionDate ? formatDate(a.currentAdmissionDate) : '') },
];

export const AssociatesPage: React.FC = () => {
    const canCreate = usePermission().has('menu.solidarity.associates.create');
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
    const pager = usePagedFilter(items, { searchFields: a => [a.fullName, a.documentNumber] });

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
        if (isSaving) return;
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
                actions={<><AskAiButton moduleKey="associates" />{canCreate && <Button icon={UserPlus} onClick={openCreate}>Nuevo asociado</Button>}</>}
            />

            <Card padding="none" className="overflow-hidden">
                <div className={`${TD} border-b border-slate-200 dark:border-border-dark flex flex-col sm:flex-row sm:items-center gap-3`}>
                    <SearchInput pager={pager} label="Buscar por nombre o documento" />
                    <select
                        aria-label="Filtrar por estado"
                        value={status}
                        onChange={(e) => { setStatus(e.target.value ? (Number(e.target.value) as AssociateStatus) : ''); pager.setPage(1); }}
                        className={`${SELECT_SM_CLASS} sm:ml-auto`}
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ExportButton rows={pager.filtered} columns={EXPORT_COLUMNS} filename="asociados" />
                </div>
                {isLoading ? (
                    <LoadingBlock />
                ) : pager.total === 0 ? (
                    <EmptyState title="No hay asociados con este filtro" description="Prueba con otra búsqueda u otro estado, o registra un asociado nuevo." />
                ) : (<>
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
                                {pager.pageItems.map((a) => (
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
                    <Pager pager={pager} />
                </>)}
            </Card>

            <Modal
                isOpen={createModal.isOpen}
                onClose={createModal.close}
                onSubmit={create}
                title="Nuevo asociado"
                icon={<UserPlus className="text-primary" size={20} />}
                footer={
                    <>
                        <Button type="submit" isLoading={isSaving}>Crear</Button>
                        <Button variant="outline" onClick={createModal.close}>Cancelar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Select
                        label="Usuario existente *"
                        required
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                    >
                        <option value="">— Selecciona un usuario —</option>
                        {users.filter((u) => !associateIds.has(u.id)).map((u) => (
                            <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                        ))}
                    </Select>
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
