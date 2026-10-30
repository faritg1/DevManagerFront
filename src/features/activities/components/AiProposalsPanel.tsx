import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { ProposalResponse, WorkItemResponse } from '../../../shared/api';
import { formatDate } from '../../../shared/format';
import { Card } from '../../../shared/ui';
import { ProposalReview } from './ProposalReview';
import type { Member } from './WorkItemFormModal';

interface Props {
    proposals: ProposalResponse[];
    members: Member[];
    canDecide: boolean;
    /** The proposal left the pending list (confirmed or rejected); `created` is empty when rejected. */
    onDecided: (actionId: string, created: WorkItemResponse[]) => void;
    onStale: () => void;
    /** Expanded on first render (e.g. right after generating one). */
    defaultOpen?: boolean;
}

/** Pending AI proposals of the project (not expired), newest first; collapsed so it does not push the board down. */
export const AiProposalsPanel: React.FC<Props> = ({ proposals, members, canDecide, onDecided, onStale, defaultOpen = false }) => {
    if (proposals.length === 0) return null;
    return (
        <Card className="mb-4" padding="none" aria-label="Propuestas de IA">
            <details open={defaultOpen} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-4 [&::-webkit-details-marker]:hidden">
                    <Sparkles size={18} className="text-primary" aria-hidden="true" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Propuestas de IA</h2>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {proposals.length} pendiente{proposals.length === 1 ? '' : 's'}
                    </span>
                    <ChevronDown size={18} className="ml-auto text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="px-4 pb-4">
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        Nada se crea hasta que confirmes. Cada propuesta vence a los 7 días.
                    </p>
                    <div className="space-y-4">
                        {proposals.map((p) => (
                            <section key={p.actionId} aria-label={`Propuesta ${formatDate(p.createdAt)}`} className="rounded-xl border border-slate-200 p-3 dark:border-border-dark">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.requirement}</p>
                                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                    {p.items.length} actividades · vence {formatDate(p.expiresAt)}
                                </p>
                                {p.truncated && (
                                    <p role="status" className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                                        La IA propuso más de 20 actividades: solo se conservaron las primeras 20.
                                    </p>
                                )}
                                <ProposalReview
                                    proposal={p}
                                    members={members}
                                    canDecide={canDecide}
                                    onConfirmed={(created) => onDecided(p.actionId, created)}
                                    onRejected={() => onDecided(p.actionId, [])}
                                    onFailed={onStale}
                                />
                            </section>
                        ))}
                    </div>
                </div>
            </details>
        </Card>
    );
};
