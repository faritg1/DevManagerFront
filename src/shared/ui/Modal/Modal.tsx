import React from 'react';
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

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    size = 'md',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-0" 
                    onClick={onClose}
                    aria-hidden="true"
                />
                
                {/* Centering trick for older browsers */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>
                
                {/* Modal Panel */}
                <div 
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
                    {/* Header */}
                    {title && (
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-[#233948] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {icon}
                                {title}
                            </h3>
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b22]"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    
                    {/* Body */}
                    <div className="px-6 py-6">
                        {children}
                    </div>
                    
                    {/* Footer */}
                    {footer && (
                        <div className="bg-slate-50 dark:bg-[#111b22]/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-slate-200 dark:border-[#233948]">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
