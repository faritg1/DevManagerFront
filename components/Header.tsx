import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, User, BarChart2, Hexagon, LogOut } from 'lucide-react';

const AppHeader: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-primary dark:text-primary' : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white';
    };

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark px-4 md:px-10 py-3 shadow-sm backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                <Link to="/dashboard" className="flex items-center gap-3 group">
                    <div className="size-8 text-primary group-hover:scale-110 transition-transform">
                        <Hexagon fill="currentColor" className="w-full h-full" />
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-tight">DevManager</h2>
                </Link>
            </div>
            <div className="flex flex-1 justify-end gap-8">
                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/dashboard')}`}>
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/marketplace" className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/marketplace')}`}>
                        <Briefcase size={18} />
                        <span>Marketplace</span>
                    </Link>
                    <Link to="/profile" className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/profile')}`}>
                        <User size={18} />
                        <span>Talento</span>
                    </Link>
                    <Link to="/reports" className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/reports')}`}>
                        <BarChart2 size={18} />
                        <span>Reportes</span>
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link to="/profile" className="hidden md:flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/20">
                        Mi Perfil
                    </Link>
                    <Link to="/" className="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors" title="Sign Out">
                        <LogOut size={20} />
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
