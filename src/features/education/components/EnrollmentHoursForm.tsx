import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '../../../shared/ui';
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
    isSaving: boolean;
    onClose: () => void;
    onSubmit: (value: EnrollmentFormValue) => void;
}

/** Se monta solo mientras está abierto (el padre lo renderiza condicionalmente) para reiniciar el estado. */
export const EnrollmentHoursForm: React.FC<Props> = ({ enrollment, associates, isSaving, onClose, onSubmit }) => {
    const [userId, setUserId] = useState(enrollment?.userId ?? '');
    const [status, setStatus] = useState<EnrollmentStatus>(enrollment?.status ?? 1);
    const [hours, setHours] = useState(String(enrollment?.hoursCompleted ?? 0));
    const [completionDate, setCompletionDate] = useState(enrollment?.completionDate ?? '');

    const hoursNum = Number(hours);
    const valid = !!userId && hours !== '' && hoursNum >= 0 && (status !== 2 || !!completionDate);

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={enrollment ? `Actualizar inscripción de ${enrollment.fullName}` : 'Inscribir asociado'}
            onSubmit={() => {
                if (!valid || isSaving) return;
                onSubmit({ userId, status, hoursCompleted: hoursNum, completionDate: status === 2 ? completionDate : undefined });
            }}
            footer={
                <>
                    <Button type="submit" isLoading={isSaving}>Guardar</Button>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                </>
            }
        >
            <div className="space-y-4">
                {!enrollment && (
                    <Select label="Asociado *" required value={userId} onChange={(e) => setUserId(e.target.value)}>
                        <option value="">— Selecciona un asociado —</option>
                        {associates.map((a) => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                    </Select>
                )}
                <Select label="Estado *" required value={status} onChange={(e) => setStatus(Number(e.target.value) as EnrollmentStatus)}>
                    {Object.entries(ENROLLMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Input label="Horas completadas *" required type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
                {status === 2 && (
                    <Input label="Fecha de finalización *" required type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
                )}
            </div>
        </Modal>
    );
};
