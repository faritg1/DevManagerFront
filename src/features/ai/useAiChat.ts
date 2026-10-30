import { useCallback, useEffect, useRef, useState } from 'react';
import { aiService, type AiCapabilities, type AiSource, type AiStoredMessage, type ApiError } from '../../shared/api';
import { STORAGE_KEYS } from '../../shared/config/constants';

export interface ToolChip {
    name: string;
    module: string;
    status: 'started' | 'done' | 'denied' | 'error' | 'truncated';
    rows?: number;
}

export interface ChatTurn {
    id: string;
    role: 'user' | 'assistant' | 'refusal';
    text: string;
    tools: ToolChip[];
    sources: AiSource[];
    deniedModules: string[];
    /** Proposals the assistant generated in this answer (SSE `action`). */
    proposals: { actionId: string; projectId: string }[];
    streaming?: boolean;
    error?: string;
}

const turn = (role: ChatTurn['role'], text = '', id: string = crypto.randomUUID()): ChatTurn =>
    ({ id, role, text, tools: [], sources: [], deniedModules: [], proposals: [] });

/** Rebuilds the visible turns from stored rows: tool rows become chips of the assistant answer that follows them. */
const fromStored = (rows: AiStoredMessage[]): ChatTurn[] => {
    const turns: ChatTurn[] = [];
    let pending: ToolChip[] = [];
    for (const m of rows) {
        if (m.role === 'tool') {
            const status = m.toolStatus === 'ok' ? 'done' : m.toolStatus ?? 'done';
            pending.push({ name: m.toolName ?? '', module: m.moduleKey ?? '', status, rows: m.resultRows ?? undefined });
            continue;
        }
        const t = turn(m.role, m.content, m.id);
        if (m.role === 'assistant') { t.tools = pending; pending = []; }
        turns.push(t);
    }
    return turns;
};

/** Chat state over POST /ai/chat: streams the answer, tool progress, sources and refusals into `turns`. */
export const useAiChat = (moduleKey?: string) => {
    const [turns, setTurns] = useState<ChatTurn[]>([]);
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [streaming, setStreaming] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const conversationRef = useRef<string | undefined>(undefined);

    const stop = useCallback(() => abortRef.current?.abort(), []);
    useEffect(() => stop, [stop]);

    const setConversation = (id: string | undefined) => {
        conversationRef.current = id;
        setConversationId(id);
    };

    const send = useCallback(async (message: string) => {
        const text = message.trim();
        if (!text || abortRef.current) return;
        const answer = turn('assistant');
        answer.streaming = true;
        setTurns(prev => [...prev, turn('user', text), answer]);
        setStreaming(true);
        const controller = new AbortController();
        abortRef.current = controller;
        const patch = (fn: (t: ChatTurn) => ChatTurn) =>
            setTurns(prev => prev.map(t => (t.id === answer.id ? fn(t) : t)));

        try {
            await aiService.streamChat({ conversationId: conversationRef.current, message: text, moduleKey }, (e) => {
                switch (e.type) {
                    case 'meta':
                        setConversation(e.data.conversationId);
                        break;
                    case 'tool': {
                        const { name, module, status, rows } = e.data;
                        patch(t => {
                            // A tool reports "started" then a final status: update its started chip in place.
                            const i = t.tools.findIndex(c => c.name === name && c.status === 'started');
                            const chip: ToolChip = { name, module, status, rows };
                            const tools = i >= 0 && status !== 'started' ? t.tools.map((c, j) => (j === i ? chip : c)) : [...t.tools, chip];
                            return { ...t, tools };
                        });
                        break;
                    }
                    case 'action':
                        patch(t => ({ ...t, proposals: [...t.proposals, { actionId: e.data.actionId, projectId: e.data.projectId }] }));
                        break;
                    case 'delta':
                        patch(t => ({ ...t, text: t.text + e.data.text }));
                        break;
                    case 'refusal':
                        patch(t => ({ ...t, role: 'refusal', text: e.data.message, deniedModules: e.data.deniedModules }));
                        break;
                    case 'done':
                        patch(t => ({ ...t, sources: e.data.sources ?? [], streaming: false }));
                        break;
                    case 'error':
                        patch(t => ({ ...t, error: e.data.message, streaming: false }));
                        break;
                }
            }, controller.signal);
        } catch (err) {
            const aborted = (err as Error)?.name === 'AbortError';
            patch(t => ({
                ...t,
                error: aborted ? undefined : (err as ApiError)?.message || 'No se pudo conectar con el asistente.',
                text: aborted && !t.text ? 'Respuesta detenida.' : t.text,
            }));
        } finally {
            patch(t => ({ ...t, streaming: false }));
            abortRef.current = null;
            setStreaming(false);
        }
    }, [moduleKey]);

    const reset = useCallback(() => {
        stop();
        setConversation(undefined);
        setTurns([]);
    }, [stop]);

    const load = useCallback(async (id: string) => {
        stop();
        setLoadingHistory(true);
        try {
            const res = await aiService.getMessages(id);
            setConversation(id);
            setTurns(fromStored(res.data ?? []));
        } finally {
            setLoadingHistory(false);
        }
    }, [stop]);

    return { turns, conversationId, streaming, loadingHistory, send, stop, reset, load };
};

// Capabilities depend only on the signed-in user, so one request per token serves every panel and button.
let capabilitiesCache: { token: string | null; promise: Promise<AiCapabilities | null> } | null = null;

/** What the assistant may answer for the current user; null while loading or if the request failed. */
export const useAiCapabilities = (): AiCapabilities | null => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (capabilitiesCache?.token !== token) {
        const promise = aiService.getCapabilities().then(r => r.data ?? null, () => null);
        capabilitiesCache = { token, promise };
        // A failed load is retried on the next mount instead of being cached for the session.
        promise.then(c => { if (!c && capabilitiesCache?.promise === promise) capabilitiesCache = null; });
    }
    const promise = capabilitiesCache!.promise;
    const [caps, setCaps] = useState<AiCapabilities | null>(null);
    useEffect(() => {
        let alive = true;
        promise.then(c => { if (alive) setCaps(c); });
        return () => { alive = false; };
    }, [promise]);
    return caps;
};
