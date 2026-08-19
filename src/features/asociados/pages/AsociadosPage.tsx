import React, { useState, useEffect } from 'react';
import { Users, Search, Loader2, AlertCircle, UserCheck, UserX, IdCard, Calendar } from 'lucide-react';
import { Card, Badge, Avatar, Input, StatCard } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { usersService } from '../../../shared/api';
import type { UserResponse } from '../../../shared/api/types';

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return '—';
    }
};

const personTypeLabel = (type: string | null | undefined): string => {
    switch (type) {
        case 'Asociado': return 'Asociado';
        case 'Empleado': return 'Empleado';
        case 'Both': return 'Asociado/Empleado';
        default: return '—';
    }
};

export const AsociadosPage: React.FC = () => {
    const { showNotification } = useNotification();
    const [asociados, setAsociados] = useState<UserResponse[]>([]);
    const [filtered, setFiltered] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAsociados = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await usersService.getAll();
            if (response.success && response.data) {
                setAsociados(response.data);
                setFiltered(response.data);
            } else {
                setError(response.message || 'Error al cargar asociados');
            }
        } catch (err) {
            console.error('Error fetching asociados:', err);
            setError('Error de conexión al cargar asociados');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAsociados();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFiltered(asociados);
            return;
        }
        const q = searchQuery.toLowerCase();
        setFiltered(asociados.filter(a =>
            a.fullName.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            (a.documentNumber || '').toLowerCase().includes(q),
        ));
    }, [searchQuery, asociados]);

    const withDocumento = asociados.filter(a => a.documentNumber).length;
    const withPersonType = asociados.filter(a => a.personType).length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Cargando asociados...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{error}</p>
                <button
                    onClick={fetchAsociados}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Asociados
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Personas vinculadas a la organización solidaria (asociados y empleados).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Total" value={asociados.length} icon={Users} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Con documento" value={withDocumento} icon={IdCard} iconColor="text-emerald-500" iconBgColor="bg-emerald-100 dark:bg-emerald-500/10" />
                <StatCard title="Con tipo de persona" value={withPersonType} icon={UserCheck} iconColor="text-purple-500" iconBgColor="bg-purple-100 dark:bg-purple-500/10" />
            </div>

            {withDocumento === 0 && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
                    El backend actual (<code>/api/users</code>) aún no expone los campos de persona
                    (Documento, Tipo de persona, Fecha de nacimiento). Estas columnas se muestran
                    como «—» hasta que el contrato del API los incluya.
                </div>
            )}

            <div className="mb-6">
                <Input
                    placeholder="Buscar por nombre, email o documento..."
                    icon={Search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Persona</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Documento</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tipo de persona</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Nacimiento</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        {searchQuery ? 'No se encontraron asociados' : 'No hay asociados registrados'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={a.fullName} size="sm" />
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{a.fullName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {a.documentNumber ? (
                                                <div className="flex items-center gap-1.5">
                                                    <IdCard size={14} />
                                                    {a.documentType ? `${a.documentType} ` : ''}{a.documentNumber}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={a.personType ? 'purple' : 'default'}>
                                                {personTypeLabel(a.personType)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {formatDate(a.birthDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={a.isActive ? 'success' : 'danger'} dot>
                                                {a.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AsociadosPage;
