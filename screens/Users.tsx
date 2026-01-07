import React from 'react';
import { UserPlus, MoreVertical, Mail } from 'lucide-react';

const UsersScreen: React.FC = () => {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Gestión de Usuarios</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Administra el acceso y roles de los miembros del equipo.</p>
                </div>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95">
                    <UserPlus size={18} />
                    Invitar Usuario
                </button>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16222b] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Nombre</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Email</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Roles</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {[
                                {name: "Ana García", email: "ana.garcia@devmanager.com", status: "active", roles: ["Admin Sistema"]},
                                {name: "Carlos Pérez", email: "carlos.perez@devmanager.com", status: "active", roles: ["Project Manager", "Dev"]},
                                {name: "Lucía Méndez", email: "lucia@devmanager.com", status: "inactive", roles: ["Dev"]},
                                {name: "Miguel Angel", email: "miguel@devmanager.com", status: "active", roles: ["DevOps", "Architect"]},
                            ].map((user, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-full bg-slate-200 dark:bg-[#233948] flex items-center justify-center text-slate-500 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <Mail size={14} /> {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {user.roles.map(r => (
                                                <span key={r} className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">{r}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b22]">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersScreen;
