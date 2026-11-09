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
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-100 hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-white/5 dark:hover:border-input-border',
    ghost: 'bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm',
    outline: 'bg-transparent border border-slate-300 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
};

const BASE_STYLES = 'inline-flex items-center justify-center whitespace-nowrap font-semibold rounded-xl transition-[color,background-color,border-color,box-shadow,transform] duration-[120ms] ease-standard active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 [@media(pointer:coarse)]:min-h-11';

/** Button look for a non-button element (e.g. a router <Link>), so actions never nest a <button> inside an <a>. */
export const buttonClasses = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = '') =>
    `${BASE_STYLES} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

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
    const iconSize = iconSizes[size];

    return (
        <button
            type={type}
            className={buttonClasses(variant, size, `${fullWidth ? 'w-full' : ''} ${className}`)}
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
