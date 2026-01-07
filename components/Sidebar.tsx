import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Building2, 
    Briefcase, 
    Users, 
    ShieldCheck, 
    BarChart2, 
    User, 
    LogOut,
    Hexagon
} from 'lucide-react';

const Sidebar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
        <Link 
            to={to} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive(to) 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
        >
            <Icon size={20} className={isActive(to) ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );

    return (
        <aside className="w-64 bg-white dark:bg-[#111b22] border-r border-slate-200 dark:border-[#233948] flex-col hidden md:flex shrink-0 h-screen sticky top-0">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3">
                <div className="size-8 text-primary">
                    <Hexagon fill="currentColor" className="w-full h-full" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">DevManager</span>
            </div>

            {/* User Mini Profile */}
            <div className="px-6 pb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#16222b] rounded-xl border border-slate-100 dark:border-[#233948]">
                    <img 
                        src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
                        alt="User" 
                        className="size-9 rounded-lg object-cover"
                    />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">Sofia Martinez</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Admin Org</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Plataforma
                </div>
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/projects" icon={Briefcase} label="Proyectos" />
                <NavItem to="/reports" icon={BarChart2} label="Reportes IA" />

                <div className="px-3 py-2 mt-4 text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Administración
                </div>
                <NavItem to="/organizations" icon={Building2} label="Organizaciones" />
                <NavItem to="/users" icon={Users} label="Usuarios" />
                <NavItem to="/roles" icon={ShieldCheck} label="Roles y Permisos" />
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#233948] mt-auto">
                <NavItem to="/profile" icon={User} label="Mi Perfil" />
                <Link to="/" className="flex w-full items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-500 transition-colors mt-1">
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
