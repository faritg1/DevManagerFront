import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { PageContainer, PageHeader } from '../../../shared/ui';
import { AiChatPanel } from '../../ai';

// The old chat kept the whole history in this key; history now lives on the server, so drop the leftover copy.
const LEGACY_CHAT_KEY = 'devmanager_chat_history';

export const AgentsPage: React.FC = () => {
    useEffect(() => {
        try { localStorage.removeItem(LEGACY_CHAT_KEY); } catch { /* storage unavailable */ }
    }, []);

    return (
        <PageContainer fullHeight>
            <PageHeader
                className="!mb-4 sm:!mb-6"
                icon={<Sparkles className="text-primary shrink-0" size={24} aria-hidden="true" />}
                title="Asistente IA"
                description="Pregunta sobre los módulos a los que tienes acceso. Las respuestas citan sus fuentes."
            />
            <div className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-border-dark dark:bg-card-dark">
                <AiChatPanel />
            </div>
        </PageContainer>
    );
};
