import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    children: React.ReactNode;
}

const variantStyles = {
    default: 'bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark',
    elevated: 'bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-lg',
    bordered: 'bg-transparent border-2 border-slate-200 dark:border-border-dark',
    gradient: 'bg-gradient-to-br from-primary to-primary-dark text-white border-0',
};

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'md',
    hoverable = false,
    children,
    className = '',
    ...props
}) => {
    const hoverStyles = hoverable 
        ? 'hover:shadow-xl hover:border-primary/50 dark:hover:border-primary transition-all cursor-pointer transform hover:-translate-y-1 duration-300' 
        : '';

    return (
        <div
            className={`
                rounded-2xl 
                ${variantStyles[variant]} 
                ${paddingStyles[padding]}
                ${hoverStyles}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children, 
    className = '' 
}) => (
    <div className={`pb-4 border-b border-slate-100 dark:border-border-dark mb-4 ${className}`}>
        {children}
    </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children, 
    className = '' 
}) => (
    <h3 className={`text-lg font-bold text-slate-900 dark:text-white ${className}`}>
        {children}
    </h3>
);

