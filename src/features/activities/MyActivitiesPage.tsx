import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo } from 'lucide-react';
import { workItemsService, type MyWorkItemResponse } from '../../shared/api';
import { formatDate } from '../../shared/format';
import {
    Badge, Button, Card, EmptyState, LoadingBlock, PageContainer, PageHeader, Select,
    TABLE_CLASS, TBODY_CLASS, TD_CLASS, TD_TRUNCATE_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS,
} from '../../shared/ui';
import { PRIORITY_LABELS, PRIORITY_VARIANTS, STATUS_LABELS, STATUS_VARIANTS, TYPE_LABELS, TYPE_VARIANTS } from './workItemMeta';
import { DueStateBadge, workItemLink } from './components/DueStateBadge';

/** Open activities assigned to the current user across their projects, soonest due first. */
export const MyActivitiesPage: React.FC = () => {
    /** undefined = loading, null = failed. */
    const [items, setItems] = useState<MyWorkItemResponse[] | null | undefined>(undefined);
    const [projectId, setProjectId] = useState('');

    const load = () => {
        setItems(undefined);
        workItemsService.mine().then((r) => setItems(r.data ?? []), () => setItems(null));
    };
    useEffect(load, []);

    const projects = useMemo(
        () => [...new Map((items ?? []).map((i) => [i.projectId, `${i.projectKeyPrefix ? `${i.projectKeyPrefix} · ` : ''}${i.projectName}`])).entries()],
        [items],
    );
    const visible = (items ?? []).filter((i) => !projectId || i.projectId === projectId);

    return (
        <PageContainer>
            <PageHeader
                icon={<ListTodo size={28} className="text-primary" />}
                title="Mis actividades"
                description="Actividades abiertas asignadas a ti en todos tus proyectos, las que vencen primero arriba."
            />

            {items === undefined ? (
                <LoadingBlock label="Cargando actividades…" />
            ) : items === null ? (
                <EmptyState title="No se pudieron cargar tus actividades" action={<Button variant="outline" onClick={load}>Reintentar</Button>} />
            ) : items.length === 0 ? (
                <EmptyState icon={ListTodo} title="No tienes actividades abiertas asignadas" description="Cuando te asignen una actividad aparecerá aquí." />
            ) : (<>
                <Card className="mb-4">
                    <Select label="Proyecto" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                        <option value="">Todos los proyectos</option>
                        {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </Select>
                </Card>
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className={TABLE_CLASS}>
                            <thead className={THEAD_CLASS}>
                                <tr>
                                    <th className={TH_CLASS}>Clave</th>
                                    <th className={TH_CLASS}>Título</th>
                                    <th className={TH_CLASS}>Proyecto</th>
                                    <th className={TH_CLASS}>Estado</th>
                                    <th className={TH_CLASS}>Prioridad</th>
                                    <th className={TH_CLASS}>Vence</th>
                                </tr>
                            </thead>
                            <tbody className={TBODY_CLASS}>
                                {visible.map((i) => (
                                    <tr key={i.id} className={TR_CLASS}>
                                        <td className={`${TD_CLASS} font-mono text-xs font-semibold`}>{i.key}</td>
                                        <td className={TD_CLASS}>
                                            <Link to={workItemLink(i)} className={`${TD_TRUNCATE_CLASS} font-medium text-slate-900 hover:text-primary hover:underline dark:text-white`} title={i.title}>
                                                {i.title}
                                            </Link>
                                            <span className="mt-1 flex"><Badge variant={TYPE_VARIANTS[i.type]}>{TYPE_LABELS[i.type]}</Badge></span>
                                        </td>
                                        <td className={TD_CLASS}>{i.projectName}</td>
                                        <td className={TD_CLASS}><Badge variant={STATUS_VARIANTS[i.status]}>{STATUS_LABELS[i.status]}</Badge></td>
                                        <td className={TD_CLASS}><Badge variant={PRIORITY_VARIANTS[i.priority]}>{PRIORITY_LABELS[i.priority]}</Badge></td>
                                        <td className={TD_CLASS}>
                                            {formatDate(i.dueDate)}
                                            {i.dueState && <span className="ml-2"><DueStateBadge state={i.dueState} /></span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </>)}
        </PageContainer>
    );
};
