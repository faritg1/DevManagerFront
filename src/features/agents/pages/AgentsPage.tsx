import React, { useState, useRef, useEffect } from 'react';
import { Plus, Bot, Cpu, Activity, MoreHorizontal, Play, Pause, Settings, Send, Loader2, Sparkles, MessageSquare, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, Badge, Avatar, ProgressBar } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { agentService } from '../../../shared/api';
import type { Agent, AgentStatus } from '@entities/agent';
import type { AgentQueryResponse } from '../../../shared/api/types';

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    reasoning?: string;
    requiresApproval?: boolean;
    actionId?: string | null;
    confidence?: number;
}

// Mock agents data
const mockAgents: (Agent & { executions: number; successRate: number })[] = [
    {
        id: '1',
        name: 'Code Reviewer',
        description: 'Analiza pull requests y sugiere mejoras de código',
        type: 'analyzer',
        status: 'Active',
        configuration: { model: 'gemini-2.0-flash' },
        executions: 1245,
        successRate: 94,
    },
    {
        id: '2',
        name: 'Doc Generator',
        description: 'Genera documentación automática del código',
        type: 'automator',
        status: 'Active',
        configuration: { model: 'gemini-2.0-flash' },
        executions: 856,
        successRate: 98,
    },
    {
        id: '3',
        name: 'Security Scanner',
        description: 'Detecta vulnerabilidades en el código',
        type: 'monitor',
        status: 'Training',
        configuration: { model: 'gemini-2.0-flash' },
        executions: 234,
        successRate: 87,
    },
    {
        id: '4',
        name: 'Test Generator',
        description: 'Crea tests unitarios automáticamente',
        type: 'automator',
        status: 'Inactive',
        configuration: { model: 'gemini-2.0-flash' },
        executions: 567,
        successRate: 91,
    },
];

const getStatusVariant = (status: AgentStatus): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
        case 'Active': return 'success';
        case 'Training': return 'warning';
        case 'Error': return 'danger';
        default: return 'default';
    }
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'analyzer': return '🔍';
        case 'automator': return '⚙️';
        case 'monitor': return '👁️';
        case 'assistant': return '💬';
        default: return '🤖';
    }
};

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
                requireApproval: false
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
                    requiresApproval: response.data.requiresHumanApproval,
                    actionId: response.data.actionId,
                    confidence: 0.95 // Backend no retorna confidence, usar default
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

    // Formatear respuesta JSON del agente (sin formatear, mostrar como JSON)
    const formatAgentResponse = (parsed: any): string => {
        return JSON.stringify(parsed, null, 2);
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

                                        {message.requiresApproval && (
                                            <Badge variant="warning" className="text-xs py-0.5 px-2">
                                                Requiere aprobación
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Reasoning (opcional, colapsable) */}
                                {message.reasoning && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400 px-2">
                                        <summary className="cursor-pointer hover:text-primary">Ver razonamiento</summary>
                                        <p className="mt-2 p-3 bg-slate-50 dark:bg-[#0d1419] rounded-lg border border-slate-200 dark:border-[#233948]">
                                            {message.reasoning}
                                        </p>
                                    </details>
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
        </div>
    );
};

export default AgentsPage;
