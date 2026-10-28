import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, SELECT_CLASS } from '../../../shared/ui';
import { consentsService } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import type { ConsentDto, DataPolicyDto } from '../../../shared/api/types';
import { errorText, formatDateTime, needsLocalToast } from '../labels';

interface Props {
    userId: string;
    onChanged: () => void;
}

export const ConsentsPanel: React.FC<Props> = ({ userId, onChanged }) => {
    const { showNotification } = useNotification();
    const [consents, setConsents] = useState<ConsentDto[]>([]);
    const [policies, setPolicies] = useState<DataPolicyDto[]>([]);
    const [policyId, setPolicyId] = useState('');
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [c, p] = await Promise.all([consentsService.getByUser(userId), consentsService.getPolicies()]);
            setConsents(c.data ?? []);
            setPolicies(p.data ?? []);
            if (p.data?.length) setPolicyId((cur) => cur || p.data[0].id);
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        }
    }, [userId, showNotification]);

    useEffect(() => { load(); }, [load]);

    const run = async (fn: () => Promise<unknown>, okMsg: string) => {
        setBusy(true);
        try {
            await fn();
            showNotification({ type: 'success', message: okMsg });
            setRevokingId(null);
            setReason('');
            await load();
            onChanged();
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setBusy(false);
        }
    };

    const hasActive = consents.some((c) => c.isActive);

    return (
        <div className="space-y-4">
            {!hasActive && (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="consents-politica-vigente-a" className="text-slate-700 dark:text-white text-sm font-bold">Política vigente a aceptar</label>
                        <select id="consents-politica-vigente-a"
                            value={policyId}
                            onChange={(e) => setPolicyId(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            {policies.map((p) => <option key={p.id} value={p.id}>v{p.version} — {p.purpose}</option>)}
                        </select>
                    </div>
                    <Button
                        isLoading={busy}
                        disabled={!policyId}
                        onClick={() => run(() => consentsService.grant(userId, policyId), 'Consentimiento registrado')}
                    >
                        Registrar consentimiento
                    </Button>
                </div>
            )}

            {consents.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Sin consentimientos registrados.</p>
            ) : (
                <ul className="space-y-3">
                    {consents.map((c) => (
                        <li key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-[#233948]">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm text-slate-900 dark:text-white">
                                    <span className="font-bold">v{c.policyVersion}</span> — {c.purpose}
                                </div>
                                <Badge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Activo' : 'Revocado'}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Otorgado: {formatDateTime(c.grantedAt)}</p>
                            {c.revokedAt && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Revocado: {formatDateTime(c.revokedAt)}{c.revocationReason ? ` — ${c.revocationReason}` : ''}
                                </p>
                            )}
                            {c.isActive && (revokingId === c.id ? (
                                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                    <input
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Motivo de la revocación *" aria-label="Motivo de la revocación"
                                        className="flex-1 h-10 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-3 text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        isLoading={busy}
                                        disabled={!reason.trim()}
                                        onClick={() => run(() => consentsService.revoke(c.id, reason.trim()), 'Consentimiento revocado')}
                                    >
                                        Revocar
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setRevokingId(null)}>Cancelar</Button>
                                </div>
                            ) : (
                                <Button size="sm" variant="outline" className="mt-3" onClick={() => { setRevokingId(c.id); setReason(''); }}>
                                    Revocar
                                </Button>
                            ))}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
