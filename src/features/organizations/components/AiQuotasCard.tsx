import React, { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import { aiService, type AiOrganizationQuota } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { formatNumber } from '../../../shared/format';
import { Button, Card, Input, ProgressBar, TABLE_CLASS, TBODY_CLASS, TD_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS } from '../../../shared/ui';
import { quotaVariant } from '../../ai/AiUsagePage';

/**
 * Monthly AI quota of every organization, for platform operators only: the API returns an empty list for anyone
 * else (org admins included), so the card renders nothing and nobody can raise their own quota.
 */
export const AiQuotasCard: React.FC = () => {
    const { showNotification } = useNotification();
    const [quotas, setQuotas] = useState<AiOrganizationQuota[]>([]);
    // Draft per organization: '' restores the platform default
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);

    const load = () => aiService.listQuotas().then(r => {
        const list = r.data ?? [];
        setQuotas(list);
        setDrafts(Object.fromEntries(list.map(q => [q.organizationId, q.monthlyTokenQuota?.toString() ?? ''])));
    }, () => setQuotas([]));

    useEffect(() => { load(); }, []);

    if (quotas.length === 0) return null;

    const save = async (q: AiOrganizationQuota) => {
        const raw = drafts[q.organizationId]?.trim() ?? '';
        if (raw !== '' && !/^\d+$/.test(raw)) {
            showNotification({ type: 'error', message: 'La cuota debe ser un número entero de tokens o quedar vacía.' });
            return;
        }
        setSaving(q.organizationId);
        try {
            await aiService.setQuota(q.organizationId, raw === '' ? null : Number(raw));
            showNotification({ type: 'success', message: `Cuota de IA de ${q.name} actualizada` });
            await load();
        } catch {
            // el listener global muestra el error
        } finally {
            setSaving(null);
        }
    };

    return (
        <Card className="mt-6" padding="none">
            <div className="flex items-center gap-2 p-6 pb-2">
                <Gauge className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cuotas mensuales de IA por organización</h2>
            </div>
            <p className="px-6 pb-4 text-sm text-slate-500 dark:text-slate-400">
                Solo el operador de la plataforma la asigna. Vacío usa la cuota estándar.
            </p>
            <div className="overflow-x-auto">
                <table className={TABLE_CLASS}>
                    <thead className={THEAD_CLASS}>
                        <tr>
                            <th className={TH_CLASS}>Organización</th>
                            <th className={TH_CLASS}>Consumo del mes</th>
                            <th className={TH_CLASS}>Cuota propia (tokens)</th>
                            <th className={TH_CLASS}><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className={TBODY_CLASS}>
                        {quotas.map(q => (
                            <tr key={q.organizationId} className={TR_CLASS}>
                                <td className={`${TD_CLASS} font-semibold text-slate-900 dark:text-white`}>{q.name}</td>
                                <td className={TD_CLASS}>
                                    <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">
                                        {formatNumber(q.used, 0)} de {formatNumber(q.effectiveQuota, 0)} ({formatNumber(q.percent)} %)
                                    </p>
                                    <ProgressBar value={q.used} max={Math.max(q.effectiveQuota, 1)} variant={quotaVariant(q.percent)} size="sm" className="w-40" />
                                </td>
                                <td className={TD_CLASS}>
                                    <Input
                                        inputSize="sm"
                                        inputMode="numeric"
                                        aria-label={`Cuota mensual de IA de ${q.name}`}
                                        placeholder="Estándar"
                                        value={drafts[q.organizationId] ?? ''}
                                        onChange={(e) => setDrafts(d => ({ ...d, [q.organizationId]: e.target.value }))}
                                    />
                                </td>
                                <td className={`${TD_CLASS} text-right`}>
                                    <Button size="sm" isLoading={saving === q.organizationId} onClick={() => save(q)}>Guardar</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
