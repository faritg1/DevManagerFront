import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { SELECT_CLASS, TEXTAREA_CLASS } from '../formStyles';

const LABEL_CLASS = 'text-slate-700 dark:text-white text-sm font-bold';
const ERROR_BORDER = 'border-rose-500 dark:border-rose-500 focus:ring-rose-500 focus:border-rose-500';

interface FieldProps {
    label?: string;
    error?: string;
    hint?: string;
}

/** Ids and aria props that tie a control to its label, error and hint. */
const useField = (id: string | undefined, { error, hint }: FieldProps, describedBy?: string) => {
    const autoId = useId();
    const controlId = id ?? autoId;
    const messageId = `${controlId}-msg`;
    const message = error || hint;
    const ids = [describedBy, message ? messageId : undefined].filter(Boolean).join(' ');
    return {
        controlId,
        messageId,
        aria: { 'aria-invalid': error ? true : undefined, 'aria-describedby': ids || undefined },
    };
};

/** Label + control + error/hint layout shared by Input, Select and Textarea. */
const Field: React.FC<FieldProps & { controlId: string; messageId: string; children: React.ReactNode }> = ({
    label, error, hint, controlId, messageId, children,
}) => (
    <div className="flex flex-col gap-2 w-full">
        {label && <label htmlFor={controlId} className={LABEL_CLASS}>{label}</label>}
        {children}
        {error && <span id={messageId} className="text-rose-500 text-xs font-medium">{error}</span>}
        {hint && !error && <span id={messageId} className="text-slate-500 dark:text-slate-400 text-xs">{hint}</span>}
    </div>
);

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldProps {
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
    sm: 'h-9 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
};

/** Text input with label, error and hint; `type="password"` adds a show/hide toggle. */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    hint,
    icon: Icon,
    iconPosition = 'left',
    inputSize = 'md',
    className = '',
    id,
    type,
    'aria-describedby': describedBy,
    ...props
}, ref) => {
    const { controlId, messageId, aria } = useField(id, { error, hint }, describedBy);
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const paddingLeft = Icon && iconPosition === 'left' ? 'pl-11' : 'pl-4';
    const paddingRight = (Icon && iconPosition === 'right') || isPassword ? 'pr-11' : 'pr-4';

    return (
        <Field label={label} error={error} hint={hint} controlId={controlId} messageId={messageId}>
            <div className="relative group">
                <input
                    ref={ref}
                    id={controlId}
                    type={isPassword && revealed ? 'text' : type}
                    {...aria}
                    className={`
                        w-full rounded-xl border
                        ${error ? ERROR_BORDER : 'border-slate-300 dark:border-border-dark focus:ring-primary focus:border-primary dark:focus:border-primary'}
                        bg-slate-50 dark:bg-background-dark
                        text-slate-900 dark:text-white
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                        ${paddingLeft} ${paddingRight}
                        outline-none focus:ring-1 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${sizeStyles[inputSize]}
                        ${className}
                    `}
                    {...props}
                />
                {Icon && (
                    <Icon
                        aria-hidden="true"
                        className={`
                            absolute top-1/2 -translate-y-1/2 pointer-events-none
                            ${iconPosition === 'left' ? 'left-3.5' : 'right-3.5'}
                            text-slate-400 group-focus-within:text-primary transition-colors
                        `}
                        size={20}
                    />
                )}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed(r => !r)}
                        aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={revealed}
                        aria-controls={controlId}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {revealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                )}
            </div>
        </Field>
    );
});

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}

/** Native select with the same label/error/hint wiring as Input. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label, error, hint, id, className = '', 'aria-describedby': describedBy, children, ...props
}, ref) => {
    const { controlId, messageId, aria } = useField(id, { error, hint }, describedBy);
    return (
        <Field label={label} error={error} hint={hint} controlId={controlId} messageId={messageId}>
            <select ref={ref} id={controlId} {...aria} className={`${SELECT_CLASS} w-full ${error ? ERROR_BORDER : ''} ${className}`} {...props}>
                {children}
            </select>
        </Field>
    );
});

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

/** Textarea with the same label/error/hint wiring as Input. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    label, error, hint, id, className = '', 'aria-describedby': describedBy, ...props
}, ref) => {
    const { controlId, messageId, aria } = useField(id, { error, hint }, describedBy);
    return (
        <Field label={label} error={error} hint={hint} controlId={controlId} messageId={messageId}>
            <textarea ref={ref} id={controlId} {...aria} className={`${TEXTAREA_CLASS} ${error ? ERROR_BORDER : ''} ${className}`} {...props} />
        </Field>
    );
});

Textarea.displayName = 'Textarea';
