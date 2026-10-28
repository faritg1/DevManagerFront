import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, Badge, PageContainer, PageHeader, LoadingBlock, EmptyState } from '../../../shared/ui';
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

    const backButton = (
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.ASSOCIATES)}>Volver</Button>
    );

    if (isLoading) {
        return (
            <PageContainer>
                <LoadingBlock className="py-20" />
            </PageContainer>
        );
    }
    if (!data) {
        return (
            <PageContainer className="space-y-4">
                <EmptyState title="No encontramos este asociado" description="Puede que se haya eliminado o que el enlace no sea correcto." />
                {backButton}
            </PageContainer>
        );
    }

    return (
        <PageContainer className="space-y-6">
            <PageHeader
                before={backButton}
                title={data.fullName}
                description={`${data.email} · ${ROLE_LABELS[data.role]}`}
                actions={<>
                    <Badge variant={STATUS_VARIANTS[data.status]}>{STATUS_LABELS[data.status]}</Badge>
                    {ALLOWED_TRANSITIONS[data.status].map((s) => (
                        <Button key={s} size="sm" variant={s === 4 ? 'danger' : 'primary'} onClick={() => setTarget(s)}>
                            {ACTION_LABELS[s]}
                        </Button>
                    ))}
                </>}
            />

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
        </PageContainer>
    );
};
