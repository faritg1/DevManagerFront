import React, { useEffect, useState } from 'react';
import { workItemsService, type ProposalResponse } from '../../../shared/api';
import { Button, Modal, Textarea } from '../../../shared/ui';

const MAX_LENGTH = 2000;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onGenerated: (proposal: ProposalResponse) => void;
}

/** Asks the AI for a proposal of activities from a free-text requirement. Costs AI quota, so it only runs on request. */
export const GenerateProposalModal: React.FC<Props> = ({ isOpen, onClose, projectId, onGenerated }) => {
    const [requirement, setRequirement] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => { if (isOpen) setRequirement(''); }, [isOpen]);

    const submit = async () => {
        setBusy(true);
        try {
            // Quota errors (AI_BUDGET_EXCEEDED / AI_MONTHLY_QUOTA_EXCEEDED) reach the user through the global error toast.
            const { data } = await workItemsService.propose(projectId, requirement.trim());
            onGenerated(data);
            onClose();
        } catch {
            // el listener global muestra el error
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={busy ? () => undefined : onClose}
            title="Generar propuesta con IA"
            size="lg"
            onSubmit={submit}
            footer={<>
                <Button type="submit" isLoading={busy} disabled={!requirement.trim()}>Generar propuesta</Button>
                <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
            </>}
        >
            <Textarea
                label="Requerimiento"
                rows={6}
                required
                maxLength={MAX_LENGTH}
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                hint={`${requirement.length}/${MAX_LENGTH}`}
                placeholder="Describe lo que se necesita construir; la IA propondrá historias, tareas y subtareas."
            />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Solo se genera cuando lo pides y consume la cuota de IA de tu organización. La propuesta no crea nada hasta que la confirmes,
                incluye hasta 20 actividades y vence a los 7 días.
            </p>
        </Modal>
    );
};
