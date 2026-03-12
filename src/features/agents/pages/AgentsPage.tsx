import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Cpu, Activity, Send, Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle, ShieldCheck, ShieldX, ToggleLeft, ToggleRight, Wrench, Trash2 } from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { agentService } from '../../../shared/api';

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    markdown?: string;
    reasoning?: string;
    toolsExecuted?: Array<{ tool_name: string; input: string; output: string; success: boolean }>;
    requiresApproval?: boolean;
    actionId?: string | null;
    confidence?: number;
    suggestedActions?: Array<{ label: string; query: string }>;
    hitlStatus?: 'pending' | 'approved' | 'rejected';
    hitlNote?: string;
}

const CHAT_STORAGE_KEY = 'devmanager_chat_history';
const MAX_MESSAGES = 100;

const INITIAL_MESSAGE: ChatMessage = {
    id: '1',
    role: 'agent',
    content: '¡Hola! Soy tu asistente IA de DevManager. Puedo ayudarte a analizar tu equipo, buscar candidatos para proyectos, o responder preguntas sobre habilidades y recursos. ¿En qué puedo ayudarte?',
    timestamp: new Date(),
    confidence: 1
};

// Cargar mensajes desde localStorage
const loadMessagesFromStorage = (): ChatMessage[] => {
    try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convertir timestamps de string a Date
            return parsed.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
    return [INITIAL_MESSAGE];
};

// Guardar mensajes en localStorage
const saveMessagesToStorage = (messages: ChatMessage[]) => {
    try {
        // Limitar a los últimos MAX_MESSAGES mensajes
        const toSave = messages.slice(-MAX_MESSAGES);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
};

export const AgentsPage: React.FC = () => {
    const { showNotification } = useNotification();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Chat state - Cargar desde localStorage
    const [messages, setMessages] = useState<ChatMessage[]>(loadMessagesFromStorage);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [requireApproval, setRequireApproval] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ open: boolean; messageId: string; actionId: string }>({ open: false, messageId: '', actionId: '' });
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    // Scroll automático al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Guardar mensajes automáticamente cuando cambian
    useEffect(() => {
        saveMessagesToStorage(messages);
    }, [messages]);

    // Enviar consulta al agente
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await agentService.query({
                query: inputValue,
                requireApproval: requireApproval
            });

            if (response.success && response.data) {
                const data = response.data;
                
                const agentMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'agent',
                    content: data.markdown || data.payload?.text || data.summary || '',
                    markdown: data.markdown,
                    timestamp: new Date(),
                    reasoning: data.metadata?.reasoning,
                    toolsExecuted: data.metadata?.tools_executed,
                    requiresApproval: data.metadata?.requires_human_approval,
                    actionId: data.metadata?.action_id,
                    suggestedActions: data.suggested_actions,
                    hitlStatus: data.metadata?.requires_human_approval ? 'pending' : undefined,
                    confidence: 0.95
                };
                setMessages(prev => [...prev, agentMessage]);
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al consultar el agente'
                });
            }
        } catch (err: any) {
            console.error('Error querying agent:', err);
            
            // Mostrar error más descriptivo
            let errorContent = 'Lo siento, hubo un error de conexión.';
            if (err?.status === 404) {
                errorContent = '❌ Error 404: El endpoint /api/agent/query no existe en el backend.\n\nVerifica que la ruta del API esté correcta.';
            } else if (err?.message) {
                errorContent = `❌ Error: ${err.message}`;
            }
            
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                content: errorContent,
                timestamp: new Date(),
                confidence: 0
            };
            setMessages(prev => [...prev, errorMessage]);
            
            showNotification({
                type: 'error',
                message: `Error al consultar agente: ${err?.message || 'Conexión fallida'}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Ejemplos de consultas
    const exampleQueries = [
        "¿Cuántos desarrolladores tenemos con Java nivel 4+?",
        "Analiza las brechas de capacitación en el equipo",
        "¿Qué skills están más demandadas en proyectos activos?",
        "Muestra estadísticas del equipo de frontend"
    ];

    const handleExampleClick = (query: string) => {
        setInputValue(query);
    };

    // HITL: Aprobar acción
    const handleApproveAction = async (messageId: string, actionId: string) => {
        setApprovingId(messageId);
        try {
            const response = await agentService.approveAction(actionId);
            if (response.success) {
                setMessages(prev => prev.map(m =>
                    m.id === messageId ? { ...m, hitlStatus: 'approved' as const, hitlNote: 'Acción aprobada' } : m
                ));
                showNotification({ type: 'success', message: 'Acción del agente aprobada exitosamente' });
            } else {
                showNotification({ type: 'error', message: response.message || 'Error al aprobar la acción' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al aprobar' });
        } finally {
            setApprovingId(null);
        }
    };

    // HITL: Rechazar acción
    const handleRejectAction = async () => {
        if (!rejectReason.trim()) {
            showNotification({ type: 'error', message: 'Debes indicar un motivo para rechazar' });
            return;
        }
        setIsRejecting(true);
        try {
            const response = await agentService.rejectAction(rejectModal.actionId, { reason: rejectReason });
            if (response.success) {
                setMessages(prev => prev.map(m =>
                    m.id === rejectModal.messageId
                        ? { ...m, hitlStatus: 'rejected' as const, hitlNote: rejectReason }
                        : m
                ));
                showNotification({ type: 'success', message: 'Acción rechazada' });
                setRejectModal({ open: false, messageId: '', actionId: '' });
                setRejectReason('');
            } else {
                showNotification({ type: 'error', message: response.message || 'Error al rechazar' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al rechazar' });
        } finally {
            setIsRejecting(false);
        }
    };

    // Limpiar historial
    const handleClearHistory = () => {
        setMessages([INITIAL_MESSAGE]);
        localStorage.removeItem(CHAT_STORAGE_KEY);
        showNotification({ type: 'success', message: 'Historial de chat limpiado' });
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Sparkles className="text-primary" size={28} />
                        Asistente IA
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Consulta en lenguaje natural sobre tu equipo y proyectos.
                    </p>
                </div>
                {messages.length > 1 && (
                    <Button
                        variant="outline"
                        icon={Trash2}
                        onClick={handleClearHistory}
                        className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                        Limpiar Historial
                    </Button>
                )}
            </div>

            {/* Stats (mini) */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="flex items-center gap-3 p-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                        <Bot className="text-emerald-500" size={20} />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{messages.length - 1}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Consultas</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-3 p-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                        <Activity className="text-blue-500" size={20} />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">Online</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-3 p-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                        <Cpu className="text-purple-500" size={20} />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">Gemini</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Modelo</p>
                    </div>
                </Card>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#16222b] rounded-2xl border border-slate-200 dark:border-[#233948] overflow-hidden">
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 ${message.role === 'user' ? '' : ''}`}>
                                {message.role === 'agent' ? (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                                        <Bot className="text-white" size={20} />
                                    </div>
                                ) : (
                                    <Avatar name="Usuario" size="sm" />
                                )}
                            </div>

                            {/* Message Content */}
                            <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                <div className={`rounded-2xl ${
                                    message.role === 'user' 
                                        ? 'bg-primary text-white px-4 py-3' 
                                        : message.markdown 
                                            ? 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-6 shadow-lg'
                                            : 'bg-slate-100 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3'
                                }`}>
                                    {message.role === 'agent' && message.markdown ? (
                                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none space-y-4
                                            prose-headings:font-black prose-headings:tracking-tight prose-headings:scroll-mt-20
                                            prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-primary/30 prose-h1:text-primary dark:prose-h1:text-primary
                                            prose-h2:text-base prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-slate-800 dark:prose-h2:text-slate-200 prose-h2:bg-slate-100 dark:prose-h2:bg-slate-800/50 prose-h2:px-3 prose-h2:py-2 prose-h2:rounded-lg prose-h2:-mx-1
                                            prose-h3:text-sm prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-primary dark:prose-h3:text-primary prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-wide prose-h3:text-xs
                                            prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-3
                                            prose-strong:text-primary dark:prose-strong:text-primary prose-strong:font-bold prose-strong:bg-primary/10 prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded prose-strong:mx-0.5
                                            prose-em:text-blue-600 dark:prose-em:text-blue-400 prose-em:not-italic prose-em:font-semibold
                                            prose-ul:my-4 prose-ul:space-y-2 prose-ul:bg-slate-50 dark:prose-ul:bg-slate-900/30 prose-ul:p-4 prose-ul:rounded-xl prose-ul:border prose-ul:border-slate-200 dark:prose-ul:border-slate-700
                                            prose-ol:my-4 prose-ol:space-y-2 prose-ol:bg-slate-50 dark:prose-ol:bg-slate-900/30 prose-ol:p-4 prose-ol:rounded-xl prose-ol:border prose-ol:border-slate-200 dark:prose-ol:border-slate-700
                                            prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:leading-relaxed prose-li:my-1.5
                                            prose-li::marker:text-primary prose-li::marker:font-bold prose-li::marker:text-base
                                            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2
                                            prose-code:bg-slate-800 dark:prose-code:bg-slate-900 prose-code:text-emerald-400 dark:prose-code:text-emerald-300 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-[''] prose-code:border prose-code:border-slate-700
                                            prose-pre:bg-slate-950 dark:prose-pre:bg-black prose-pre:border-2 prose-pre:border-slate-700 dark:prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-4 prose-pre:shadow-lg
                                            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/30 prose-blockquote:pl-4 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300 prose-blockquote:shadow-sm
                                            prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-table:bg-white dark:prose-table:bg-slate-900 prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-md prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-700
                                            prose-thead:bg-gradient-to-r prose-thead:from-primary prose-thead:to-blue-500
                                            prose-th:border-0 prose-th:px-4 prose-th:py-3 prose-th:font-bold prose-th:text-white prose-th:text-left prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
                                            prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700 prose-td:px-4 prose-td:py-3 prose-td:text-slate-700 dark:prose-td:text-slate-300
                                            prose-tbody:divide-y prose-tbody:divide-slate-200 dark:prose-tbody:divide-slate-700
                                            prose-tr:transition-colors hover:prose-tr:bg-slate-50 dark:hover:prose-tr:bg-slate-800/50
                                            prose-hr:border-slate-300 dark:prose-hr:border-slate-700 prose-hr:my-6 prose-hr:border-t-2
                                            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-4 prose-img:border prose-img:border-slate-200 dark:prose-img:border-slate-700">
                                            <ReactMarkdown>{message.markdown}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                    )}
                                    
                                    {/* Suggested actions */}
                                    {message.role === 'agent' && message.suggestedActions && message.suggestedActions.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                                                <Sparkles size={12} className="text-primary" />
                                                Sugerencias para continuar:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {message.suggestedActions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setInputValue(action.query)}
                                                        className="text-xs px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md font-medium"
                                                    >
                                                        💡 {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Metadata del agente */}
                                {message.role === 'agent' && (
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 px-2 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Activity size={12} className="text-slate-400" />
                                            {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        
                                        {message.confidence !== undefined && (
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                                                message.confidence >= 0.8 
                                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                    : message.confidence >= 0.5
                                                        ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                                        : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                            }`}>
                                                {message.confidence >= 0.8 ? (
                                                    <CheckCircle2 size={12} />
                                                ) : message.confidence >= 0.5 ? (
                                                    <AlertCircle size={12} />
                                                ) : (
                                                    <XCircle size={12} />
                                                )}
                                                <span className="font-medium">Confianza: {Math.round(message.confidence * 100)}%</span>
                                            </div>
                                        )}

                                        {message.requiresApproval && message.hitlStatus === 'pending' && (
                                            <Badge variant="warning" className="text-xs py-1 px-2.5 font-medium">
                                                ⏳ Pendiente de aprobación
                                            </Badge>
                                        )}
                                        {message.hitlStatus === 'approved' && (
                                            <Badge variant="success" className="text-xs py-1 px-2.5 font-medium">
                                                ✅ Aprobada
                                            </Badge>
                                        )}
                                        {message.hitlStatus === 'rejected' && (
                                            <Badge variant="danger" className="text-xs py-1 px-2.5 font-medium">
                                                ❌ Rechazada
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Reasoning (opcional, colapsable) */}
                                {message.reasoning && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400 px-2 group">
                                        <summary className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 font-medium">
                                            <AlertCircle size={14} className="text-blue-500" />
                                            Ver razonamiento del agente
                                        </summary>
                                        <p className="mt-2.5 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-l-4 border-blue-500 shadow-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {message.reasoning}
                                        </p>
                                    </details>
                                )}

                                {/* Tools executed (colapsable) */}
                                {message.toolsExecuted && message.toolsExecuted.length > 0 && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400 px-2 group">
                                        <summary className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 font-medium">
                                            <Wrench size={14} className="text-purple-500" />
                                            Herramientas usadas ({message.toolsExecuted.length})
                                        </summary>
                                        <div className="mt-2.5 space-y-2">
                                            {message.toolsExecuted.map((tool, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border-l-4 shadow-sm ${
                                                    tool.success 
                                                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-500'
                                                        : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-500'
                                                }`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {tool.success ? (
                                                            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={14} />
                                                        ) : (
                                                            <XCircle className="text-red-600 dark:text-red-400" size={14} />
                                                        )}
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{tool.tool_name}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                                                        {tool.output}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}

                                {/* HITL Approve / Reject buttons */}
                                {message.requiresApproval && message.actionId && message.hitlStatus === 'pending' && (
                                    <div className="flex gap-2 px-2 pt-1">
                                        <Button
                                            size="sm"
                                            icon={approvingId === message.id ? Loader2 : ShieldCheck}
                                            onClick={() => handleApproveAction(message.id, message.actionId!)}
                                            disabled={approvingId === message.id}
                                            className={`bg-emerald-500 hover:bg-emerald-600 text-white text-xs ${approvingId === message.id ? '[&_svg]:animate-spin' : ''}`}
                                        >
                                            {approvingId === message.id ? 'Aprobando...' : 'Aprobar'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            icon={ShieldX}
                                            onClick={() => setRejectModal({ open: true, messageId: message.id, actionId: message.actionId! })}
                                            className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs"
                                        >
                                            Rechazar
                                        </Button>
                                    </div>
                                )}

                                {/* Nota de HITL resuelto */}
                                {message.hitlStatus === 'rejected' && message.hitlNote && (
                                    <p className="text-xs text-red-500 dark:text-red-400 px-2 italic">
                                        Motivo: {message.hitlNote}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg">
                                <Bot className="text-white" size={20} />
                            </div>
                            <div className="flex-1 max-w-2xl">
                                <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-[#111b22] dark:to-[#0d1419] border border-slate-200 dark:border-[#233948] inline-flex items-center gap-3 shadow-sm">
                                    <Loader2 className="animate-spin text-primary" size={16} />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">Pensando...</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Analizando tu consulta con IA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Examples (si no hay mensajes) */}
                {messages.length === 1 && (
                    <div className="px-6 pb-4">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Sparkles size={14} className="text-primary" />
                            Prueba con estas consultas:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {exampleQueries.map((query, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleExampleClick(query)}
                                    className="text-left px-4 py-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#111b22] dark:to-[#0d1419] hover:from-primary/10 hover:to-primary/5 dark:hover:from-primary/10 dark:hover:to-primary/5 border border-slate-200 dark:border-[#233948] hover:border-primary/30 transition-all text-sm text-slate-700 dark:text-slate-300 font-medium group shadow-sm hover:shadow"
                                >
                                    <span className="group-hover:text-primary transition-colors">💬 {query}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-slate-200 dark:border-[#233948] p-4">
                    {/* Require approval toggle */}
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setRequireApproval(prev => !prev)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                requireApproval
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-slate-50 dark:bg-[#111b22] border-slate-200 dark:border-[#233948] text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            {requireApproval ? (
                                <ToggleRight className="text-amber-500" size={16} />
                            ) : (
                                <ToggleLeft size={16} />
                            )}
                            Requerir aprobación (HITL)
                        </button>
                        {requireApproval && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                Las acciones del agente requerirán tu aprobación antes de ejecutarse.
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Escribe tu consulta... (Shift + Enter para nueva línea)"
                            rows={1}
                            disabled={isLoading}
                            className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-[#233948] bg-white dark:bg-[#111b22] px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <Button
                            icon={isLoading ? Loader2 : Send}
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className="self-end"
                        >
                            {isLoading ? 'Enviando...' : 'Enviar'}
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        💡 El agente puede acceder a información sobre proyectos, usuarios y habilidades de tu organización.
                    </p>
                </div>
            </div>

            {/* Modal de Rechazo */}
            <Modal
                isOpen={rejectModal.open}
                onClose={() => { setRejectModal({ open: false, messageId: '', actionId: '' }); setRejectReason(''); }}
                title="Rechazar Acción del Agente"
                icon={<ShieldX className="text-red-500" size={20} />}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Indica el motivo por el cual rechazas esta acción. Esto ayudará al agente a mejorar sus futuras sugerencias.
                    </p>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ej: El candidato ya está asignado a otro proyecto de alta prioridad..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-300 dark:border-[#233948] bg-white dark:bg-[#111b22] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => { setRejectModal({ open: false, messageId: '', actionId: '' }); setRejectReason(''); }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRejectAction}
                            disabled={!rejectReason.trim() || isRejecting}
                            icon={isRejecting ? Loader2 : ShieldX}
                            className={`bg-red-500 hover:bg-red-600 text-white ${isRejecting ? '[&_svg]:animate-spin' : ''}`}
                        >
                            {isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgentsPage;
