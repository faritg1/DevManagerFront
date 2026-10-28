import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { notificationsService } from '../api';
import type { UserNotification } from '../api/types';
import { useToast } from './NotificationContext';

const POLL_MS = 60_000;

interface UserNotificationsValue {
    /** null until the list is first requested (the bell panel opens). */
    items: UserNotification[] | null;
    unreadCount: number;
    /** Refetches the unread count, and the list if it was already loaded. Any module may call it. */
    refreshNotifications: () => Promise<void>;
    loadList: () => Promise<void>;
    markRead: (n: UserNotification) => Promise<void>;
    markAllRead: () => Promise<void>;
    remove: (n: UserNotification) => Promise<void>;
}

const UserNotificationsContext = createContext<UserNotificationsValue | undefined>(undefined);

/** Current user's inbox (persisted notifications). Toasts stay in NotificationContext: they are ephemeral feedback. */
export const UserNotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [items, setItems] = useState<UserNotification[] | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastCount = useRef<number | null>(null);
    const listLoaded = useRef(false);
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const loadList = useCallback(async () => {
        try {
            const res = await notificationsService.list(20);
            setItems(res.data);
            listLoaded.current = true;
        } catch {
            setItems((prev) => prev ?? []);
        }
    }, []);

    const refreshNotifications = useCallback(async () => {
        try {
            const { count } = (await notificationsService.unreadCount()).data;
            if (lastCount.current !== null && count > lastCount.current) {
                toastRef.current.info('Tienes nuevas notificaciones');
            }
            lastCount.current = count;
            setUnreadCount(count);
            if (listLoaded.current) await loadList();
        } catch {
            // Polling must stay quiet; the next tick retries.
        }
    }, [loadList]);

    useEffect(() => {
        refreshNotifications();
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') refreshNotifications();
        }, POLL_MS);
        window.addEventListener('focus', refreshNotifications);
        return () => {
            clearInterval(id);
            window.removeEventListener('focus', refreshNotifications);
        };
    }, [refreshNotifications]);

    const setCount = (count: number) => {
        lastCount.current = count;
        setUnreadCount(count);
    };

    const markRead = useCallback(async (n: UserNotification) => {
        if (n.isRead) return;
        setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? prev);
        setCount(Math.max(0, (lastCount.current ?? 1) - 1));
        await notificationsService.markRead(n.id).catch(refreshNotifications);
    }, [refreshNotifications]);

    const markAllRead = useCallback(async () => {
        setItems((prev) => prev?.map((x) => ({ ...x, isRead: true })) ?? prev);
        setCount(0);
        await notificationsService.markAllRead().catch(refreshNotifications);
    }, [refreshNotifications]);

    const remove = useCallback(async (n: UserNotification) => {
        setItems((prev) => prev?.filter((x) => x.id !== n.id) ?? prev);
        if (!n.isRead) setCount(Math.max(0, (lastCount.current ?? 1) - 1));
        await notificationsService.remove(n.id).catch(refreshNotifications);
    }, [refreshNotifications]);

    const value = useMemo(
        () => ({ items, unreadCount, refreshNotifications, loadList, markRead, markAllRead, remove }),
        [items, unreadCount, refreshNotifications, loadList, markRead, markAllRead, remove],
    );

    return <UserNotificationsContext.Provider value={value}>{children}</UserNotificationsContext.Provider>;
};

export const useNotifications = (): UserNotificationsValue => {
    const context = useContext(UserNotificationsContext);
    if (!context) throw new Error('useNotifications must be used within a UserNotificationsProvider');
    return context;
};
