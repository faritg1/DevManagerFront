import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

const Layout: React.FC = () => {
    return (
        <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header (Mobile & Utilities) */}
                <header className="h-16 border-b border-slate-200 dark:border-[#233948] bg-white/80 dark:bg-[#111b22]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
                    <button className="md:hidden p-2 text-slate-500">
                        <Menu size={24} />
                    </button>
                    
                    {/* Breadcrumbs Placeholder or Page Title could go here */}
                    <div className="hidden md:flex text-sm text-slate-500 dark:text-slate-400 font-medium">
                        DevManager <span className="mx-2">/</span> Workspace
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#111b22]"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
