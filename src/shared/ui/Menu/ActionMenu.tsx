import React, { useEffect, useId, useRef, useState } from 'react';
import { MoreVertical, type LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
    label: string;
    icon?: LucideIcon;
    onSelect: () => void;
    danger?: boolean;
    /** Draws a divider above the item. */
    separated?: boolean;
}

interface ActionMenuProps {
    /** Accessible name of the trigger, e.g. "Acciones de Ana López". */
    label: string;
    items: ActionMenuItem[];
}

const MENU_HEIGHT_ESTIMATE = 340;

/**
 * Overflow "⋮" menu (WAI-ARIA menu button): arrow keys / Home / End move between items, Escape and Tab close it
 * and focus returns to the trigger. It is position:fixed so a table's scroll container doesn't clip it.
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({ label, items }) => {
    const [style, setStyle] = useState<React.CSSProperties | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const open = style !== null;

    const close = (returnFocus = true) => {
        setStyle(null);
        if (returnFocus) triggerRef.current?.focus();
    };

    const openMenu = () => {
        const r = triggerRef.current!.getBoundingClientRect();
        const right = window.innerWidth - r.right;
        // Opens upwards when it doesn't fit below.
        setStyle(window.innerHeight - r.bottom < MENU_HEIGHT_ESTIMATE
            ? { bottom: window.innerHeight - r.top + 4, right }
            : { top: r.bottom + 4, right });
    };

    const menuItems = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

    useEffect(() => {
        if (!open) return;
        menuItems()[0]?.focus();
        const onPointer = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) close(false);
        };
        // The menu is fixed: scrolling or resizing would detach it from its trigger.
        const onMove = () => close(false);
        document.addEventListener('mousedown', onPointer);
        window.addEventListener('scroll', onMove, true);
        window.addEventListener('resize', onMove);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            window.removeEventListener('scroll', onMove, true);
            window.removeEventListener('resize', onMove);
        };
    }, [open]);

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        const list = menuItems();
        const i = list.indexOf(document.activeElement as HTMLElement);
        const move = (to: number) => { e.preventDefault(); list[(to + list.length) % list.length]?.focus(); };
        if (e.key === 'ArrowDown') move(i + 1);
        else if (e.key === 'ArrowUp') move(i - 1);
        else if (e.key === 'Home') move(0);
        else if (e.key === 'End') move(list.length - 1);
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === 'Tab') close(false);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-label={label}
                title="Acciones"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={(e) => { e.stopPropagation(); if (open) close(false); else openMenu(); }}
                onKeyDown={(e) => {
                    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) { e.preventDefault(); openMenu(); }
                }}
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
                <MoreVertical size={18} aria-hidden="true" />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    id={menuId}
                    role="menu"
                    aria-label={label}
                    style={style}
                    onKeyDown={onMenuKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed w-52 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-border-dark py-2 z-50 text-left whitespace-nowrap"
                >
                    {items.map(({ label: text, icon: Icon, onSelect, danger, separated }) => (
                        <React.Fragment key={text}>
                            {separated && <div role="separator" className="my-2 border-t border-slate-200 dark:border-border-dark" />}
                            <button
                                type="button"
                                role="menuitem"
                                tabIndex={-1}
                                // Focus goes back to the trigger first, so a modal opened by the item returns focus there on close.
                                onClick={() => { close(); onSelect(); }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 outline-none ${
                                    danger
                                        ? 'text-rose-500 hover:bg-rose-50 focus:bg-rose-50 dark:hover:bg-rose-500/10 dark:focus:bg-rose-500/10'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 focus:bg-slate-100 dark:hover:bg-background-dark dark:focus:bg-background-dark'
                                }`}
                            >
                                {Icon && <Icon size={16} aria-hidden="true" />} {text}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </>
    );
};
