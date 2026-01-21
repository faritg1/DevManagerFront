import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
    sm: 'h-9 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    hint,
    icon: Icon,
    iconPosition = 'left',
    inputSize = 'md',
    className = '',
    ...props
}, ref) => {
    const hasIcon = !!Icon;
    const paddingLeft = hasIcon && iconPosition === 'left' ? 'pl-11' : 'pl-4';
    const paddingRight = hasIcon && iconPosition === 'right' ? 'pr-11' : 'pr-4';

    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label className="text-slate-700 dark:text-white text-sm font-bold">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    ref={ref}
                    className={`
                        w-full rounded-xl border 
                        ${error 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-300 dark:border-[#233948] focus:ring-primary focus:border-primary dark:focus:border-primary'
                        }
                        bg-slate-50 dark:bg-[#111b22] 
                        text-slate-900 dark:text-white 
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                        ${paddingLeft} ${paddingRight}
                        outline-none focus:ring-1 transition-all
                        ${sizeStyles[inputSize]}
                        ${className}
                    `}
                    {...props}
                />
                {Icon && (
                    <Icon 
                        className={`
                            absolute top-1/2 -translate-y-1/2 
                            ${iconPosition === 'left' ? 'left-3.5' : 'right-3.5'}
                            text-slate-400 group-focus-within:text-primary transition-colors
                        `} 
                        size={20} 
                    />
                )}
            </div>
            {error && (
                <span className="text-rose-500 text-xs font-medium">{error}</span>
            )}
            {hint && !error && (
                <span className="text-slate-500 text-xs">{hint}</span>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
