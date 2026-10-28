import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, UserPlus } from 'lucide-react';
import { Button, Card, Badge } from '../../../shared/ui';
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

    if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;
    if (!program) return <p className="text-sm text-slate-500 text-center py-6">Programa no encontrado.</p>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.EDUCATION)}>Volver</Button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{program.name}</h1>
                    <p className="text-sm text-slate-500">
                        <Badge variant="info">{PROGRAM_TYPE_LABELS[program.type]}</Badge>{' '}
                        {program.requiredHours} h requeridas · {formatDate(program.startDate)} – {formatDate(program.endDate)}
                    </p>
                </div>
                <Button icon={UserPlus} onClick={() => openForm(null)}>Inscribir asociado</Button>
            </div>

            <Card padding="md">
                {enrollments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Aún no hay inscripciones.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-[#233948]">
                                    <th className="py-2 pr-4">Asociado</th>
                                    <th className="py-2 pr-4">Estado</th>
                                    <th className="py-2 pr-4">Horas</th>
                                    <th className="py-2 pr-4">Finalización</th>
                                    <th className="py-2" />
                                </tr>
                            </thead>
                            <tbody className="text-slate-900 dark:text-white">
                                {enrollments.map((en) => (
                                    <tr key={en.id} className="border-b border-slate-100 dark:border-[#233948]/50">
                                        <td className="py-3 pr-4 font-semibold">{en.fullName}</td>
                                        <td className="py-3 pr-4"><Badge variant={ENROLLMENT_STATUS_VARIANTS[en.status]}>{ENROLLMENT_STATUS_LABELS[en.status]}</Badge></td>
                                        <td className="py-3 pr-4">{en.hoursCompleted} / {program.requiredHours} h</td>
                                        <td className="py-3 pr-4">{formatDate(en.completionDate)}</td>
                                        <td className="py-3 text-right">
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
        </div>
    );
};
