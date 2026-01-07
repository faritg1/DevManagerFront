import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Hexagon } from 'lucide-react';

const RegisterScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
             <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-border-dark bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                             <div className="size-8 text-primary">
                                <Hexagon fill="currentColor" className="w-full h-full" />
                            </div>
                            <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">DevManager</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="hidden md:block text-sm text-slate-600 dark:text-slate-400">Already have an account?</span>
                            <Link to="/" className="flex items-center justify-center rounded-lg px-4 py-2 bg-transparent hover:bg-slate-200 dark:hover:bg-surface-dark text-primary text-sm font-bold transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-4 lg:p-8 relative">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-start z-10">
                    <div className="flex flex-col gap-8 lg:sticky lg:top-28 pt-8 lg:pt-0">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                            Register Your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Organization</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                            Create an account for your company and start optimizing talent management today.
                        </p>
                        <div className="flex gap-4">
                             <div className="flex -space-x-3 overflow-hidden">
                                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-background-dark" src="https://i.pravatar.cc/150?u=12" alt=""/>
                                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-background-dark" src="https://i.pravatar.cc/150?u=22" alt=""/>
                                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-background-dark" src="https://i.pravatar.cc/150?u=32" alt=""/>
                            </div>
                            <p className="text-sm text-slate-500 self-center">Trusted by 500+ tech leads</p>
                        </div>
                    </div>
                    <div className="w-full">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-200 dark:border-border-dark overflow-hidden">
                             <div className="bg-slate-50 dark:bg-[#15222b] px-8 py-6 border-b border-slate-200 dark:border-border-dark">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-900 dark:text-white">Step 1 of 2</span>
                                        <span className="text-primary">50% completed</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 dark:bg-[#325167] rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-1/2 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Company Information</h3>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Company Name</span>
                                        <input className="w-full h-12 rounded-xl border border-slate-300 dark:border-border-dark bg-slate-50 dark:bg-[#101a22] px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Ex. Tech Solutions" type="text"/>
                                    </label>
                                </div>
                                <hr className="border-slate-200 dark:border-border-dark"/>
                                 <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin Account</h3>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Work Email</span>
                                        <input className="w-full h-12 rounded-xl border border-slate-300 dark:border-border-dark bg-slate-50 dark:bg-[#101a22] px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="name@company.com" type="email"/>
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Password</span>
                                        <input className="w-full h-12 rounded-xl border border-slate-300 dark:border-border-dark bg-slate-50 dark:bg-[#101a22] px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="••••••••" type="password"/>
                                    </label>
                                </div>
                                <button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 mt-2">
                                    <span>Register Organization</span>
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RegisterScreen;
