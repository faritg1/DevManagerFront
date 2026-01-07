import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, AlertTriangle, ArrowRight, MoreHorizontal } from 'lucide-react';
import { Project } from '../types';

const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();

    const projects: Project[] = [
        { id: '1', name: 'E-Commerce Migration', client: 'RetailCorp Inc.', status: 'In Progress', progress: 75, initials: 'EM', color: 'from-blue-500 to-cyan-400' },
        { id: '2', name: 'Internal CRM API', client: 'In-House', status: 'Blocked', progress: 40, initials: 'IC', color: 'from-purple-500 to-pink-500' },
        { id: '3', name: 'Mobile App Redesign', client: 'FinTech Startup', status: 'Completed', progress: 100, initials: 'MA', color: 'from-emerald-500 to-teal-400' },
        { id: '4', name: 'Data Lake Initiative', client: 'BigData Co', status: 'In Progress', progress: 25, initials: 'DL', color: 'from-orange-500 to-yellow-400' },
    ];

    return (
        <div className="flex flex-col h-full relative">
            <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                
                {/* Hero / Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Dashboard General</h2>
                        <p className="text-slate-500 dark:text-text-secondary text-base">Vista general de iniciativas estratégicas Q3.</p>
                    </div>
                    <Link to="/create-project" className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl h-11 px-6 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all active:scale-95">
                        <Plus size={18} />
                        <span>Nuevo Proyecto</span>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 dark:text-text-secondary text-sm font-bold uppercase tracking-wider">Proyectos Activos</p>
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-primary">
                                <FolderOpen size={24} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-4xl font-bold leading-none">12</p>
                            <span className="text-emerald-500 text-sm font-semibold">+2 esta semana</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 dark:text-text-secondary text-sm font-bold uppercase tracking-wider">Talento Asignado</p>
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-400">
                                <Users size={24} />
                            </div>
                        </div>
                            <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-4xl font-bold leading-none">45</p>
                            <span className="text-slate-500 text-sm font-semibold">Devs & Diseñadores</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 dark:text-text-secondary text-sm font-bold uppercase tracking-wider">En Riesgo</p>
                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-500">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                            <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-4xl font-bold leading-none">2</p>
                            <span className="text-rose-500 text-sm font-semibold">Acción requerida</span>
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {projects.map((project) => (
                        <div 
                            key={project.id} 
                            onClick={() => navigate('/project-detail')} 
                            className="group flex flex-col gap-5 rounded-2xl border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16222b] p-6 shadow-sm hover:shadow-xl hover:border-primary/50 dark:hover:border-primary transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="text-primary transform -translate-x-2 group-hover:translate-x-0 transition-transform" />
                            </div>

                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                        {project.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-slate-500 dark:text-text-secondary text-sm mt-1">{project.client}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                                    project.status === 'In Progress' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                                    project.status === 'Blocked' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                                    'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                }`}>
                                    {project.status}
                                </span>
                                <button className="text-slate-400 hover:text-white">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-500 dark:text-text-secondary">Progreso</span>
                                    <span className="text-slate-900 dark:text-white">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-[#111b22] h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${project.status === 'Blocked' ? 'bg-rose-500' : 'bg-primary'}`} 
                                        style={{width: `${project.progress}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Link to="/create-project" className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#233948] bg-transparent p-6 items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[240px]">
                        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#16222b] flex items-center justify-center text-slate-400 dark:text-text-secondary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <Plus size={28} />
                        </div>
                        <p className="text-slate-500 dark:text-text-secondary font-semibold group-hover:text-primary transition-colors">Crear Nuevo Proyecto</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardScreen;
