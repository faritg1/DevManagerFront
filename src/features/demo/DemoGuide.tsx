import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, X } from 'lucide-react';
import { usePermission } from '../../shared/hooks';
import { Button, IconButton, Modal } from '../../shared/ui';
import { visibleNav } from '../../widgets/Sidebar/navConfig';
import { DEMO_SCRIPTS } from './catalog';

const LINK_CLASS = 'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

/**
 * Presenter aid mounted once in the main layout (demo mode only): a slim in-flow bar, so it never
 * covers a screen action, that opens the script of the current module and the list of modules.
 */
export const DemoGuide: React.FC = () => {
    const { pathname } = useLocation();
    const access = usePermission();
    const [hidden, setHidden] = useState(false);
    const [open, setOpen] = useState(false);
    if (hidden) return null;

    // Same rule as the sidebar: a script is offered only when its screen is in the visible menu.
    const granted = new Set(access.isLoading ? [] : visibleNav(access).flatMap((s) => s.items.flatMap((i) => i.children ?? [i])).map((i) => i.permission));
    const scripts = DEMO_SCRIPTS.filter((s) => granted.has(s.permission));
    const current = scripts.find((s) => pathname === s.route || pathname.startsWith(`${s.route}/`));

    return (
        <div className="print:hidden flex items-center justify-between gap-2 border-b border-slate-200 dark:border-border-dark bg-primary/10 px-4 py-1 text-sm text-slate-900 dark:text-white">
            <span className="min-w-0 truncate font-medium">Modo demo{current ? ` · ${current.title}` : ''}</span>
            <span className="flex shrink-0 items-center gap-1">
                <Button variant="secondary" size="sm" icon={ClipboardList} onClick={() => setOpen(true)}>Guion de demo</Button>
                {/* Back after a reload: hiding is for the moment the presenter shares the screen. */}
                <IconButton icon={X} label="Ocultar el modo demo" onClick={() => setHidden(true)} />
            </span>

            <Modal isOpen={open} onClose={() => setOpen(false)} title="Guion de demo" variant="drawer">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-700 dark:text-slate-200">
                    {current ? (
                        <section aria-labelledby="demo-script-title">
                            <h4 id="demo-script-title" className="text-base font-semibold text-slate-900 dark:text-white">{current.title}</h4>
                            <ol aria-label="Pasos" className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                                {current.steps.map((step) => <li key={step}>{step}</li>)}
                            </ol>
                        </section>
                    ) : (
                        <p className="text-sm">Esta pantalla no tiene guion. Elige un módulo de la lista.</p>
                    )}

                    <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Módulos de la demo</h4>
                    {scripts.length === 0 && <p className="mt-2 text-sm">Esta persona no puede abrir ningún módulo con guion.</p>}
                    <ul className="mt-2">
                        {scripts.map((s) => (
                            <li key={s.key}>
                                <Link to={s.route} aria-current={s === current ? 'page' : undefined} className={`${LINK_CLASS} ${s === current ? 'bg-primary/10 font-semibold' : ''}`}>
                                    {s.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link to="/demo" className={`${LINK_CLASS} mt-4 border-t border-slate-200 dark:border-border-dark rounded-t-none`}>Cambiar de persona</Link>
                </div>
            </Modal>
        </div>
    );
};
