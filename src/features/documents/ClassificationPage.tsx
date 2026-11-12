import React, { useCallback, useState } from 'react';
import { FolderPlus, FolderTree, Info, Pencil, Plus, Tag, X } from 'lucide-react';
import { documentsService, type ClassificationNode, type DocumentaryType } from '../../shared/api';
import { useNotification } from '../../shared/context';
import { type CsvColumn } from '../../shared/export';
import { usePermission } from '../../shared/hooks';
import { Badge, Button, Card, EmptyState, ExportButton, IconButton, Input, Modal, PageContainer, PageHeader, SkeletonRows } from '../../shared/ui';
import { errorText, needsLocalToast } from '../associates/labels';
import { ClassificationNodeDialog, type NodeTarget } from './components/ClassificationNodeDialog';
import { DISPOSITION, PERMISSIONS, retentionText } from './labels';
import { useRows } from './useRows';

/** One line of the retention table: a node with the names of the levels above it. */
interface Row {
    node: ClassificationNode;
    section: ClassificationNode;
    series?: ClassificationNode;
    subseries?: ClassificationNode;
}

const flatten = (tree: ClassificationNode[]): Row[] => tree.flatMap<Row>((section) => [
    { node: section, section },
    ...section.children.flatMap((series) => [
        { node: series, section, series },
        ...series.children.map((subseries) => ({ node: subseries, section, series, subseries })),
    ]),
]);

const EXPORT_COLUMNS: CsvColumn<Row>[] = [
    { header: 'Código', value: (r) => r.node.code },
    { header: 'Sección', value: (r) => r.section.name },
    { header: 'Serie', value: (r) => r.series?.name },
    { header: 'Subserie', value: (r) => r.subseries?.name },
    { header: 'Tipos documentales', value: (r) => r.node.types.map((t) => t.name).join(', ') },
    { header: 'Gestión', value: (r) => r.node.retention?.managementYears },
    { header: 'Central', value: (r) => r.node.retention?.centralYears },
    { header: 'Disposición', value: (r) => (r.node.retention?.finalDisposition ? DISPOSITION[r.node.retention.finalDisposition] : '') },
    { header: 'Procedimiento', value: (r) => r.node.retention?.procedure },
    { header: 'Soporte legal', value: (r) => r.node.retention?.legalBasis },
];

const CHILD_LABEL = { 1: 'Nueva serie', 2: 'Nueva subserie' } as const;

/** What `.manage` allows on a node; absent for whoever only reads. */
interface Actions {
    open: (target: NodeTarget) => void;
    addType: (node: ClassificationNode) => void;
    removeType: (node: ClassificationNode, type: DocumentaryType) => void;
}

const NodeItem: React.FC<{ node: ClassificationNode; actions?: Actions }> = ({ node, actions }) => {
    const classifies = node.level > 1;
    const { procedure, legalBasis } = node.retention ?? {};
    return (
        <li>
            <div className="flex items-start gap-2 py-2">
                <div className="min-w-0 flex-1">
                    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-900 dark:text-white ${classifies ? 'text-sm' : 'text-base font-bold'}`}>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{node.code}</span>
                        <span className="min-w-0 break-words font-semibold">{node.name}</span>
                        {!node.isActive && <Badge>Inactiva</Badge>}
                    </p>
                    {classifies && (
                        <div className="mt-1 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                {retentionText(node.retention) ?? 'Sin retención definida'}
                                {node.retention?.inherited && <Badge variant="info">Heredada de la serie</Badge>}
                            </p>
                            {procedure && <p className="break-words">Procedimiento: {procedure}</p>}
                            {legalBasis && <p className="break-words">Soporte legal: {legalBasis}</p>}
                        </div>
                    )}
                    {node.types.length > 0 && (
                        <ul aria-label={`Tipos documentales de ${node.code}`} className="mt-2 flex flex-wrap gap-1.5">
                            {node.types.map((t) => (
                                <li key={t.id} className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-slate-200 pl-2 text-xs font-medium text-slate-700 dark:border-border-dark dark:text-slate-200">
                                    <Tag size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
                                    <span className={`min-w-0 break-words ${actions ? '' : 'py-1 pr-2'}`}>{t.name}</span>
                                    {actions && <IconButton icon={X} label={`Quitar tipo ${t.name} de ${node.code}`} className="!size-7 [@media(pointer:coarse)]:!size-11" onClick={() => actions.removeType(node, t)} />}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {actions && (
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {classifies && <IconButton icon={Tag} label={`Agregar tipo a ${node.code}`} onClick={() => actions.addType(node)} />}
                        {node.level < 3 && <IconButton icon={FolderPlus} label={`${CHILD_LABEL[node.level]} en ${node.code}`} onClick={() => actions.open({ parent: node })} />}
                        <IconButton icon={Pencil} label={`Editar ${node.code}`} onClick={() => actions.open({ node })} />
                    </div>
                )}
            </div>
            {node.children.length > 0 && (
                <ul className="ml-2 border-l border-slate-200 pl-3 sm:ml-3 sm:pl-4 dark:border-border-dark">
                    {node.children.map((child) => <NodeItem key={child.id} node={child} actions={actions} />)}
                </ul>
            )}
        </li>
    );
};

/** The organization's classification chart: sections, series and subseries with their retention and document types. */
export const ClassificationPage: React.FC = () => {
    const canManage = usePermission().has(PERMISSIONS.CLASSIFICATION_MANAGE);
    const { showNotification } = useNotification();
    const [reload, setReload] = useState(0);
    // A new function after each change makes `useRows` ask for the tree again.
    const load = useCallback(() => documentsService.classification(), [reload]);
    const tree = useRows(load);
    const [target, setTarget] = useState<NodeTarget | null>(null);
    const [typeFor, setTypeFor] = useState<ClassificationNode | null>(null);
    const [typeName, setTypeName] = useState('');
    const [saving, setSaving] = useState(false);

    const refresh = () => setReload((n) => n + 1);

    /** Runs a change on the document types and reloads; false when the API refused it. */
    const changeTypes = async (call: () => Promise<unknown>, message: string): Promise<boolean> => {
        if (saving) return false;
        setSaving(true);
        try {
            await call();
            showNotification({ type: 'success', message });
            refresh();
            return true;
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
            return false;
        } finally {
            setSaving(false);
        }
    };

    const addType = async () => {
        if (typeFor && await changeTypes(() => documentsService.addType(typeFor.id, typeName.trim()), 'Tipo documental agregado')) setTypeFor(null);
    };

    const actions: Actions | undefined = canManage ? {
        open: setTarget,
        addType: (node) => { setTypeName(''); setTypeFor(node); },
        removeType: (node, type) => { void changeTypes(() => documentsService.removeType(node.id, type.id), 'Tipo documental quitado'); },
    } : undefined;

    return (
        <PageContainer>
            <PageHeader
                icon={<FolderTree className="shrink-0 text-primary" size={24} aria-hidden="true" />}
                title="Cuadro de clasificación"
                description="Secciones, series y subseries de la entidad, con sus tiempos de retención y tipos documentales."
                actions={<>
                    <ExportButton rows={flatten(tree ?? [])} columns={EXPORT_COLUMNS} filename="cuadro-clasificacion" />
                    {canManage && <Button icon={Plus} onClick={() => setTarget({})}>Nueva sección</Button>}
                </>}
            />

            <p role="note" className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-slate-100">
                <Info size={16} className="mt-0.5 shrink-0 text-primary-600 dark:text-primary" aria-hidden="true" />
                Los tiempos los define la entidad. DevManager no valida su cumplimiento legal.
            </p>

            {tree === null ? (
                <Card><EmptyState title="No se pudo cargar el cuadro de clasificación" action={<Button variant="outline" size="sm" onClick={refresh}>Reintentar</Button>} /></Card>
            ) : !tree ? (
                <Card padding="none" className="overflow-hidden"><SkeletonRows /></Card>
            ) : tree.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={FolderTree}
                        title="Aún no hay cuadro de clasificación"
                        description={canManage ? 'Crea la primera sección y agrégale sus series.' : undefined}
                    />
                </Card>
            ) : (
                <div className="space-y-4">
                    {tree.map((section) => (
                        <Card key={section.id} padding="sm">
                            <ul><NodeItem node={section} actions={actions} /></ul>
                        </Card>
                    ))}
                </div>
            )}

            {target && (
                <ClassificationNodeDialog
                    {...target}
                    onClose={() => setTarget(null)}
                    onSaved={() => { setTarget(null); refresh(); }}
                />
            )}

            {typeFor && (
                <Modal
                    isOpen
                    onClose={() => setTypeFor(null)}
                    onSubmit={addType}
                    title={`Nuevo tipo documental en ${typeFor.code}`}
                    footer={<>
                        <Button type="submit" isLoading={saving}>Guardar</Button>
                        <Button variant="ghost" onClick={() => setTypeFor(null)}>Cancelar</Button>
                    </>}
                >
                    <Input label="Nombre" value={typeName} onChange={(e) => setTypeName(e.target.value)} maxLength={100} required placeholder="Ej. Acta de asamblea" />
                </Modal>
            )}
        </PageContainer>
    );
};
