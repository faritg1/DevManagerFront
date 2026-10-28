import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageContainerProps {
    children: React.ReactNode;
    /** Ancho reducido para páginas de formulario (crear/editar, ajustes). */
    narrow?: boolean;
    /** Ocupa todo el alto disponible (p. ej. chats) y apila su contenido en columna. */
    fullHeight?: boolean;
    className?: string;
}

/** Contenedor estándar de página: mismo margen lateral y ancho máximo en toda la app. */
export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    narrow = false,
    fullHeight = false,
    className = '',
}) => (
    <div
        className={`p-6 md:p-10 ${narrow ? 'max-w-5xl' : 'max-w-7xl'} mx-auto w-full ${
            fullHeight ? 'h-full flex flex-col' : ''
        } ${className}`}
    >
        {children}
    </div>
);

interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Botones o controles alineados a la derecha (se apilan en móvil). */
    actions?: React.ReactNode;
    /** Contenido sobre el título, p. ej. un botón "Volver". */
    before?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

/** Encabezado estándar de página: título, descripción opcional y acciones. */
export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actions,
    before,
    icon,
    className = '',
}) => (
    <div className={`mb-8 ${className}`}>
        {before && <div className="mb-4">{before}</div>}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {icon}
                    <span className="min-w-0 break-words">{title}</span>
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
    </div>
);

/** Indicador de carga estándar; `label` muestra un texto bajo el spinner. */
export const LoadingBlock: React.FC<{ label?: string; className?: string }> = ({ label, className = 'py-12' }) => (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        {label ? <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p> : <span className="sr-only">Cargando…</span>}
    </div>
);
