import React, { useCallback, useEffect, useState } from 'react';
import { FilePlus } from 'lucide-react';
import { Button, Card, FormPanel, FormSection, Input, Textarea, PageContainer, PageHeader, LoadingBlock, EmptyState } from '../../../shared/ui';
import { useModal, usePermission } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { consentsService } from '../../../shared/api';
import type { DataPolicyDto } from '../../../shared/api/types';
import { errorText, formatDate, needsLocalToast, versionLabel } from '../labels';
import { AskAiButton } from '../../ai/AskAiButton';

const EMPTY = { version: '', purpose: '', text: '', effectiveFrom: '' };

export const DataPoliciesPage: React.FC = () => {
    const canCreate = usePermission().has('menu.solidarity.data_policies.create');
    const { showNotification } = useNotification();
    const modal = useModal();
    const [items, setItems] = useState<DataPolicyDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState(EMPTY);

    const load = useCallback(async () => {
        try {
            const res = await consentsService.getPolicies();
            setItems(res.data ?? []);
        } catch (e) {
            if (needsLocalToast(e)) showNotification({ type: 'error', message: errorText(e) });
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    const publish = async () => {
        await consentsService.createPolicy({
            version: form.version.trim(),
            purpose: form.purpose.trim(),
            text: form.text.trim(),
            effectiveFrom: form.effectiveFrom || undefined,
        });
        showNotification({ type: 'success', message: 'Política publicada' });
        modal.close();
        setForm(EMPTY);
        await load();
    };

    return (
        <PageContainer className="space-y-6">
            <PageHeader
                title="Políticas de datos"
                description="Las versiones publicadas son inmutables; para cambiar el texto publica una nueva versión."
                actions={<><AskAiButton moduleKey="data_policies" />{canCreate && <Button icon={FilePlus} onClick={modal.open}>Publicar nueva versión</Button>}</>}
            />

            {isLoading ? (
                <LoadingBlock />
            ) : items.length === 0 ? (
                <Card padding="md"><EmptyState title="No hay políticas publicadas" className="py-6" /></Card>
            ) : (
                items.map((p, i) => (
                    <Card key={p.id} padding="md">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="font-bold text-slate-900 dark:text-white">
                                {versionLabel(p.version)}{i === 0 && <span className="ml-2 text-xs text-emerald-700 dark:text-emerald-400">(más reciente)</span>}
                            </h2>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Vigente desde {formatDate(p.effectiveFrom)}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{p.purpose}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">{p.text}</p>
                    </Card>
                ))
            )}

            <FormPanel
                isOpen={modal.isOpen}
                onClose={modal.close}
                onSubmit={publish}
                title="Publicar política"
                icon={<FilePlus className="text-primary" size={20} />}
                submitText="Publicar"
            >
                <FormSection>
                    <Input label="Versión *" name="version" required placeholder="2.0" value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
                    <Input label="Finalidad *" name="purpose" required value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
                    <Input label="Vigente desde (opcional)" name="effectiveFrom" type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <Textarea
                            label="Texto *" name="text"
                            required
                            rows={6}
                            value={form.text}
                            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                        />
                    </div>
                </FormSection>
            </FormPanel>
        </PageContainer>
    );
};
