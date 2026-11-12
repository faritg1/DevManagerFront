import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, FileCheck2, type LucideIcon } from 'lucide-react';
import { documentsService } from '../../shared/api';
import { documentDetailPath } from '../../shared/config/constants';
import {
    Card, EmptyState, PageContainer, PageHeader, SkeletonRows, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TD_TRUNCATE_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS,
} from '../../shared/ui';
import { CODE_LINK_CLASS } from './labels';
import { useRows } from './useRows';

interface QueueProps<T> {
    title: string;
    description: string;
    icon: LucideIcon;
    rows: T[] | null | undefined;
    empty: string;
    headers: string[];
    rowKey: (row: T) => string;
    cells: (row: T) => React.ReactNode[];
}

/** A short list of documents waiting for the user, with one link per row. */
const Queue = <T,>({ title, description, icon: Icon, rows, empty, headers, rowKey, cells }: QueueProps<T>) => (
    <PageContainer>
        <PageHeader icon={<Icon className="shrink-0 text-primary" size={24} aria-hidden="true" />} title={title} description={description} />
        <Card padding="none" className="overflow-hidden">
            {rows === null ? (
                <EmptyState title="No se pudo cargar la lista" />
            ) : !rows ? (
                <SkeletonRows />
            ) : rows.length === 0 ? (
                <EmptyState icon={Icon} title={empty} />
            ) : (
                <div className="overflow-x-auto">
                    <table className={TABLE_CLASS}>
                        <thead className={THEAD_CLASS}>
                            <tr>{headers.map((h) => <th key={h} className={TH_CLASS}>{h}</th>)}</tr>
                        </thead>
                        <tbody className={TBODY_CLASS}>
                            {rows.map((row) => (
                                <tr key={rowKey(row)} className={TR_CLASS}>
                                    {cells(row).map((cell, i) => <td key={headers[i]} className={TD_CLASS}>{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    </PageContainer>
);

const truncated = (text: string) => <span className={TD_TRUNCATE_CLASS} title={text}>{text}</span>;

const loadPending = () => documentsService.pendingReads();
const loadInReview = () => documentsService.list({ status: 'InReview' });

/** Current versions the user still has to confirm as read. Only what is pending: there is no history. */
export const PendingReadsPage: React.FC = () => (
    <Queue
        title="Mis lecturas"
        description="Versiones vigentes que te distribuyeron y aún no confirmas."
        icon={BookOpenCheck}
        rows={useRows(loadPending)}
        empty="No tienes documentos por confirmar"
        headers={['Código', 'Versión', 'Título']}
        rowKey={(p) => p.versionId}
        cells={(p) => [
            <Link className={CODE_LINK_CLASS} to={`${documentDetailPath(p.documentId)}?version=${p.versionId}`}>{p.code}</Link>,
            `v${p.versionNumber}`,
            truncated(p.title),
        ]}
    />
);

/** Documents with a version in review, for whoever may approve. */
export const AwaitingApprovalPage: React.FC = () => (
    <Queue
        title="Por aprobar"
        description="Versiones enviadas a revisión que esperan una decisión."
        icon={FileCheck2}
        rows={useRows(loadInReview)}
        empty="No hay versiones esperando aprobación"
        headers={['Código', 'Título', 'Elaborador']}
        rowKey={(d) => d.id}
        cells={(d) => [
            <Link className={CODE_LINK_CLASS} to={documentDetailPath(d.id)}>{d.code}</Link>,
            truncated(d.title),
            d.inReviewElaboratedByName ?? '—',
        ]}
    />
);
