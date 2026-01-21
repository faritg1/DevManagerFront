import React from 'react';
import { Plus, Bot, Cpu, Activity, MoreHorizontal, Play, Pause, Settings } from 'lucide-react';
import { Button, Card, Badge, Avatar, ProgressBar } from '../../../shared/ui';
import type { Agent, AgentStatus } from '../../../shared/types';

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
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Mis Agentes IA
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Gestiona y monitorea tus agentes inteligentes.
                    </p>
                </div>
                <Button icon={Plus}>
                    Crear Agente
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <Bot size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">4</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Agentes Totales</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">2</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Activos Ahora</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">2,902</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ejecuciones Totales</p>
                    </div>
                </Card>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockAgents.map((agent) => (
                    <Card key={agent.id} hoverable className="group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{getTypeIcon(agent.type)}</div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors">
                                        {agent.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {agent.description}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={getStatusVariant(agent.status)} dot>
                                {agent.status}
                            </Badge>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 dark:border-[#233948]">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Ejecuciones</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{agent.executions.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Tasa de Éxito</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{agent.successRate}%</p>
                                    <div className="flex-1">
                                        <ProgressBar 
                                            value={agent.successRate} 
                                            size="sm" 
                                            variant={agent.successRate >= 90 ? 'success' : agent.successRate >= 70 ? 'warning' : 'danger'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-2">
                                {agent.status === 'Active' ? (
                                    <Button variant="ghost" size="sm" icon={Pause}>
                                        Pausar
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" icon={Play}>
                                        Activar
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" icon={Settings}>
                                    Configurar
                                </Button>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b22]">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AgentsPage;
