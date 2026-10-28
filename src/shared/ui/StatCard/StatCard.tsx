import React from 'react';
import { AlertTriangle, LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    /** Secondary KPI: smaller value and icon, for dense rows. */
    compact?: boolean;
    /** The value could not be loaded: shows "—" and this hint instead of a misleading number. */
    error?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-primary',
    iconBgColor = 'bg-blue-50 dark:bg-blue-500/10',
    trend,
    compact = false,
    error,
    className = '',
}) => (
    <div className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-border-dark dark:bg-card-dark dark:hover:border-input-border ${compact ? 'gap-2 p-4' : 'gap-4 p-5 sm:p-6'} ${className}`}>
        <div className="flex items-start justify-between gap-2">
            <p title={title} className={`min-w-0 flex-1 break-words font-bold uppercase leading-snug text-slate-500 dark:text-slate-400 ${compact ? 'text-[11px] tracking-wide' : 'text-xs tracking-wider sm:text-sm'}`}>
                {title}
            </p>
            {Icon && (
                <div className={`shrink-0 rounded-lg ${iconBgColor} ${iconColor} ${compact ? 'p-1.5' : 'p-2'}`}>
                    <Icon size={compact ? 16 : 24} aria-hidden="true" />
                </div>
            )}
        </div>
        <div className="mt-auto flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className={`min-w-0 break-words font-bold leading-none tabular-nums text-slate-900 dark:text-white ${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                {error ? '—' : value}
            </p>
            {error ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={12} aria-hidden="true" /> {error}
                </span>
            ) : trend ? (
                <span className={`text-sm font-semibold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend.value}
                </span>
            ) : subtitle && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</span>
            )}
        </div>
    </div>
);
