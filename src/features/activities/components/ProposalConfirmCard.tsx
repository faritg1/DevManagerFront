import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { workItemsService, type ProposalResponse } from '../../../shared/api';
import { ROUTES } from '../../../shared/config/constants';
import { usePermission } from '../../../shared/hooks';
import { ProposalReview } from './ProposalReview';

type Outcome = { kind: 'confirmed'; count: number } | { kind: 'rejected' };

/** Compact card in the AI chat for a proposal the assistant just generated: confirm all, reject, or open the project's Activities. */
export const ProposalConfirmCard: React.FC<{ actionId: string; projectId: string }> = ({ actionId, projectId }) => {
    const { has, isAdmin } = usePermission();
    const [proposal, setProposal] = useState<ProposalResponse | null>(null);
    const [failed, setFailed] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);

    useEffect(() => {
        workItemsService.proposal(actionId).then((r) => setProposal(r.data), () => setFailed(true));
    }, [actionId]);

    const open = proposal?.status === 'PENDING_APPROVAL' && !proposal.expired;
    const canDecide = open && !outcome && (isAdmin || has('menu.platform.activities.create'));
    const status = outcome?.kind === 'confirmed' ? `${outcome.count} actividades creadas en el Backlog.`
        : outcome?.kind === 'rejected' ? 'Propuesta rechazada.'
        : proposal?.status === 'APPROVED' ? 'Propuesta ya confirmada.'
        : proposal?.status === 'REJECTED' ? 'Propuesta rechazada.'
        : proposal?.expired ? 'La propuesta venció.' : null;

    return (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm" role="group" aria-label="Propuesta de actividades">
            <p className="mb-2 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                <Sparkles size={14} className="text-primary" aria-hidden="true" /> Propuesta de actividades
            </p>
            {failed ? (
                <p className="text-slate-600 dark:text-slate-300">No se pudo cargar la propuesta.</p>
            ) : !proposal ? (
                <p className="text-slate-500">Cargando propuesta…</p>
            ) : (<>
                {proposal.truncated && <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">Solo se conservaron las primeras 20 actividades.</p>}
                <ProposalReview
                    proposal={proposal}
                    members={[]}
                    canDecide={!!canDecide}
                    editable={false}
                    onConfirmed={(created) => setOutcome({ kind: 'confirmed', count: created.length })}
                    onRejected={() => setOutcome({ kind: 'rejected' })}
                    onFailed={() => workItemsService.proposal(actionId).then((r) => setProposal(r.data), () => undefined)}
                />
            </>)}
            {status && <p role="status" className="mt-2 text-slate-700 dark:text-slate-200">{status}</p>}
            <Link to={`${ROUTES.ACTIVITIES}/${projectId}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                Abrir en Actividades (editar antes de confirmar)
            </Link>
        </div>
    );
};
