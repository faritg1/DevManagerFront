import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Users, Save, X } from 'lucide-react';

const CreateProjectScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto justify-center py-5">
            <div className="flex flex-col max-w-[1024px] w-full px-4 pb-20 mx-auto">
                    <div className="flex flex-wrap justify-between gap-6 p-4 border-b border-[#233948] mb-8">
                    <div className="flex min-w-72 flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight">Create New Project</h1>
                        <p className="text-text-secondary text-base font-normal leading-normal">Define project details, scope and assign the team.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 h-10 px-6 cursor-pointer justify-center rounded-xl border border-slate-300 dark:border-[#233948] bg-transparent text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16222b] transition-colors text-sm font-bold">
                            <X size={16} />
                            <span>Cancel</span>
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 h-10 px-6 cursor-pointer justify-center rounded-xl bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-bold shadow-lg shadow-primary/20">
                            <Save size={16} />
                            <span>Save Project</span>
                        </button>
                    </div>
                </div>
                
                <form className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-[#16222b] rounded-2xl p-8 border border-slate-200 dark:border-[#233948]/50 shadow-sm">
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold mb-6 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#233948]">
                            <Info className="text-primary" size={24} /> Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <label className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Project Name</span>
                                <input className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Ex: Mobile App Redesign"/>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Client / Department</span>
                                <input className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Ex: Marketing"/>
                            </label>
                            <label className="flex flex-col gap-2 md:col-span-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Description</span>
                                <textarea className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-32 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none" placeholder="Describe the project goals and scope..."></textarea>
                            </label>
                        </div>
                    </div>

                        <div className="bg-white dark:bg-[#16222b] rounded-2xl p-8 border border-slate-200 dark:border-[#233948]/50 shadow-sm">
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold mb-6 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#233948]">
                            <Users className="text-purple-500" size={24} /> Resource Allocation
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <label className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Required Skills</span>
                                <input className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Type and press enter to add tags..."/>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Estimated Duration (Weeks)</span>
                                <input type="number" className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="12"/>
                            </label>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectScreen;
