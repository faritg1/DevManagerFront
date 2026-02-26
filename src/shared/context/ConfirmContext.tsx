import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog/ConfirmDialog';

export interface ConfirmOptions {
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'info';
}

interface ConfirmContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolver, setResolver] = useState<(val: boolean) => void>();

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve);
        });
    }, []);

    const handleResult = (result: boolean) => {
        if (resolver) resolver(result);
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {options && (
                <ConfirmDialog
                    isOpen={true}
                    title={options.title}
                    message={options.message}
                    confirmText={options.confirmText}
                    cancelText={options.cancelText}
                    type={options.type || 'warning'}
                    onConfirm={() => handleResult(true)}
                    onCancel={() => handleResult(false)}
                />
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = (): ConfirmContextValue => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export default ConfirmContext;
