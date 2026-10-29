import React, { Suspense, lazy, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button, LoadingBlock, Modal } from '../../shared/ui';
import { useAiCapabilities } from './useAiChat';

// Loaded on first open so module pages do not ship the markdown renderer up front.
const AiChatPanel = lazy(() => import('./AiChatPanel').then(m => ({ default: m.AiChatPanel })));

/** "Preguntar a la IA" for one module: opens the assistant in a side drawer. Renders nothing unless the user may ask about that module. */
export const AskAiButton: React.FC<{ moduleKey: string }> = ({ moduleKey }) => {
    const caps = useAiCapabilities();
    const [open, setOpen] = useState(false);
    const module = caps?.allowed.find(c => c.key === moduleKey);
    if (!module) return null;
    return (
        <>
            <Button variant="secondary" icon={Sparkles} onClick={() => setOpen(true)}>
                Preguntar a la IA
            </Button>
            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                variant="drawer"
                size="xl"
                title={`Asistente IA · ${module.name}`}
                icon={<Sparkles className="shrink-0 text-primary" size={20} aria-hidden="true" />}
            >
                <Suspense fallback={<LoadingBlock />}>
                    <AiChatPanel moduleKey={moduleKey} compact />
                </Suspense>
            </Modal>
        </>
    );
};
