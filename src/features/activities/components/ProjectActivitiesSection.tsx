import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KanbanSquare } from 'lucide-react';
import { workItemsService, type WorkItemSummaryResponse } from '../../../shared/api';
import { useActivitiesSettings, usePermission } from '../../../shared/hooks';
import { Badge, Button, Card } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { STATUS_LABELS, STATUS_ORDER, STATUS_VARIANTS } from '../workItemMeta';
import { ProgressMeter } from './ProjectProgress';

/**
 * Activities overview on the project detail: progress, counts by status, overdue / due soon and a link to the board.
 * Hidden without the permission, when the organization turns it off, or when the summary cannot be read (e.g. not a member).
 */
export const ProjectActivitiesSection: React.FC<{ projectId: string }> = ({ projectId }) => {
    const { has } = usePermission();
    const allowed = has('menu.platform.activities');
    const canCreate = has('menu.platform.activities.create');
    const { showOnProjectDetail, timeTrackingEnabled } = useActivitiesSettings();
    const [summary, setSummary] = useState<WorkItemSummaryResponse | null>(null);

    useEffect(() => {
        setSummary(null);
        if (!allowed) return;
        let live = true;
        workItemsService.summary(projectId).then((r) => live && setSummary(r.data ?? null), () => undefined);
        return () => { live = false; };
    }, [projectId, allowed]);

    if (!allowed || !showOnProjectDetail || !summary || (summary.total === 0 && !canCreate)) return null;

    const board = (
        <Link to={`${ROUTES.ACTIVITIES}/${projectId}`}>
            <Button variant="outline" size="sm" icon={KanbanSquare}>Ver tablero</Button>
        </Link>
    );

    return (
        <section aria-labelledby="project-activities">
            <Card>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 id="project-activities" className="text-lg font-bold text-slate-900 dark:text-white">Actividades</h2>
                    {board}
                </div>
                {summary.total === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Este proyecto aún no tiene actividades.</p>
                ) : (<>
                    {summary.progressPercent !== null && <ProgressMeter percent={summary.progressPercent} className="mb-4" />}
                    <div className="flex flex-wrap gap-2">
                        {STATUS_ORDER.filter((s) => summary.byStatus?.[s]).map((s) => (
                            <Badge key={s} variant={STATUS_VARIANTS[s]}>{STATUS_LABELS[s]}: {summary.byStatus[s]}</Badge>
                        ))}
                        <Badge variant="danger">Vencidas: {summary.overdue ?? 0}</Badge>
                        <Badge variant="warning">Por vencer: {summary.dueSoon ?? 0}</Badge>
                        {timeTrackingEnabled && <Badge variant="info">Horas dedicadas: {summary.spentHours ?? 0} h</Badge>}
                    </div>
                </>)}
            </Card>
        </section>
    );
};
