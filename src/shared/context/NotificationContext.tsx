import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for notifications/toast
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

interface NotificationContextValue {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notification: Omit<Notification, 'id'>) => {
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
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
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
