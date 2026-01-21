import React from 'react';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Button, Card, Badge, Input, Modal, Avatar } from '../../../shared/ui';
import { useModal } from '../../../shared/hooks';

// Mock data
const mockOrganizations = [
    { name: "TechSolutions Inc.", legal: "TechSolutions S.A.S", nit: "900.123.456-1", code: "TS", color: "from-emerald-500 to-teal-400", status: 'active' },
    { name: "Innovate Devs", legal: "Innovate Developers Ltda.", nit: "800.987.654-3", code: "ID", color: "from-purple-500 to-indigo-500", status: 'active' },
    { name: "Global Systems", legal: "Global Systems Corp.", nit: "901.555.222-8", code: "GS", color: "from-orange-500 to-red-500", status: 'active' },
    { name: "Alpha Logistics", legal: "Alpha Logistica & Transporte", nit: "900.555.111-9", code: "AL", color: "from-blue-500 to-cyan-400", status: 'inactive' },
];

export const OrganizationsPage: React.FC = () => {
    const { isOpen, open, close } = useModal();

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Gestión de Organizaciones
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Visualiza, edita y administra el estado de las empresas cliente.
                    </p>
                </div>
                <Button icon={Plus} onClick={open}>
                    Nueva Organización
                </Button>
            </div>

            {/* Search & Filter */}
            <Card padding="sm" className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:max-w-md">
                        <Input
                            placeholder="Buscar organización..."
                            icon={Search}
                        />
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#111b22]/50 border-b border-slate-200 dark:border-[#233948] text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="px-6 py-4 font-bold">Nombre Comercial</th>
                                <th className="px-6 py-4 font-bold">Razón Social</th>
                                <th className="px-6 py-4 font-bold">NIT / Tax ID</th>
                                <th className="px-6 py-4 font-bold text-center">Estado</th>
                                <th className="px-6 py-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[#233948] text-sm">
                            {mockOrganizations.map((org, i) => (
                                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={org.name} gradient={org.color} size="sm" />
                                            <span className="font-bold text-slate-900 dark:text-white">{org.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{org.legal}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{org.nit}</td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant={org.status === 'active' ? 'success' : 'danger'} dot>
                                            {org.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b22]">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal */}
            <Modal
                isOpen={isOpen}
                onClose={close}
                title="Nueva Organización"
                size="md"
                footer={
                    <>
                        <Button onClick={close}>Crear</Button>
                        <Button variant="ghost" onClick={close}>Cancelar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre Comercial"
                        placeholder="Ej. TechSolutions"
                    />
                    <Input
                        label="Razón Social"
                        placeholder="Ej. TechSolutions S.A.S"
                    />
                    <Input
                        label="NIT / Tax ID"
                        placeholder="900.123.456-1"
                    />
                </div>
            </Modal>
        </div>
    );
};

export default OrganizationsPage;
