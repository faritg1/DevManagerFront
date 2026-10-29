import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25',
    secondary: 'bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-background-dark',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25',
    outline: 'bg-transparent border border-slate-300 dark:border-border-dark text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-card-dark',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
};

const iconSizes: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

/** Defaults to type="button" so it never submits a form by accident; pass type="submit" for the primary action. */
export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    isLoading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    type = 'button',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap font-bold rounded-xl transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
    const iconSize = iconSizes[size];

    return (
        <button
            type={type}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
            {...props}
        >
            {/* While loading, the spinner takes the icon's place and the label stays, so the button keeps its width. */}
            {isLoading
                ? <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
                : Icon && iconPosition === 'left' && <Icon size={iconSize} aria-hidden="true" />}
            {children && <span className="inline-flex items-center gap-1.5">{children}</span>}
            {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSize} aria-hidden="true" />}
        </button>
    );
};
