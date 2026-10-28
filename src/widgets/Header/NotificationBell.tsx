import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, BellOff, CheckCircle2, Info, Trash2, XCircle, type LucideIcon } from 'lucide-react';
import { useNotifications } from '../../shared/context';
import type { NotificationKind, UserNotification } from '../../shared/api/types';
import { Button, EmptyState, IconButton, LoadingBlock } from '../../shared/ui';
import { timeAgo } from '../../shared/format';

const KIND_STYLES: Record<NotificationKind, { icon: LucideIcon; className: string }> = {
    1: { icon: Info, className: 'bg-primary/10 text-primary' },
    2: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
    3: { icon: AlertTriangle, className: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
    4: { icon: XCircle, className: 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
};

/** Bell with unread badge and a popover inbox (full-width sheet under the header on mobile). */
export const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const { items, unreadCount, loadList, markRead, markAllRead, remove } = useNotifications();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelId = useId();

    const close = (restoreFocus = true) => {
        setOpen(false);
        if (restoreFocus) buttonRef.current?.focus();
    };

    useEffect(() => {
        if (!open) return;
        loadList();
        panelRef.current?.focus();
        const onPointer = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, loadList]);

    const openItem = (n: UserNotification) => {
        markRead(n);
        if (n.link) {
            close(false);
            navigate(n.link);
        }
    };

    const badge = unreadCount > 99 ? '99+' : String(unreadCount);

    return (
        // Mobile: no positioned wrapper, so the panel anchors to the header (backdrop-blur makes it the containing block).
        <div ref={rootRef} className="sm:relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => (open ? close() : setOpen(true))}
                aria-expanded={open}
                aria-controls={panelId}
                aria-haspopup="dialog"
                aria-label={unreadCount ? `Notificaciones, ${badge} sin leer` : 'Notificaciones'}
                title="Notificaciones"
                className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && (
                    <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-[18px] text-center border-2 border-white dark:border-background-dark box-content">
                        {badge}
                    </span>
                )}
            </button>

            {open && (
                <div
                    ref={panelRef}
                    id={panelId}
                    role="dialog"
                    aria-label="Notificaciones"
                    tabIndex={-1}
                    className="absolute inset-x-0 top-full z-50 flex max-h-[calc(100dvh-4rem)] flex-col border-b border-slate-200 bg-white shadow-2xl outline-none dark:border-border-dark dark:bg-card-dark sm:inset-x-auto sm:right-0 sm:mt-2 sm:w-96 sm:max-h-[70vh] sm:rounded-2xl sm:border"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-border-dark">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notificaciones</h2>
                        <Button size="sm" variant="ghost" onClick={markAllRead} disabled={unreadCount === 0}>
                            Marcar todas como leídas
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {items === null ? (
                            <LoadingBlock className="py-8" />
                        ) : items.length === 0 ? (
                            <EmptyState icon={BellOff} title="No tienes notificaciones" className="py-10" />
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-border-dark">
                                {items.map((n) => {
                                    const { icon: Icon, className } = KIND_STYLES[n.type] ?? KIND_STYLES[1];
                                    return (
                                        <li key={n.id} className={`flex items-start gap-2 px-2 py-1 ${n.isRead ? '' : 'bg-primary/5'}`}>
                                            <button
                                                type="button"
                                                onClick={() => openItem(n)}
                                                className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/5"
                                            >
                                                <span className={`mt-0.5 shrink-0 rounded-full p-1.5 ${className}`}>
                                                    <Icon size={16} aria-hidden="true" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-2">
                                                        <span className={`truncate text-sm text-slate-900 dark:text-white ${n.isRead ? 'font-medium' : 'font-bold'}`}>{n.title}</span>
                                                        {!n.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />}
                                                    </span>
                                                    <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300 break-words">{n.message}</span>
                                                    <time dateTime={n.createdAt} className="mt-1 block text-xs text-slate-400">{timeAgo(n.createdAt)}</time>
                                                </span>
                                            </button>
                                            <IconButton icon={Trash2} label={`Eliminar notificación ${n.title}`} variant="danger" className="mt-1" onClick={() => remove(n)} />
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
