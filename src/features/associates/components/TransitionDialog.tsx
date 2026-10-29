import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '../../../shared/ui';
import type { AssociateStatus } from '../../../shared/api/types';
import { STATUS_LABELS } from '../labels';

interface Props {
    isOpen: boolean;
    toStatus: AssociateStatus | null;
    isSaving: boolean;
    onClose: () => void;
    onConfirm: (data: { effectiveDate?: string; reason?: string }) => void;
}

export const TransitionDialog: React.FC<Props> = ({ isOpen, toStatus, isSaving, onClose, onConfirm }) => {
    const [effectiveDate, setEffectiveDate] = useState('');
    const [reason, setReason] = useState('');
    const isWithdraw = toStatus === 4;
    const canSubmit = !isWithdraw || reason.trim().length > 0;

    if (!isOpen || toStatus === null) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Cambiar a ${STATUS_LABELS[toStatus]}`}
            onSubmit={() => {
                if (!canSubmit || isSaving) return;
                onConfirm({ effectiveDate: effectiveDate || undefined, reason: reason.trim() || undefined });
            }}
            footer={
                <>
                    <Button type="submit" isLoading={isSaving} variant={isWithdraw ? 'danger' : 'primary'}>
                        Confirmar
                    </Button>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Fecha efectiva (opcional, por defecto hoy)"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                />
                {isWithdraw && (
                    <Textarea
                        label="Motivo del retiro *"
                        required
                        value={reason}
                        maxLength={400}
                        rows={3}
                        hint={`${reason.length}/400`}
                        onChange={(e) => setReason(e.target.value)}
                    />
                )}
            </div>
        </Modal>
    );
};
