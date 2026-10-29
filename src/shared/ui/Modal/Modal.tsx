import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    /** Wraps body and footer in a <form>: Enter submits and native `required` checks run. Give the primary button type="submit". */
    onSubmit?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
    /** "drawer" docks a full-height panel to the right; its body has no padding and fills the height. */
    variant?: 'dialog' | 'drawer';
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

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    onSubmit,
    size = 'md',
    variant = 'dialog',
}) => {
    const drawer = variant === 'drawer';
    const titleId = useId();
    // Ref para que un onClose nuevo en cada render no reordene la pila.
    const onCloseRef = useRef(onClose);
    const dialogRef = useRef<HTMLDivElement>(null);
    // The opener is read during render: by effect time an [autoFocus] child already holds focus.
    const openerRef = useRef<HTMLElement | null>(null);
    const wasOpen = useRef(false);
    if (isOpen !== wasOpen.current) {
        wasOpen.current = isOpen;
        if (isOpen) openerRef.current = document.activeElement as HTMLElement | null;
    }
    useEffect(() => { onCloseRef.current = onClose; });

    useEffect(() => {
        if (!isOpen) return;
        const entry = {};
        openModals.push(entry);
        const opener = openerRef.current;
        const dialog = dialogRef.current;
        const focusables = () => (dialog ? [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null) : []);
        // Focus the first control of the content (an [autoFocus] child already wins), else any control, else the dialog.
        if (dialog && !dialog.contains(document.activeElement)) {
            const first = dialog.querySelector<HTMLElement>(`[data-modal-body] :is(${FOCUSABLE})`) ?? focusables()[0] ?? dialog;
            first.focus();
        }
        const onKey = (e: KeyboardEvent) => {
            // Con modales apilados, Escape y Tab sólo actúan sobre el último abierto.
            if (openModals[openModals.length - 1] !== entry) return;
            if (e.key === 'Escape') onCloseRef.current();
            if (e.key !== 'Tab' || !dialog) return;
            const items = focusables();
            if (items.length === 0) { e.preventDefault(); dialog.focus(); return; }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === first || !dialog.contains(active))) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && (active === last || !dialog.contains(active))) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            openModals.splice(openModals.indexOf(entry), 1);
            if (opener?.isConnected) opener.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const content = (
        <>
            <div data-modal-body className={drawer ? 'flex min-h-0 flex-1 flex-col' : 'px-4 py-5 sm:px-6 sm:py-6'}>
                {children}
            </div>

            {footer && (
                <div className="bg-slate-50 dark:bg-background-dark/50 px-4 sm:px-6 py-4 flex flex-row-reverse flex-wrap gap-3 border-t border-slate-200 dark:border-border-dark">
                    {footer}
                </div>
            )}
        </>
    );

    const header = title && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-border-dark flex items-center justify-between gap-3">
            <h3 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
                {icon}
                {title}
            </h3>
            <button type="button" aria-label="Cerrar"
                onClick={onClose}
                className="shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-background-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <X size={20} />
            </button>
        </div>
    );

    const backdrop = (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-0"
            onClick={onClose}
            aria-hidden="true"
        />
    );

    const dialogProps = {
        ref: dialogRef,
        tabIndex: -1,
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': title ? titleId : undefined,
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
    } as const;

    if (drawer) {
        return (
            <div className="fixed inset-0 z-50">
                {backdrop}
                <div
                    {...dialogProps}
                    className={`fixed inset-y-0 right-0 z-20 flex w-full ${sizeStyles[size]} flex-col bg-white dark:bg-card-dark border-l border-slate-200 dark:border-border-dark shadow-2xl focus:outline-none`}
                >
                    {header}
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
                {backdrop}
                
                {/* Centering trick for older browsers */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>
                
                <div
                    {...dialogProps}
                    className={`
                        inline-block align-bottom bg-white dark:bg-card-dark 
                        rounded-2xl text-left overflow-hidden 
                        shadow-2xl transform transition-all 
                        sm:my-8 sm:align-middle ${sizeStyles[size]} w-full 
                        border border-slate-200 dark:border-border-dark 
                        relative z-20 focus:outline-none
                    `}
                >
                    {header}
                    
                    {onSubmit ? <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>{content}</form> : content}
                </div>
            </div>
        </div>
    );
};

