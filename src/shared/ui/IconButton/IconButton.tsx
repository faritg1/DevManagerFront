import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    icon: LucideIcon;
    /** Texto accesible; también se muestra como tooltip. */
    label: string;
    variant?: 'default' | 'primary' | 'danger';
    isLoading?: boolean;
}

const variantStyles = {
    default: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5',
    primary: 'text-primary hover:bg-primary/10',
    danger: 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10',
};

/** Botón de solo icono (acciones de fila, barras compactas) con tooltip y nombre accesible. */
export const IconButton: React.FC<IconButtonProps> = ({
    icon: Icon,
    label,
    variant = 'default',
    isLoading = false,
    className = '',
    disabled,
    type = 'button',
    ...props
}) => (
    <button
        type={type}
        aria-label={label}
        title={label}
        disabled={disabled || isLoading}
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
        {...props}
    >
        {isLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
    </button>
);

/** Celda de acciones de una tabla: alineada a la derecha, sin saltos de línea y sin propagar el clic a la fila. */
export const TableActions: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <td className={`w-px whitespace-nowrap px-4 py-2 text-right ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">{children}</div>
    </td>
);
