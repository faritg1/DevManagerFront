import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, CalendarClock, FileCheck2, FolderOpen, FolderTree, Home, type LucideIcon } from 'lucide-react';
import { documentsService } from '../../shared/api';
import { ROUTES } from '../../shared/config/constants';
import { usePermission } from '../../shared/hooks';
import { PageContainer, PageHeader, StatCard } from '../../shared/ui';
import { PERMISSIONS, REVIEW_WINDOW_DAYS, UNCLASSIFIED } from './labels';
import { useRows } from './useRows';

const loadPending = () => documentsService.pendingReads();
const loadInReview = () => documentsService.list({ status: 'InReview' });
const loadAll = () => documentsService.list({});

// ponytail: the browser's local date, not the API's Colombia clock; a count can differ by one document around midnight.
const reviewLimit = (): string => new Date(Date.now() + REVIEW_WINDOW_DAYS * 86_400_000).toLocaleDateString('en-CA');

const CountCard: React.FC<{ title: string; to: string; icon: LucideIcon; count: number | null | undefined }> = ({ title, to, icon, count }) => (
    <Link to={to} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark">
        <StatCard
            title={title}
            icon={icon}
            value={count ?? '…'}
            error={count === null ? 'No se pudo cargar' : undefined}
            className="h-full transition-colors duration-[120ms] hover:border-slate-300 dark:hover:border-input-border"
        />
    </Link>
);

/** Module home: one count per card, each from its own query, so a failed one does not take the others down. */
export const DocumentsHomePage: React.FC = () => {
    const canApprove = usePermission().has(PERMISSIONS.APPROVE);
    const pending = useRows(loadPending);
    const inReview = useRows(loadInReview, canApprove);
    const all = useRows(loadAll);
    const current = all?.filter((d) => d.currentVersionId);
    const limit = reviewLimit();

    return (
        <PageContainer>
            <PageHeader
                icon={<Home className="shrink-0 text-primary" size={24} aria-hidden="true" />}
                title="Gestión documental"
                description="Lo que tienes pendiente y el estado de los documentos de la entidad."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <CountCard title="Por confirmar lectura" to={ROUTES.DOCUMENT_READS} icon={BookOpenCheck} count={pending && pending.length} />
                {canApprove && <CountCard title="Por aprobar" to={ROUTES.DOCUMENT_APPROVALS} icon={FileCheck2} count={inReview && inReview.length} />}
                <CountCard title="Documentos vigentes" to={ROUTES.DOCUMENTS} icon={FolderOpen} count={all === undefined ? undefined : current?.length ?? null} />
                <CountCard
                    title="Revisión próxima o vencida"
                    to={ROUTES.DOCUMENTS}
                    icon={CalendarClock}
                    count={all === undefined ? undefined : current?.filter((d) => d.reviewDate && d.reviewDate.slice(0, 10) <= limit).length ?? null}
                />
                <CountCard
                    title="Sin clasificar"
                    to={`${ROUTES.DOCUMENTS}?serie=${UNCLASSIFIED}`}
                    icon={FolderTree}
                    count={all && all.filter((d) => !d.classificationNodeId).length}
                />
            </div>
        </PageContainer>
    );
};
