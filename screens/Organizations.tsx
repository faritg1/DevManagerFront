import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, Building2 } from 'lucide-react';

const OrganizationsScreen: React.FC = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Organizaciones</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualiza, edita y administra el estado de las empresas cliente.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Plus size={18} />
                    Nueva Organización
                </button>
            </div>

            {/* Search & Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#16222b] p-2 rounded-xl border border-slate-200 dark:border-[#233948] shadow-sm">
                <div className="relative w-full sm:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-slate-400" size={18} />
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary sm:text-sm transition-all outline-none" placeholder="Buscar organización..." type="text"/>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] rounded-xl overflow-hidden shadow-sm">
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
                            {[
                                {name: "TechSolutions Inc.", legal: "TechSolutions S.A.S", nit: "900.123.456-1", code: "TS", color: "from-emerald-500 to-teal-400"},
                                {name: "Innovate Devs", legal: "Innovate Developers Ltda.", nit: "800.987.654-3", code: "ID", color: "from-purple-500 to-indigo-500"},
                                {name: "Global Systems", legal: "Global Systems Corp.", nit: "901.555.222-8", code: "GS", color: "from-orange-500 to-red-500"},
                                {name: "Alpha Logistics", legal: "Alpha Logistica & Transporte", nit: "900.555.111-9", code: "AL", color: "from-blue-500 to-cyan-400"},
                            ].map((org, i) => (
                                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-9 rounded-lg bg-gradient-to-tr ${org.color} flex items-center justify-center text-white text-xs font-bold shadow-md`}>{org.code}</div>
                                            <span className="font-bold text-slate-900 dark:text-white">{org.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{org.legal}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{org.nit}</td>
                                    <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                Activo
                                            </div>
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                        <div className="inline-block align-bottom bg-white dark:bg-[#16222b] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-slate-200 dark:border-[#233948] relative z-10">
                            <div className="px-6 py-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Building2 className="text-primary" />
                                    Nueva Organización
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre Comercial</label>
                                        <input className="w-full rounded-xl bg-slate-50 dark:bg-[#111b22] border border-slate-300 dark:border-[#233948] px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Ej. TechSolutions" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Razón Social</label>
                                        <input className="w-full rounded-xl bg-slate-50 dark:bg-[#111b22] border border-slate-300 dark:border-[#233948] px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Ej. TechSolutions S.A.S" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#111b22]/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-slate-200 dark:border-[#233948]">
                                <button onClick={() => setShowModal(false)} className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-primary text-base font-bold text-white hover:bg-primary-dark sm:ml-3 sm:w-auto sm:text-sm">Crear</button>
                                <button onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 dark:border-[#233948] px-4 py-2.5 bg-transparent text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationsScreen;
