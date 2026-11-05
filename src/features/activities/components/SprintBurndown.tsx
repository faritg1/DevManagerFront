import React from 'react';
import { WorkItemStatus, type SprintResponse, type WorkItemResponse } from '../../../shared/api';
import { asUtc, formatDate } from '../../../shared/format';
import { dayOf } from '../workItemMeta';

interface Point { day: string; ideal: number; remaining: number | null }

/** Remaining work per sprint day: estimate hours when any item has one, otherwise item count; future days have no actual value. */
export const burndown = (sprint: SprintResponse, items: WorkItemResponse[], today: string) => {
    const mine = items.filter((i) => i.sprintId === sprint.id && i.status !== WorkItemStatus.Cancelled);
    const byHours = mine.some((i) => (i.estimateHours ?? 0) > 0);
    const size = (i: WorkItemResponse) => (byHours ? i.estimateHours ?? 0 : 1);
    const total = mine.reduce((s, i) => s + size(i), 0);

    const days: string[] = [];
    for (let d = new Date(`${dayOf(sprint.startDate)}T00:00:00`); d.toLocaleDateString('en-CA') <= dayOf(sprint.endDate); d.setDate(d.getDate() + 1))
        days.push(d.toLocaleDateString('en-CA'));

    const points: Point[] = days.map((day, n) => ({
        day,
        ideal: days.length > 1 ? total * (1 - n / (days.length - 1)) : 0,
        remaining: day > today ? null : total - mine
            .filter((i) => i.status === WorkItemStatus.Done && i.completedAt && new Date(asUtc(i.completedAt)).toLocaleDateString('en-CA') <= day)
            .reduce((s, i) => s + size(i), 0),
    }));
    return { points, total, unit: byHours ? 'h' : 'actividades' };
};

const W = 600, H = 220, PAD = { l: 40, r: 12, t: 12, b: 28 };
const round = (n: number) => Math.round(n * 10) / 10;

/** Sprint burndown: remaining work vs the ideal straight line, with a per-day tooltip and a table for screen readers. */
export const SprintBurndown: React.FC<{ sprint: SprintResponse; items: WorkItemResponse[] }> = ({ sprint, items }) => {
    const { points, total, unit } = burndown(sprint, items, new Date().toLocaleDateString('en-CA'));
    if (total === 0) return <p className="text-sm text-slate-500">El sprint no tiene actividades para graficar.</p>;

    const x = (n: number) => PAD.l + (points.length > 1 ? (n * (W - PAD.l - PAD.r)) / (points.length - 1) : 0);
    const y = (v: number) => PAD.t + (1 - v / total) * (H - PAD.t - PAD.b);
    const actual = points.map((p, n) => ({ ...p, n })).filter((p) => p.remaining !== null);
    const line = (pts: { n: number; v: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.n)},${y(p.v)}`).join(' ');
    const ticks = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

    return (
        <figure className="space-y-2">
            <figcaption className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-primary" />Pendiente real ({unit})</span>
                <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-slate-400" />Ideal</span>
            </figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Burndown de ${sprint.name}`}>
                {[0, total / 2, total].map((v) => (
                    <g key={v}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200 dark:stroke-white/10" />
                        <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">{round(v)}</text>
                    </g>
                ))}
                {ticks.map((n) => (
                    <text key={n} x={x(n)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">{formatDate(points[n].day)}</text>
                ))}
                <path d={line(points.map((p, n) => ({ n, v: p.ideal })))} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-slate-400" />
                <path d={line(actual.map((p) => ({ n: p.n, v: p.remaining! })))} fill="none" strokeWidth={2} className="stroke-primary" />
                {actual.map((p) => (
                    <g key={p.day} className="group">
                        <circle cx={x(p.n)} cy={y(p.remaining!)} r={4} className="fill-primary stroke-white dark:stroke-slate-900" strokeWidth={2} />
                        {/* Hit target larger than the mark; native tooltip */}
                        <circle cx={x(p.n)} cy={y(p.remaining!)} r={12} fill="transparent">
                            <title>{`${formatDate(p.day)}: ${round(p.remaining!)} ${unit} pendientes (ideal ${round(p.ideal)})`}</title>
                        </circle>
                    </g>
                ))}
            </svg>
            <table className="sr-only">
                <thead><tr><th>Día</th><th>Pendiente</th><th>Ideal</th></tr></thead>
                <tbody>
                    {points.map((p) => (
                        <tr key={p.day}><td>{formatDate(p.day)}</td><td>{p.remaining === null ? '—' : round(p.remaining)}</td><td>{round(p.ideal)}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
};
