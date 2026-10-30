import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
    AlertCircle, ArrowDown, ArrowLeft, Bot, CheckCircle2, History, Loader2, Lock, MessageSquarePlus, Send, Sparkles, Square, Trash2, XCircle,
} from 'lucide-react';
import { aiService, type AiCapabilities, type AiConversation, type AiUsageSummary } from '../../shared/api';
import { useConfirm, usePermission } from '../../shared/hooks';
import { useNotification } from '../../shared/context';
import { formatNumber, timeAgo } from '../../shared/format';
import { Button, EmptyState, IconButton, LoadingBlock, Markdown } from '../../shared/ui';
import { useAiCapabilities, useAiChat, type ChatTurn, type ToolChip } from './useAiChat';

const MAX_LENGTH = 2000;
/** Backend AiController.UsagePermission */
const AI_USAGE_PERMISSION = 'menu.platform.ai_usage';

// The quota hint is optional: any unexpected /ai/usage shape (null, [], partial) just hides it.
const isUsageSummary = (u: unknown): u is AiUsageSummary =>
    !!u && typeof u === 'object' && !Array.isArray(u)
    && Number.isFinite((u as AiUsageSummary).remaining) && Number.isFinite((u as AiUsageSummary).percent);

const moduleName = (caps: AiCapabilities | null, key: string) => caps?.allowed.find(c => c.key === key)?.name ?? key;

const Chip: React.FC<{ chip: ToolChip; name: string }> = ({ chip, name }) => {
    const [Icon, label, tone] = {
        started: [Loader2, `Consultando ${name}…`, 'text-slate-600 dark:text-slate-300'],
        done: [CheckCircle2, chip.rows !== undefined ? `${name} · ${chip.rows} ${chip.rows === 1 ? 'registro' : 'registros'}` : name, 'text-emerald-700 dark:text-emerald-300'],
        truncated: [CheckCircle2, `${name} · ${chip.rows ?? ''} registros (recortado)`, 'text-amber-700 dark:text-amber-300'],
        denied: [Lock, `Sin acceso a ${name}`, 'text-rose-700 dark:text-rose-300'],
        error: [XCircle, `No se pudo consultar ${name}`, 'text-rose-700 dark:text-rose-300'],
    }[chip.status] as [typeof Loader2, string, string];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium dark:border-border-dark dark:bg-background-dark ${tone}`}>
            <Icon size={12} className={chip.status === 'started' ? 'animate-spin' : ''} aria-hidden="true" />
            {label}
        </span>
    );
};

const Turn: React.FC<{ t: ChatTurn; caps: AiCapabilities | null }> = ({ t, caps }) => {
    if (t.role === 'user') {
        return (
            <div className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{t.text}</p>
            </div>
        );
    }
    if (t.role === 'refusal') {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
                    <Lock size={16} aria-hidden="true" />
                    {t.deniedModules.length ? `No tienes acceso a ${t.deniedModules.join(', ')}` : 'No tienes acceso a esta información'}
                </p>
                {t.text && <p className="mt-1.5 text-amber-800 dark:text-amber-200">{t.text}</p>}
                {!/administrador/i.test(t.text) && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Pide acceso a un administrador.</p>}
            </div>
        );
    }
    return (
        <div className="flex gap-2 sm:gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-400" aria-hidden="true">
                <Bot className="text-white" size={16} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                {t.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {t.tools.map((c, i) => <Chip key={i} chip={c} name={moduleName(caps, c.module)} />)}
                    </div>
                )}
                {t.text && <Markdown text={t.text} />}
                {t.streaming && !t.text && !t.tools.some(c => c.status === 'started') && (
                    <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Pensando…
                    </p>
                )}
                {t.error && (
                    <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {t.error}
                    </p>
                )}
                {t.sources.length > 0 && (
                    <p className="border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-border-dark dark:text-slate-400">
                        <span className="font-semibold">Fuentes: </span>
                        {t.sources.map(s => { const m = moduleName(caps, s.module); return s.label === m ? m : `${s.label} (${m})`; }).join(' · ')}
                    </p>
                )}
            </div>
        </div>
    );
};

interface AiChatPanelProps {
    /** Presets the chat to one module: its suggestions, its conversations and the moduleKey sent with each question. */
    moduleKey?: string;
    /** Drawer layout: the history replaces the chat instead of sitting beside it. */
    compact?: boolean;
    className?: string;
}

/** Streaming assistant chat with server-side conversation history. */
export const AiChatPanel: React.FC<AiChatPanelProps> = ({ moduleKey, compact = false, className = '' }) => {
    const caps = useAiCapabilities();
    const { turns, conversationId, streaming, loadingHistory, send, stop, reset, load } = useAiChat(moduleKey);
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    const [input, setInput] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [conversations, setConversations] = useState<AiConversation[] | null>(null);
    const logRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const counterId = useId();
    const { has, isAdmin } = usePermission();
    const canSeeUsage = isAdmin || has(AI_USAGE_PERMISSION);
    const [usage, setUsage] = useState<AiUsageSummary | null>(null);

    // Remaining-quota hint, refreshed after each answer; only for who may see the usage (no 403 noise)
    useEffect(() => {
        if (canSeeUsage && !streaming) aiService.getUsage().then(r => setUsage(isUsageSummary(r?.data) ? r.data : null), () => setUsage(null));
    }, [canSeeUsage, streaming]);

    const refreshConversations = useCallback(() => {
        aiService.listConversations().then(r => setConversations(r.data ?? []), () => setConversations([]));
    }, []);
    // A new conversation id means the server just created it: refresh the list so it shows up.
    useEffect(refreshConversations, [refreshConversations, conversationId]);

    // Follows the stream only while the reader is at the bottom: scrolling up to read stops the auto-scroll.
    const [atBottom, setAtBottom] = useState(true);
    const atBottomRef = useRef(true);
    const onLogScroll = () => {
        const el = logRef.current!;
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        atBottomRef.current = near;
        setAtBottom(near);
    };
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        const el = logRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    };
    useEffect(() => {
        if (atBottomRef.current) scrollToBottom();
    }, [turns]);

    const submit = (text = input) => {
        if (!text.trim() || streaming) return;
        atBottomRef.current = true;
        send(text.slice(0, MAX_LENGTH));
        setInput('');
        inputRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
        }
    };

    const openConversation = async (id: string) => {
        setShowHistory(false);
        try {
            await load(id);
        } catch {
            showNotification({ type: 'error', message: 'No se pudo abrir la conversación.' });
        }
    };

    const removeConversation = async (c: AiConversation) => {
        if (!await confirm({ title: 'Eliminar conversación', message: `¿Eliminar "${c.title}"? No podrás recuperarla.`, confirmText: 'Eliminar' })) return;
        try {
            await aiService.deleteConversation(c.id);
            if (c.id === conversationId) reset();
            setConversations(prev => prev?.filter(x => x.id !== c.id) ?? null);
        } catch {
            showNotification({ type: 'error', message: 'No se pudo eliminar la conversación.' });
        }
    };

    const visible = conversations?.filter(c => !moduleKey || c.moduleKey === moduleKey);
    const suggestions = moduleKey
        ? caps?.allowed.find(c => c.key === moduleKey)?.suggestions ?? []
        : caps?.allowed.flatMap(c => c.suggestions.slice(0, 1)).slice(0, 4) ?? [];

    const history = (
        <aside
            aria-label="Conversaciones"
            className={`${showHistory ? 'flex' : 'hidden'} ${compact ? 'flex-1' : 'flex-1 lg:flex lg:w-72 lg:flex-none lg:border-r'} min-h-0 flex-col border-slate-200 dark:border-border-dark`}
        >
            <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Conversaciones</p>
                <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setShowHistory(false)} className={compact ? '' : 'lg:hidden'}>
                    Volver al chat
                </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {!visible ? <LoadingBlock className="py-8" /> : visible.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-slate-500 dark:text-slate-400">Aún no tienes conversaciones.</p>
                ) : (
                    <ul className="space-y-1">
                        {visible.map(c => (
                            <li key={c.id} className={`group flex items-center gap-1 rounded-xl ${c.id === conversationId ? 'bg-primary/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                                <button
                                    type="button"
                                    onClick={() => openConversation(c.id)}
                                    aria-current={c.id === conversationId || undefined}
                                    className="min-w-0 flex-1 rounded-xl px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{c.title}</span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400">{timeAgo(c.updatedAt)}</span>
                                </button>
                                <IconButton icon={Trash2} label={`Eliminar ${c.title}`} variant="danger" onClick={() => removeConversation(c)} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );

    return (
        <div className={`flex min-h-0 flex-1 overflow-hidden ${className}`}>
            {history}
            <section aria-label="Chat con el asistente" className={`${showHistory ? (compact ? 'hidden' : 'hidden lg:flex') : 'flex'} min-h-0 min-w-0 flex-1 flex-col`}>
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-border-dark">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={History}
                        onClick={() => setShowHistory(true)}
                        className={compact ? '' : 'lg:invisible'}
                    >
                        Historial
                    </Button>
                    <Button variant="ghost" size="sm" icon={MessageSquarePlus} onClick={reset} disabled={turns.length === 0 && !conversationId}>
                        Nueva conversación
                    </Button>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col">
                <div ref={logRef} onScroll={onLogScroll} role="log" aria-live="polite" aria-busy={streaming} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-5">
                    {loadingHistory ? <LoadingBlock /> : turns.length === 0 ? (
                        caps && caps.allowed.length === 0 ? (
                            <EmptyState icon={Lock} title="El asistente no tiene módulos habilitados para ti" description="Pide acceso a un administrador." />
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-6 text-center">
                                <Sparkles className="text-primary" size={28} aria-hidden="true" />
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    Pregunta en lenguaje natural. Respondo solo con los datos de los módulos a los que tienes acceso.
                                </p>
                                {suggestions.length > 0 && (
                                    <div className="grid w-full gap-2 sm:grid-cols-2">
                                        {suggestions.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => submit(s)}
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-border-dark dark:bg-background-dark dark:text-slate-200"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    ) : turns.map(t => <Turn key={t.id} t={t} caps={caps} />)}
                </div>
                {!atBottom && turns.length > 0 && (
                    <button
                        type="button"
                        onClick={() => scrollToBottom('smooth')}
                        className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-slate-200"
                    >
                        <ArrowDown size={14} aria-hidden="true" /> Ir al final
                    </button>
                )}
                </div>

                <form
                    className="border-t border-slate-200 p-3 dark:border-border-dark"
                    onSubmit={(e) => { e.preventDefault(); submit(); }}
                >
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            autoFocus={compact}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            maxLength={MAX_LENGTH}
                            rows={1}
                            placeholder="Escribe tu pregunta…"
                            aria-label="Pregunta para el asistente"
                            aria-describedby={counterId}
                            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary [field-sizing:content] dark:border-border-dark dark:bg-background-dark dark:text-white dark:placeholder:text-slate-500"
                        />
                        {streaming ? (
                            <Button variant="secondary" icon={Square} onClick={stop} className="h-11" aria-label="Detener respuesta">
                                <span className="hidden sm:inline">Detener</span>
                            </Button>
                        ) : (
                            <Button type="submit" icon={Send} disabled={!input.trim()} className="h-11" aria-label="Enviar pregunta">
                                <span className="hidden sm:inline">Enviar</span>
                            </Button>
                        )}
                    </div>
                    <p id={counterId} className="mt-1 flex flex-wrap justify-between gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="hidden sm:inline">Enter para enviar · Shift+Enter para nueva línea</span>
                        {usage && (
                            <span className={`ml-auto ${usage.percent >= 80 ? 'font-semibold text-orange-600 dark:text-orange-400' : ''}`}>
                                Cuota de IA: {formatNumber(usage.remaining, 0)} tokens disponibles ({formatNumber(usage.percent)} % usado)
                            </span>
                        )}
                        <span className={usage ? "" : "ml-auto"}>{input.length}/{MAX_LENGTH}</span>
                    </p>
                </form>
            </section>
        </div>
    );
};
