import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, type LucideIcon } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

// Simplified notification input (used by showNotification helper)
export interface ShowNotificationInput {
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
}

interface NotificationContextValue {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    /** Simplified method to show a notification */
    showNotification: (input: ShowNotificationInput) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

let nextId = 0;

const TOAST_STYLES: Record<NotificationType, { icon: LucideIcon; accent: string }> = {
    success: { icon: CheckCircle2, accent: 'border-l-emerald-500 text-emerald-600 dark:text-emerald-400' },
    error: { icon: XCircle, accent: 'border-l-rose-500 text-rose-600 dark:text-rose-400' },
    warning: { icon: AlertTriangle, accent: 'border-l-amber-500 text-amber-600 dark:text-amber-400' },
    info: { icon: Info, accent: 'border-l-primary text-primary' },
};

const ToastViewport: React.FC<{ notifications: Notification[]; onClose: (id: string) => void }> = ({ notifications, onClose }) => (
    <div
        aria-live="polite"
        aria-label="Notificaciones"
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 z-[100] flex flex-col gap-3 pointer-events-none"
    >
        {notifications.map(n => {
            const { icon: Icon, accent } = TOAST_STYLES[n.type];
            return (
                <div
                    key={n.id}
                    role={n.type === 'error' ? 'alert' : 'status'}
                    className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 border-slate-200 dark:border-border-dark ${accent} bg-white dark:bg-card-dark p-4 shadow-lg`}
                >
                    <Icon size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 break-words">{n.message}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={() => onClose(n.id)}
                        aria-label="Cerrar notificación"
                        className="shrink-0 -m-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <X size={16} />
                    </button>
                </div>
            );
        })}
    </div>
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = String(++nextId);
        const newNotification: Notification = { ...notification, id };
        
        setNotifications(prev => [...prev, newNotification]);

        const duration = notification.duration || 5000;
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    /** Simplified method to show a notification */
    const showNotification = useCallback((input: ShowNotificationInput) => {
        addNotification({
            type: input.type,
            title: input.title || (input.type === 'success' ? 'Éxito' : input.type === 'error' ? 'Error' : input.type === 'warning' ? 'Advertencia' : 'Info'),
            message: input.message,
            duration: input.duration,
        });
    }, [addNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll, showNotification }}>
            {children}
            <ToastViewport notifications={notifications} onClose={removeNotification} />
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextValue => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const useToast = () => {
    const { addNotification } = useNotification();

    return {
        success: (title: string, message?: string) => 
            addNotification({ type: 'success', title, message }),
        error: (title: string, message?: string) => 
            addNotification({ type: 'error', title, message }),
        warning: (title: string, message?: string) => 
            addNotification({ type: 'warning', title, message }),
        info: (title: string, message?: string) => 
            addNotification({ type: 'info', title, message }),
    };
};

