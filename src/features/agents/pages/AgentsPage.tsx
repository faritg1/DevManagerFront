import React, { useState, useRef, useEffect } from 'react';
import { Bot, Cpu, Activity, Send, Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle, ShieldCheck, ShieldX, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { agentService } from '../../../shared/api';

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    reasoning?: string;
    toolsExecuted?: Array<{ toolName: string; input: string; output: string; success: boolean }>;
    requiresApproval?: boolean;
    actionId?: string | null;
    confidence?: number;
    /** Track HITL resolution per message */
    hitlStatus?: 'pending' | 'approved' | 'rejected';
    hitlNote?: string;
}

export const AgentsPage: React.FC = () => {
    const { showNotification } = useNotification();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'agent',
            content: '¡Hola! Soy tu asistente IA de DevManager. Puedo ayudarte a analizar tu equipo, buscar candidatos para proyectos, o responder preguntas sobre habilidades y recursos. ¿En qué puedo ayudarte?',
            timestamp: new Date(),
            confidence: 1
        }
    ]);
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
                // Parsear el response JSON si viene como string
                let answerText = response.data.response;
                try {
                    const parsed = JSON.parse(response.data.response);
                    // Formatear como texto legible
                    answerText = formatAgentResponse(parsed);
                } catch {
                    // Si no es JSON, usar tal cual
                    answerText = response.data.response;
                }

                const agentMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'agent',
                    content: answerText,
                    timestamp: new Date(),
                    reasoning: response.data.reasoningSteps,
                    toolsExecuted: response.data.toolsExecuted,
                    requiresApproval: response.data.requiresHumanApproval,
                    actionId: response.data.actionId,
                    hitlStatus: response.data.requiresHumanApproval ? 'pending' : undefined,
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

    // Formatear respuesta JSON del agente
    const formatAgentResponse = (parsed: unknown): string => {
        return JSON.stringify(parsed, null, 2);
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
                            <div className={`flex-1 max-w-2xl ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                <div className={`rounded-2xl px-4 py-3 ${
                                    message.role === 'user' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-slate-100 dark:bg-[#111b22] text-slate-900 dark:text-white'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>

                                {/* Metadata del agente */}
                                {message.role === 'agent' && (
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 px-2">
                                        <span>{message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                        
                                        {message.confidence !== undefined && (
                                            <div className="flex items-center gap-1">
                                                {message.confidence >= 0.8 ? (
                                                    <CheckCircle2 className="text-emerald-500" size={12} />
                                                ) : message.confidence >= 0.5 ? (
                                                    <AlertCircle className="text-yellow-500" size={12} />
                                                ) : (
                                                    <XCircle className="text-rose-500" size={12} />
                                                )}
                                                <span>Confianza: {Math.round(message.confidence * 100)}%</span>
                                            </div>
                                        )}

                                                        {message.requiresApproval && message.hitlStatus === 'pending' && (
                                            <Badge variant="warning" className="text-xs py-0.5 px-2">
                                                ⏳ Pendiente de aprobación
                                            </Badge>
                                        )}
                                        {message.hitlStatus === 'approved' && (
                                            <Badge variant="success" className="text-xs py-0.5 px-2">
                                                ✅ Aprobada
                                            </Badge>
                                        )}
                                        {message.hitlStatus === 'rejected' && (
                                            <Badge variant="danger" className="text-xs py-0.5 px-2">
                                                ❌ Rechazada
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Reasoning (opcional, colapsable) */}
                                {message.reasoning && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400 px-2">
                                        <summary className="cursor-pointer hover:text-primary">Ver razonamiento</summary>
                                        <p className="mt-2 p-3 bg-slate-50 dark:bg-[#0d1419] rounded-lg border border-slate-200 dark:border-[#233948] whitespace-pre-wrap">
                                            {message.reasoning}
                                        </p>
                                    </details>
                                )}

                                {/* Tools executed (colapsable) */}
                                {message.toolsExecuted && message.toolsExecuted.length > 0 && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400 px-2">
                                        <summary className="cursor-pointer hover:text-primary">Herramientas ejecutadas ({message.toolsExecuted.length})</summary>
                                        <div className="mt-2 space-y-2">
                                            {message.toolsExecuted.map((tool, idx) => (
                                                <div key={idx} className="p-2 bg-slate-50 dark:bg-[#0d1419] rounded-lg border border-slate-200 dark:border-[#233948]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {tool.success ? (
                                                            <CheckCircle2 className="text-emerald-500" size={12} />
                                                        ) : (
                                                            <XCircle className="text-red-500" size={12} />
                                                        )}
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{tool.toolName}</span>
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                                <Bot className="text-white" size={20} />
                            </div>
                            <div className="flex-1 max-w-2xl">
                                <div className="rounded-2xl px-4 py-3 bg-slate-100 dark:bg-[#111b22] inline-flex items-center gap-2">
                                    <Loader2 className="animate-spin text-primary" size={16} />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Pensando...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Examples (si no hay mensajes) */}
                {messages.length === 1 && (
                    <div className="px-6 pb-4">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                            Prueba con estas consultas:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {exampleQueries.map((query, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleExampleClick(query)}
                                    className="text-left px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111b22] hover:bg-slate-100 dark:hover:bg-[#1a2632] border border-slate-200 dark:border-[#233948] transition-all text-sm text-slate-700 dark:text-slate-300"
                                >
                                    💬 {query}
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
