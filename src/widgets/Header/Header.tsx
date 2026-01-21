import React from 'react';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../shared/hooks';
import { Button } from '../../shared/ui';

interface HeaderProps {
    onMenuClick?: () => void;
    title?: string;
    subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
    onMenuClick, 
    title = 'DevManager',
    subtitle = 'Workspace'
}) => {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <header className="h-16 border-b border-slate-200 dark:border-[#233948] bg-white/80 dark:bg-[#111b22]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
            {/* Mobile Menu Button */}
            <button 
                onClick={onMenuClick}
                className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <Menu size={24} />
            </button>
            
            {/* Breadcrumbs / Title */}
            <div className="hidden md:flex text-sm text-slate-500 dark:text-slate-400 font-medium items-center gap-2">
                <span className="text-slate-900 dark:text-white font-semibold">{title}</span>
                <span className="mx-1">/</span>
                <span>{subtitle}</span>
            </div>

            {/* Search (optional) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar proyectos, agentes..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-[#233948] bg-slate-50 dark:bg-[#16222b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                    title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#111b22]" />
                </button>
            </div>
        </header>
    );
};

export default Header;
