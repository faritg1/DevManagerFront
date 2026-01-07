import React from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle, Code, Server, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectDetailScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto px-4 md:px-10 lg:px-40 py-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12 w-full">
                
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium self-start">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-slate-200 dark:border-[#233948]">
                    <div className="flex flex-col gap-4 max-w-2xl">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            In Progress
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                            Microservices Migration - Core Platform
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                            Leading the transition from our legacy monolithic architecture to scalable, independent microservices to improve deployment velocity.
                        </p>
                    </div>
                    <button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/25 flex items-center gap-2 transition-all active:scale-95">
                        <span>Apply for Role</span>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 flex flex-col gap-12">
                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">About the Project</h3>
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                                <p className="leading-relaxed mb-4">
                                    This strategic initiative aims to decouple our current monolithic architecture into scalable, independent microservices. The primary goal is to increase our deployment frequency from weekly to daily and reduce the impact of failures on the system.
                                </p>
                                <p className="leading-relaxed">
                                    We are looking for senior engineers who have experience with high-traffic distributed systems. You will be working closely with the DevOps team to establish a robust CI/CD pipeline and monitoring infrastructure.
                                </p>
                            </div>
                        </section>
                        
                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tech Stack</h3>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg text-orange-600 dark:text-orange-400">
                                        <Code size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Java 17</p>
                                        <p className="text-xs text-slate-500">Core Language</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm">
                                    <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Spring Boot</p>
                                        <p className="text-xs text-slate-500">Framework</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Server size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Kubernetes</p>
                                        <p className="text-xs text-slate-500">Orchestration</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Key Deliverables</h3>
                            <ul className="space-y-4">
                                {[
                                    "Architect and implement user authentication service",
                                    "Migrate legacy database to PostgreSQL",
                                    "Establish 99.9% uptime SLA",
                                    "Document API endpoints using Swagger"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22]/50 border border-slate-100 dark:border-[#233948]">
                                        <CheckCircle className="text-primary shrink-0 mt-0.5" size={20} />
                                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-2xl bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] p-6 shadow-lg sticky top-24">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Project Details</h4>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-slate-100 dark:bg-[#111b22] rounded-lg text-slate-500 dark:text-text-secondary">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Duration</p>
                                        <p className="text-slate-900 dark:text-white font-semibold text-lg">6 Months</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-slate-100 dark:bg-[#111b22] rounded-lg text-slate-500 dark:text-text-secondary">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Commitment</p>
                                        <p className="text-slate-900 dark:text-white font-semibold text-lg">20 hrs / week</p>
                                    </div>
                                </div>
                                <hr className="border-slate-100 dark:border-[#233948]" />
                                <div className="flex -space-x-3 overflow-hidden py-2">
                                    <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-[#16222b]" src="https://i.pravatar.cc/150?u=1" alt=""/>
                                    <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-[#16222b]" src="https://i.pravatar.cc/150?u=2" alt=""/>
                                    <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-[#16222b]" src="https://i.pravatar.cc/150?u=3" alt=""/>
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-[#111b22] ring-2 ring-white dark:ring-[#16222b] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-text-secondary">
                                        +4
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500">7 Team members active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailScreen;
