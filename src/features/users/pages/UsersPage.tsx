import React from 'react';
import { UserPlus, MoreVertical, Mail } from 'lucide-react';
import { Button, Card, Badge, Avatar } from '../../../shared/ui';

// Mock data
const mockUsers = [
    { name: "Ana García", email: "ana.garcia@devmanager.com", status: "active", roles: ["Admin Sistema"] },
    { name: "Carlos Pérez", email: "carlos.perez@devmanager.com", status: "active", roles: ["Project Manager", "Dev"] },
    { name: "Lucía Méndez", email: "lucia@devmanager.com", status: "inactive", roles: ["Dev"] },
    { name: "Miguel Angel", email: "miguel@devmanager.com", status: "active", roles: ["DevOps", "Architect"] },
];

export const UsersPage: React.FC = () => {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Gestión de Usuarios
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Administra el acceso y roles de los miembros del equipo.
                    </p>
                </div>
                <Button icon={UserPlus}>
                    Invitar Usuario
                </Button>
            </div>
            
            {/* Table */}
            <Card padding="none" className="overflow-hidden">
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
                            {mockUsers.map((user, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={user.name} size="sm" />
                                            <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} /> {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge 
                                            variant={user.status === 'active' ? 'success' : 'danger'} 
                                            dot
                                        >
                                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {user.roles.map(role => (
                                                <Badge key={role} variant="purple">
                                                    {role}
                                                </Badge>
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
            </Card>
        </div>
    );
};

export default UsersPage;
