import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Types for notifications/toast
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

// Context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Date.now().toString();
        const newNotification: Notification = { ...notification, id };
        
        setNotifications(prev => [...prev, newNotification]);

        // Auto remove after duration
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
        </NotificationContext.Provider>
    );
};

// Hook
export const useNotification = (): NotificationContextValue => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Convenience hooks
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

export default NotificationContext;
