import React from 'react';

interface ProgressBarProps {
    value: number;
    max?: number;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animated?: boolean;
    className?: string;
}

const variantStyles = {
    primary: 'bg-primary shadow-primary/30',
    success: 'bg-emerald-500 shadow-emerald-500/30',
    warning: 'bg-orange-500 shadow-orange-500/30',
    danger: 'bg-rose-500 shadow-rose-500/30',
};

const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    variant = 'primary',
    size = 'md',
    showLabel = false,
    animated = true,
    className = '',
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {showLabel && (
                <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Progreso</span>
                    <span className="text-slate-900 dark:text-white">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-slate-100 dark:bg-[#111b22] ${sizeStyles[size]} rounded-full overflow-hidden`}>
                <div
                    className={`
                        h-full rounded-full shadow-lg
                        ${variantStyles[variant]}
                        ${animated ? 'transition-all duration-1000 ease-out' : ''}
                    `}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
