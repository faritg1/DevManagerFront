import React from 'react';
import type { MembershipPeriodDto } from '../../../shared/api/types';
import { formatDate } from '../labels';
import { TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TH_CLASS as TH, TD_CLASS as TD, TR_CLASS, TD_TRUNCATE_CLASS } from '../../../shared/ui';

export const MembershipPeriodsTable: React.FC<{ periods: MembershipPeriodDto[] }> = ({ periods }) => {
    if (periods.length === 0) {
        return <p className="text-sm text-slate-500 dark:text-slate-400">Sin periodos de membresía.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className={TABLE_CLASS}>
                <thead className={THEAD_CLASS}>
                    <tr>
                        <th className={TH}>#</th>
                        <th className={TH}>Solicitud</th>
                        <th className={TH}>Ingreso</th>
                        <th className={TH}>Retiro</th>
                        <th className={TH}>Motivo</th>
                    </tr>
                </thead>
                <tbody className={`${TBODY_CLASS} text-slate-900 dark:text-white`}>
                    {periods.map((p, i) => (
                        <tr key={p.id} className={TR_CLASS}>
                            <td className={TD}>{i + 1}</td>
                            <td className={TD}>{formatDate(p.applicationDate)}</td>
                            <td className={TD}>{formatDate(p.admissionDate)}</td>
                            <td className={TD}>{p.withdrawalDate ? formatDate(p.withdrawalDate) : 'Vigente'}</td>
                            <td className={TD}><span className={TD_TRUNCATE_CLASS} title={p.withdrawalReason ?? undefined}>{p.withdrawalReason ?? '—'}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
