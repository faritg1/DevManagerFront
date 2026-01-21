import React from 'react';
import { LucideIcon } from 'lucide-react';

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
    variant?: 'default' | 'gradient';
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
    variant = 'default',
    className = '',
}) => {
    if (variant === 'gradient') {
        return (
            <div className={`rounded-2xl p-6 bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg ${className}`}>
                <p className="text-white/80 text-sm font-bold uppercase tracking-wide">{title}</p>
                <p className="text-white text-4xl font-bold mt-4">{value}</p>
                {subtitle && (
                    <span className="text-white/80 text-sm font-semibold">{subtitle}</span>
                )}
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-4 rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">
                    {title}
                </p>
                {Icon && (
                    <div className={`p-2 ${iconBgColor} rounded-lg ${iconColor}`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-slate-900 dark:text-white text-4xl font-bold leading-none">
                    {value}
                </p>
                {trend && (
                    <span className={`text-sm font-semibold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend.value}
                    </span>
                )}
                {subtitle && !trend && (
                    <span className="text-slate-500 text-sm font-semibold">{subtitle}</span>
                )}
            </div>
        </div>
    );
};

export default StatCard;
