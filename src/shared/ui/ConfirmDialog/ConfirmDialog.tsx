import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';

export interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'warning',
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title || 'Confirmar'}
            size="sm"
            icon={
                type === 'warning' ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6 text-rose-500"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.82-2.8l-6.93-12.02a2 2 0 00-3.64 0L3.25 16.2A2 2 0 005.07 19z"
                        />
                    </svg>
                ) : null
            }
            footer={
                <>
                    <Button
                        variant={type === 'warning' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                    <Button variant="outline" onClick={onCancel}>
                        {cancelText}
                    </Button>
                </>
            }
        >
            <div className="text-slate-700 dark:text-slate-300">{message}</div>
        </Modal>
    );
};

export default ConfirmDialog;
