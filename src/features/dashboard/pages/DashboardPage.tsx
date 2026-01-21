import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, AlertTriangle, ArrowRight, MoreHorizontal } from 'lucide-react';
import { Card, StatCard, Badge, ProgressBar, Button } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import type { Project } from '../../../shared/types';

// Mock data - will be replaced by API calls
const mockProjects: Project[] = [
    { id: '1', name: 'E-Commerce Migration', client: 'RetailCorp Inc.', status: 'In Progress', progress: 75, initials: 'EM', color: 'from-blue-500 to-cyan-400' },
    { id: '2', name: 'Internal CRM API', client: 'In-House', status: 'Blocked', progress: 40, initials: 'IC', color: 'from-purple-500 to-pink-500' },
    { id: '3', name: 'Mobile App Redesign', client: 'FinTech Startup', status: 'Completed', progress: 100, initials: 'MA', color: 'from-emerald-500 to-teal-400' },
    { id: '4', name: 'Data Lake Initiative', client: 'BigData Co', status: 'In Progress', progress: 25, initials: 'DL', color: 'from-orange-500 to-yellow-400' },
];

const getStatusVariant = (status: string): 'success' | 'danger' | 'info' => {
    switch (status) {
        case 'In Progress': return 'success';
        case 'Blocked': return 'danger';
        default: return 'info';
    }
};

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full relative">
            <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                
                {/* Hero / Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            Dashboard General
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base">
                            Vista general de iniciativas estratégicas Q1 2026.
                        </p>
                    </div>
                    <Link to={ROUTES.CREATE_PROJECT}>
                        <Button icon={Plus}>
                            Nuevo Proyecto
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Proyectos Activos"
                        value={12}
                        icon={FolderOpen}
                        iconColor="text-primary"
                        iconBgColor="bg-blue-50 dark:bg-blue-500/10"
                        trend={{ value: '+2 esta semana', isPositive: true }}
                    />
                    <StatCard
                        title="Talento Asignado"
                        value={45}
                        icon={Users}
                        iconColor="text-indigo-400"
                        iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
                        subtitle="Devs & Diseñadores"
                    />
                    <StatCard
                        title="En Riesgo"
                        value={2}
                        icon={AlertTriangle}
                        iconColor="text-rose-500"
                        iconBgColor="bg-rose-50 dark:bg-rose-500/10"
                        trend={{ value: 'Acción requerida', isPositive: false }}
                    />
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {mockProjects.map((project) => (
                        <Card 
                            key={project.id} 
                            hoverable
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="group relative overflow-hidden"
                        >
                            {/* Hover Arrow */}
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="text-primary transform -translate-x-2 group-hover:translate-x-0 transition-transform" />
                            </div>

                            {/* Project Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                        {project.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                            {project.client}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center justify-between mt-5">
                                <Badge 
                                    variant={getStatusVariant(project.status)} 
                                    dot
                                >
                                    {project.status}
                                </Badge>
                                <button className="text-slate-400 hover:text-white p-1">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="mt-5">
                                <ProgressBar 
                                    value={project.progress} 
                                    showLabel 
                                    variant={project.status === 'Blocked' ? 'danger' : 'primary'}
                                />
                            </div>
                        </Card>
                    ))}

                    {/* Create New Card */}
                    <Link 
                        to={ROUTES.CREATE_PROJECT} 
                        className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#233948] bg-transparent p-6 items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[240px]"
                    >
                        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#16222b] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <Plus size={28} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold group-hover:text-primary transition-colors">
                            Crear Nuevo Proyecto
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
