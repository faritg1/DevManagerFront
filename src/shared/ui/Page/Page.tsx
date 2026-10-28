import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, Loader2, type LucideIcon } from 'lucide-react';

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
        className={`p-4 sm:p-6 md:p-10 ${narrow ? 'max-w-5xl' : 'max-w-7xl'} mx-auto w-full ${
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
    /** Contenido sobre el título (bajo el botón "Volver" si hay `backTo`). */
    before?: React.ReactNode;
    /** Ruta padre: muestra "Volver" (regresa en el historial si se llegó navegando dentro de la app, si no va a esta ruta). */
    backTo?: string;
    backLabel?: string;
    icon?: React.ReactNode;
    className?: string;
}

/** Encabezado estándar de página: título, descripción opcional y acciones. */
export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actions,
    before,
    backTo,
    backLabel,
    icon,
    className = '',
}) => (
    <div className={`mb-6 md:mb-8 ${className}`}>
        {backTo && <BackButton to={backTo} label={backLabel} className="mb-4" />}
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

/** Regresa a la página anterior de la app; sin historial previo (enlace directo, recarga) va a `fallback`. */
export const useGoBack = (fallback: string) => {
    const navigate = useNavigate();
    return () => {
        // React Router guarda en history.state el índice de la entrada; > 0 significa que hay una página previa de la app.
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1);
        else navigate(fallback, { replace: true });
    };
};

/**
 * Botón "Volver": usa el historial cuando la página anterior es de la app (conserva filtros y scroll);
 * si se abrió por enlace directo o recarga, va a la ruta padre `to`.
 */
export const BackButton: React.FC<{ to: string; label?: string; className?: string }> = ({ to, label = 'Volver', className = '' }) => {
    const goBack = useGoBack(to);
    return (
        <button
            type="button"
            onClick={goBack}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white ${className}`}
        >
            <ArrowLeft size={16} aria-hidden="true" />
            {label}
        </button>
    );
};

interface EmptyStateProps {
    title: string;
    description?: React.ReactNode;
    icon?: LucideIcon;
    /** Acción opcional, p. ej. un botón "Crear". */
    action?: React.ReactNode;
    className?: string;
}

/** Estado vacío estándar: icono, mensaje corto y acción opcional. */
export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon: Icon = Inbox, action, className = 'py-12' }) => (
    <div className={`flex flex-col items-center justify-center gap-2 px-4 text-center ${className}`}>
        <div className="mb-1 rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-white/5 dark:text-slate-500">
            <Icon size={24} aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
    </div>
);

/** Indicador de carga estándar; `label` muestra un texto bajo el spinner. */
export const LoadingBlock: React.FC<{ label?: string; className?: string }> = ({ label, className = 'py-12' }) => (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        {label ? <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p> : <span className="sr-only">Cargando…</span>}
    </div>
);
