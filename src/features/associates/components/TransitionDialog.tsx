import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../shared/ui';
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
            footer={
                <>
                    <Button
                        isLoading={isSaving}
                        disabled={!canSubmit}
                        variant={isWithdraw ? 'danger' : 'primary'}
                        onClick={() => onConfirm({
                            effectiveDate: effectiveDate || undefined,
                            reason: reason.trim() || undefined,
                        })}
                    >
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
                    <div className="flex flex-col gap-2">
                        <label htmlFor="transition-motivo-del-retiro" className="text-slate-700 dark:text-white text-sm font-bold">Motivo del retiro *</label>
                        <textarea id="transition-motivo-del-retiro"
                            value={reason}
                            maxLength={400}
                            rows={3}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white p-3 outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{reason.length}/400</span>
                    </div>
                )}
            </div>
        </Modal>
    );
};
