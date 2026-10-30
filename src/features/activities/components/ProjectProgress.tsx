import React, { useEffect, useState } from 'react';
import { workItemsService } from '../../../shared/api';
import { usePermission } from '../../../shared/hooks';

/** Project progress (done / non-cancelled activities). Renders nothing when there is no progress to show or it cannot be read. */
export const ProjectProgress: React.FC<{ projectId: string; className?: string }> = ({ projectId, className = '' }) => {
    const { has } = usePermission();
    const allowed = has('menu.platform.activities');
    const [percent, setPercent] = useState<number | null>(null);

    useEffect(() => {
        setPercent(null);
        if (!allowed) return;
        let live = true;
        workItemsService.summary(projectId).then((r) => live && setPercent(r.data?.progressPercent ?? null), () => undefined);
        return () => { live = false; };
    }, [projectId, allowed]);

    if (percent === null) return null;
    return (
        <div className={className} data-testid="project-progress">
            <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Avance por actividades</span>
                <span className="font-semibold text-slate-900 dark:text-white">{percent}%</span>
            </div>
            <div
                role="progressbar"
                aria-label="Avance del proyecto"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            >
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
        </div>
    );
};
