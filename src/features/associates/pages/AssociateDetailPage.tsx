import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { associatesService } from '../../../shared/api';
import type { AssociateDetailDto, AssociateStatus } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';
import { ALLOWED_TRANSITIONS, ROLE_LABELS, STATUS_LABELS, STATUS_VARIANTS, errorText, needsLocalToast } from '../labels';
import { TransitionDialog } from '../components/TransitionDialog';
import { MembershipPeriodsTable } from '../components/MembershipPeriodsTable';
import { DocumentForm } from '../components/DocumentForm';
import { ConsentsPanel } from '../components/ConsentsPanel';

// Etiqueta de la acción según el estado destino
const ACTION_LABELS: Record<AssociateStatus, string> = {
    1: 'Readmitir (nueva solicitud)',
    2: 'Activar',
    3: 'Suspender',
    4: 'Retirar',
};

export const AssociateDetailPage: React.FC = () => {
    const { userId = '' } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [data, setData] = useState<AssociateDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [target, setTarget] = useState<AssociateStatus | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await associatesService.getById(userId);
            setData(res.data);
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setIsLoading(false);
        }
    }, [userId, showNotification]);

    useEffect(() => { load(); }, [load]);

    const confirmTransition = async (form: { effectiveDate?: string; reason?: string }) => {
        if (target === null) return;
        setIsSaving(true);
        try {
            const res = await associatesService.transition(userId, { toStatus: target, ...form });
            if (res.success) {
                showNotification({ type: 'success', message: `Estado actualizado a ${STATUS_LABELS[res.data.status]}` });
                res.data.warnings?.forEach((w) => showNotification({ type: 'warning', message: w }));
                setTarget(null);
                await load();
            }
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
    if (!data) {
        return (
            <div className="space-y-4">
                <p className="text-slate-500">No se encontró el asociado.</p>
                <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(ROUTES.ASSOCIATES)}>Volver</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(ROUTES.ASSOCIATES)}>Volver</Button>

            <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data.fullName}</h1>
                        <p className="text-sm text-slate-500">{data.email} · {ROLE_LABELS[data.role]}</p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[data.status]}>{STATUS_LABELS[data.status]}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    {ALLOWED_TRANSITIONS[data.status].map((s) => (
                        <Button key={s} size="sm" variant={s === 4 ? 'danger' : 'primary'} onClick={() => setTarget(s)}>
                            {ACTION_LABELS[s]}
                        </Button>
                    ))}
                </div>
            </Card>

            <Card padding="md">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Periodos de membresía</h2>
                <MembershipPeriodsTable periods={data.periods} />
            </Card>

            <Card padding="md">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Documento de identidad</h2>
                <DocumentForm
                    key={`${data.documentType}-${data.documentNumber}-${data.hasActiveConsent}`}
                    userId={data.userId}
                    documentType={data.documentType}
                    documentNumber={data.documentNumber}
                    hasActiveConsent={data.hasActiveConsent}
                    onSaved={load}
                />
            </Card>

            <Card padding="md">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Consentimiento de datos (Habeas Data)</h2>
                <ConsentsPanel userId={data.userId} onChanged={load} />
            </Card>

            {target !== null && (
                <TransitionDialog
                    isOpen
                    toStatus={target}
                    isSaving={isSaving}
                    onClose={() => setTarget(null)}
                    onConfirm={confirmTransition}
                />
            )}
        </div>
    );
};
