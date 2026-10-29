import React, { useState, useEffect, useCallback } from 'react';
import { FileLock2, FileText, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Input, Select, Modal, StatCard, PageContainer, PageHeader, LoadingBlock } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { habeasDataService, associatesService } from '../../../shared/api';
import type { ArcoRequestDto, ArcoType, AssociateDto, CreateArcoRequest } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';
import { formatDate } from '../../../shared/format';
import { AskAiButton } from '../../ai/AskAiButton';

const ARCO_TYPE_LABEL: Record<ArcoType, string> = {
    1: 'Acceso',
    2: 'Rectificación',
    3: 'Cancelación',
    4: 'Oposición',
};

const ARCO_STATUS: Record<number, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
    1: { label: 'Pendiente', variant: 'warning' },
    2: { label: 'Atendida', variant: 'success' },
    3: { label: 'Rechazada', variant: 'danger' },
};

/** Solicitudes ARCO. El consentimiento se gestiona en Políticas de datos y en el detalle del asociado. */
export const HabeasDataPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [requests, setRequests] = useState<ArcoRequestDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [arcoOpen, setArcoOpen] = useState(false);
    const [arcoForm, setArcoForm] = useState<CreateArcoRequest>({ type: 1, description: '' });

    const [answering, setAnswering] = useState<ArcoRequestDto | null>(null);
    const [answerAction, setAnswerAction] = useState<'atender' | 'rechazar'>('atender');
    const [answer, setAnswer] = useState('');
    const [saving, setSaving] = useState(false);

    /** Runs a modal submit with the button in loading state, ignoring repeat submits. */
    const submitting = (fn: () => Promise<void>) => async () => {
        if (saving) return;
        setSaving(true);
        try { await fn(); } finally { setSaving(false); }
    };

    const nameOf = (userId: string) =>
        associates.find(a => a.userId === userId)?.fullName || (userId === user?.id ? user?.name : 'Asociado no disponible');

    const loadRequests = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const res = isAdmin
                ? await habeasDataService.getPendingArco()
                : await habeasDataService.getArcoByUser(user.id);
            setRequests(res.success && res.data ? res.data : []);
        } catch {
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, user?.id]);

    useEffect(() => {
        if (isAdmin) {
            associatesService.getAll().then(res => setAssociates(res.success && res.data ? res.data : [])).catch(() => setAssociates([]));
        }
        loadRequests();
    }, [isAdmin, loadRequests]);

    const handleCreate = submitting(async () => {
        if (!arcoForm.description.trim()) return;
        try {
            const payload: CreateArcoRequest = { type: arcoForm.type, description: arcoForm.description.trim() };
            if (isAdmin && arcoForm.userId) payload.userId = arcoForm.userId;
            const res = await habeasDataService.createArco(payload);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: `Solicitud ARCO radicada: ${res.data.filingNumber}` });
                setArcoOpen(false);
                setArcoForm({ type: 1, description: '' });
                loadRequests();
            }
        } catch {
            // el listener global muestra el error
        }
    });


    const handleAnswer = submitting(async () => {
        if (!answering || !answer.trim()) return;
        try {
            const res = answerAction === 'atender'
                ? await habeasDataService.attendArco(answering.id, answer.trim())
                : await habeasDataService.rejectArco(answering.id, answer.trim());
            if (res.success) {
                showNotification({ type: 'success', message: answerAction === 'atender' ? 'Solicitud ARCO atendida' : 'Solicitud ARCO rechazada' });
                setAnswering(null);
                setAnswer('');
                loadRequests();
            }
        } catch (err) {
            if ((err as { status?: number })?.status === 409) {
                showNotification({ type: 'error', message: 'La solicitud ya fue respondida' });
                setAnswering(null);
                loadRequests();
            }
        }
    });


    const pendingCount = requests.filter(r => r.status === 1).length;

    return (
        <PageContainer>
            <PageHeader
                title="Habeas Data (ARCO)"
                description="Solicitudes de acceso, rectificación, cancelación y oposición (Ley 1581/2012)."
                actions={<><AskAiButton moduleKey="habeas_data" />
                <Button icon={FileText} onClick={() => { setArcoForm({ type: 1, description: '' }); setArcoOpen(true); }}>
                    Crear Solicitud ARCO
                </Button>
                </>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard title={isAdmin ? 'ARCO pendientes' : 'Mis solicitudes pendientes'} value={pendingCount} icon={FileText} iconColor="text-orange-500" iconBgColor="bg-orange-100 dark:bg-orange-500/10" />
                <Card>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={20} />
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Los consentimientos se gestionan por política versionada
                            {isAdmin && <> en <Link className="text-primary font-bold" to={ROUTES.DATA_POLICIES}>Políticas de datos</Link> y en el detalle de cada asociado</>}.
                        </p>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <FileLock2 className="text-orange-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {isAdmin ? 'Solicitudes ARCO Pendientes' : 'Mis Solicitudes ARCO'}
                    </h2>
                </div>
                {isLoading ? (
                    <LoadingBlock />
                ) : requests.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin solicitudes ARCO.</p>
                ) : (
                    <div className="space-y-3">
                        {requests.map(r => (
                            <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-background-dark">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {ARCO_TYPE_LABEL[r.type]} · <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{r.filingNumber}</span>
                                    </p>
                                    <Badge variant={ARCO_STATUS[r.status]?.variant ?? 'default'}>{ARCO_STATUS[r.status]?.label ?? r.status}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{nameOf(r.userId)} · {formatDate(r.requestedAt)}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{r.description}</p>
                                {r.response && (
                                    <p className="text-sm text-slate-500 mt-1 dark:text-slate-400"><span className="font-bold">Respuesta:</span> {r.response} ({formatDate(r.respondedAt)})</p>
                                )}
                                {isAdmin && r.status === 1 && (
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" onClick={() => { setAnswering(r); setAnswerAction('atender'); setAnswer(''); }}>
                                            <CheckCircle2 size={14} /> Atender
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => { setAnswering(r); setAnswerAction('rechazar'); setAnswer(''); }}>
                                            <XCircle size={14} /> Rechazar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={arcoOpen}
                onClose={() => setArcoOpen(false)}
                onSubmit={handleCreate}
                title="Crear Solicitud ARCO"
                icon={<FileLock2 className="text-orange-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Guardar</Button>
                        <Button variant="outline" onClick={() => setArcoOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    {isAdmin && (
                        <Select label="Asociado" value={arcoForm.userId ?? ''} onChange={(e) => setArcoForm(f => ({ ...f, userId: e.target.value || undefined }))}>
                            <option value="">Yo mismo</option>
                            {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                        </Select>
                    )}
                    <Select label="Tipo *" required value={arcoForm.type} onChange={(e) => setArcoForm(f => ({ ...f, type: Number(e.target.value) as ArcoType }))}>
                        {([1, 2, 3, 4] as ArcoType[]).map(t => <option key={t} value={t}>{ARCO_TYPE_LABEL[t]}</option>)}
                    </Select>
                    <Input label="Descripción *" required value={arcoForm.description} onChange={(e) => setArcoForm(f => ({ ...f, description: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={!!answering}
                onClose={() => setAnswering(null)}
                onSubmit={handleAnswer}
                title={answerAction === 'atender' ? 'Atender Solicitud ARCO' : 'Rechazar Solicitud ARCO'}
                icon={<FileLock2 className="text-orange-500" size={20} />}
                size="md"
                footer={
                    <>
                        {answerAction === 'atender'
                            ? <Button type="submit" isLoading={saving}>Atender</Button>
                            : <Button type="submit" variant="danger" isLoading={saving}>Rechazar</Button>}
                        <Button variant="outline" onClick={() => setAnswering(null)}>Cancelar</Button>
                    </>
                }
            >
                <Input label={answerAction === 'atender' ? 'Respuesta *' : 'Motivo de rechazo *'} required value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </Modal>
        </PageContainer>
    );
};

