import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-4xl',
    '4xl': 'max-w-6xl',
    full: 'w-[90%] max-w-7xl',
};

// Pila de modales abiertos (orden de apertura), compartida por todas las instancias.
const openModals: object[] = [];

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    size = 'md',
}) => {
    const titleId = useId();
    // Ref para que un onClose nuevo en cada render no reordene la pila.
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });

    useEffect(() => {
        if (!isOpen) return;
        const entry = {};
        openModals.push(entry);
        // Con modales apilados, Escape cierra sólo el último abierto.
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && openModals[openModals.length - 1] === entry) onCloseRef.current();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            openModals.splice(openModals.indexOf(entry), 1);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-0" 
                    onClick={onClose}
                    aria-hidden="true"
                />
                
                {/* Centering trick for older browsers */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>
                
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? titleId : undefined}
                    className={`
                        inline-block align-bottom bg-white dark:bg-[#16222b] 
                        rounded-2xl text-left overflow-hidden 
                        shadow-2xl transform transition-all 
                        sm:my-8 sm:align-middle ${sizeStyles[size]} w-full 
                        border border-slate-200 dark:border-[#233948] 
                        relative z-20
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {title && (
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-[#233948] flex items-center justify-between gap-3">
                            <h3 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
                                {icon}
                                {title}
                            </h3>
                            <button aria-label="Cerrar" 
                                onClick={onClose}
                                className="shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    
                    <div className="px-4 py-5 sm:px-6 sm:py-6">
                        {children}
                    </div>
                    
                    {footer && (
                        <div className="bg-slate-50 dark:bg-[#111b22]/50 px-4 sm:px-6 py-4 flex flex-row-reverse flex-wrap gap-3 border-t border-slate-200 dark:border-[#233948]">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

