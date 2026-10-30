import React from 'react';
import { Sparkles } from 'lucide-react';
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
}

/** Pending AI proposals of the project (not expired), newest first. */
export const AiProposalsPanel: React.FC<Props> = ({ proposals, members, canDecide, onDecided, onStale }) => {
    if (proposals.length === 0) return null;
    return (
        <Card className="mb-4" aria-label="Propuestas de IA">
            <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Sparkles size={18} className="text-primary" aria-hidden="true" /> Propuestas de IA
            </h2>
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
        </Card>
    );
};
