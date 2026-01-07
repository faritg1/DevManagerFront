import React from 'react';
import { Mail, MapPin, Briefcase, Award } from 'lucide-react';

const ProfileScreen: React.FC = () => {
    return (
        <div className="flex h-full w-full flex-col overflow-y-auto p-4 md:p-8 space-y-6">
                <div className="max-w-7xl mx-auto flex flex-col gap-6 w-full">
                
                <div className="bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] rounded-2xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative group cursor-pointer">
                            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-cover bg-center border-4 border-white dark:border-[#111b22] shadow-xl" style={{backgroundImage: "url('https://i.pravatar.cc/300?u=a042581f4e29026704d')"}}></div>
                            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">Change</div>
                        </div>
                        <div className="flex-1 space-y-4 pt-2">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Sofia Martinez</h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">Senior Full Stack</span>
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">L5 Engineer</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 text-slate-500 dark:text-text-secondary text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <span>sofia.martinez@company.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span>Madrid, Spain (Remote)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">Edit Profile</button>
                            <button className="px-4 py-2 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] text-slate-700 dark:text-white text-sm font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-[#111b22] transition-colors">Download CV</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] rounded-2xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Briefcase size={20} className="text-primary" /> Work History
                                </h3>
                                <div className="space-y-6">
                                <div className="relative pl-8 border-l-2 border-slate-200 dark:border-[#233948] pb-8 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-[#16222b]"></div>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">Tech Lead - Fintech Core</h4>
                                        <p className="text-sm text-primary font-medium">2022 - Present</p>
                                        <p className="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">Leading the migration of the payment processing engine. Managed a team of 8 developers.</p>
                                    </div>
                                </div>
                                <div className="relative pl-8 border-l-2 border-slate-200 dark:border-[#233948] pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-[#16222b]"></div>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">Senior Developer - Mobile Squad</h4>
                                        <p className="text-sm text-slate-500 font-medium">2020 - 2022</p>
                                        <p className="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">Developed the new React Native mobile application improving user retention by 25%.</p>
                                    </div>
                                </div>
                                </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Award size={20} className="text-purple-500" /> Skills & Expertise
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-700 dark:text-white font-medium"><span>React & Native</span><span>95%</span></div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-[#111b22] rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[95%] rounded-full"></div>
                                    </div>
                                </div>
                                    <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-700 dark:text-white font-medium"><span>Node.js</span><span>88%</span></div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-[#111b22] rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[88%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-700 dark:text-white font-medium"><span>System Design</span><span>90%</span></div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-[#111b22] rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[90%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-700 dark:text-white font-medium"><span>Kubernetes</span><span>70%</span></div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-[#111b22] rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[70%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
