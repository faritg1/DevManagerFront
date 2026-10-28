import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, UserPlus } from 'lucide-react';
import { Button, Card, Badge, PageContainer, PageHeader, TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TH_CLASS as TH, TD_CLASS as TD, LoadingBlock, EmptyState } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { associatesService, educationService } from '../../../shared/api';
import type { AssociateDto, EducationProgramDto, EnrollmentDto } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';
import { errorText, formatDate, needsLocalToast } from '../../associates/labels';
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_STATUS_VARIANTS, PROGRAM_TYPE_LABELS } from '../labels';
import { EnrollmentHoursForm, type EnrollmentFormValue } from '../components/EnrollmentHoursForm';

export const ProgramDetailPage: React.FC = () => {
    const { programId = '' } = useParams<{ programId: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [program, setProgram] = useState<EducationProgramDto | null>(null);
    const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<EnrollmentDto | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const toast = useCallback((e: unknown) => {
        if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
    }, [showNotification]);

    const load = useCallback(async () => {
        try {
            const [p, en] = await Promise.all([educationService.getProgram(programId), educationService.getEnrollments(programId)]);
            setProgram(p.data ?? null);
            setEnrollments(en.data ?? []);
        } catch (e) {
            toast(e);
        } finally {
            setIsLoading(false);
        }
    }, [programId, toast]);

    useEffect(() => { load(); }, [load]);

    const openForm = async (en: EnrollmentDto | null) => {
        setEditing(en);
        setFormOpen(true);
        if (!en) {
            try {
                const res = await associatesService.getAll();
                const enrolled = new Set(enrollments.map((x) => x.userId));
                setAssociates((res.data ?? []).filter((a) => a.status !== 4 && !enrolled.has(a.userId)));
            } catch (e) {
                toast(e);
            }
        }
    };

    const submit = async (v: EnrollmentFormValue) => {
        setIsSaving(true);
        try {
            const res = editing
                ? await educationService.updateEnrollment(editing.id, { status: v.status, hoursCompleted: v.hoursCompleted, completionDate: v.completionDate })
                : await educationService.enroll(programId, v);
            if (res.success) {
                showNotification({ type: 'success', message: editing ? 'Inscripción actualizada' : 'Asociado inscrito' });
                setFormOpen(false);
                await load();
            }
        } catch (e) {
            toast(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <PageContainer>
                <LoadingBlock className="py-20" />
            </PageContainer>
        );
    }
    if (!program) {
        return (
            <PageContainer>
                <p className="text-sm text-slate-500 text-center py-6 dark:text-slate-400">Programa no encontrado.</p>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                before={<Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.EDUCATION)}>Volver</Button>}
                title={program.name}
                description={<>
                    <Badge variant="info">{PROGRAM_TYPE_LABELS[program.type]}</Badge>{' '}
                    {program.requiredHours} h requeridas · {formatDate(program.startDate)} – {formatDate(program.endDate)}
                </>}
                actions={<Button icon={UserPlus} onClick={() => openForm(null)}>Inscribir asociado</Button>}
            />

            <Card padding="md">
                {enrollments.length === 0 ? (
                    <EmptyState title="Aún no hay inscripciones" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH}>Asociado</th>
                                    <th className={TH}>Estado</th>
                                    <th className={TH}>Horas</th>
                                    <th className={TH}>Finalización</th>
                                    <th className={TH} />
                                </tr>
                            </thead>
                            <tbody className={`${TBODY_CLASS} text-slate-900 dark:text-white`}>
                                {enrollments.map((en) => (
                                    <tr key={en.id}>
                                        <td className={`${TD} font-semibold`}>{en.fullName}</td>
                                        <td className={TD}><Badge variant={ENROLLMENT_STATUS_VARIANTS[en.status]}>{ENROLLMENT_STATUS_LABELS[en.status]}</Badge></td>
                                        <td className={TD}>{en.hoursCompleted} / {program.requiredHours} h</td>
                                        <td className={TD}>{formatDate(en.completionDate)}</td>
                                        <td className={`${TD} text-right`}>
                                            <Button variant="outline" size="sm" icon={Pencil} onClick={() => openForm(en)}>Actualizar</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {formOpen && (
                <EnrollmentHoursForm
                    enrollment={editing}
                    associates={associates}
                    isSaving={isSaving}
                    onClose={() => setFormOpen(false)}
                    onSubmit={submit}
                />
            )}
        </PageContainer>
    );
};
