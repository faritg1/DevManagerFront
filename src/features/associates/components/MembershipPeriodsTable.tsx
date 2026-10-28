import React from 'react';
import type { MembershipPeriodDto } from '../../../shared/api/types';
import { formatDate } from '../labels';

export const MembershipPeriodsTable: React.FC<{ periods: MembershipPeriodDto[] }> = ({ periods }) => {
    if (periods.length === 0) {
        return <p className="text-sm text-slate-500">Sin periodos de membresía.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-[#233948]">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Solicitud</th>
                        <th className="py-2 pr-4">Ingreso</th>
                        <th className="py-2 pr-4">Retiro</th>
                        <th className="py-2">Motivo</th>
                    </tr>
                </thead>
                <tbody className="text-slate-900 dark:text-white">
                    {periods.map((p, i) => (
                        <tr key={p.id} className="border-b border-slate-100 dark:border-[#233948]/50">
                            <td className="py-2 pr-4">{i + 1}</td>
                            <td className="py-2 pr-4">{formatDate(p.applicationDate)}</td>
                            <td className="py-2 pr-4">{formatDate(p.admissionDate)}</td>
                            <td className="py-2 pr-4">{p.withdrawalDate ? formatDate(p.withdrawalDate) : 'Vigente'}</td>
                            <td className="py-2">{p.withdrawalReason ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
