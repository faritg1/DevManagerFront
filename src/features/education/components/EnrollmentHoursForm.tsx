import React, { useState } from 'react';
import { FormPanel, FormSection, Input, Select } from '../../../shared/ui';
import type { AssociateDto, EnrollmentDto, EnrollmentStatus } from '../../../shared/api/types';
import { ENROLLMENT_STATUS_LABELS } from '../labels';

export interface EnrollmentFormValue {
    userId: string;
    status: EnrollmentStatus;
    hoursCompleted: number;
    completionDate?: string;
}

interface Props {
    /** Inscripción a editar; si es null se inscribe un asociado nuevo */
    enrollment: EnrollmentDto | null;
    associates: AssociateDto[];
    onClose: () => void;
    /** Saves the enrollment; it must reject on an API error so the panel shows it. */
    onSubmit: (value: EnrollmentFormValue) => Promise<void>;
}

/** Se monta solo mientras está abierto (el padre lo renderiza condicionalmente) para reiniciar el estado. */
export const EnrollmentHoursForm: React.FC<Props> = ({ enrollment, associates, onClose, onSubmit }) => {
    const [userId, setUserId] = useState(enrollment?.userId ?? '');
    const [status, setStatus] = useState<EnrollmentStatus>(enrollment?.status ?? 1);
    const [hours, setHours] = useState(String(enrollment?.hoursCompleted ?? 0));
    const [completionDate, setCompletionDate] = useState(enrollment?.completionDate ?? '');

    const hoursNum = Number(hours);
    const valid = !!userId && hours !== '' && hoursNum >= 0 && (status !== 2 || !!completionDate);

    return (
        <FormPanel
            isOpen
            onClose={onClose}
            title={enrollment ? `Actualizar inscripción de ${enrollment.fullName}` : 'Inscribir asociado'}
            onSubmit={async () => {
                if (!valid) return;
                await onSubmit({ userId, status, hoursCompleted: hoursNum, completionDate: status === 2 ? completionDate : undefined });
            }}
        >
            <FormSection>
                {!enrollment && (
                    <Select label="Asociado *" name="userId" required value={userId} onChange={(e) => setUserId(e.target.value)}>
                        <option value="">— Selecciona un asociado —</option>
                        {associates.map((a) => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                    </Select>
                )}
                <Select label="Estado *" name="status" required value={status} onChange={(e) => setStatus(Number(e.target.value) as EnrollmentStatus)}>
                    {Object.entries(ENROLLMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Input label="Horas completadas *" name="hoursCompleted" required type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
                {status === 2 && (
                    <Input label="Fecha de finalización *" name="completionDate" required type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
                )}
            </FormSection>
        </FormPanel>
    );
};
