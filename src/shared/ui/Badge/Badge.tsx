import React from 'react';
import { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    icon?: LucideIcon;
    dot?: boolean;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-600/30',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    danger: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-slate-500',
    success: 'bg-emerald-500',
    warning: 'bg-orange-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
};

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    children,
    icon: Icon,
    dot = false,
    className = '',
}) => {
    return (
        <span 
            className={`
                inline-flex items-center gap-1.5 
                px-2.5 py-1 
                rounded-full 
                text-xs font-bold 
                border
                ${variantStyles[variant]}
                ${className}
            `}
        >
            {dot && (
                <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />
            )}
            {Icon && <Icon size={12} />}
            {children}
        </span>
    );
};

export default Badge;
