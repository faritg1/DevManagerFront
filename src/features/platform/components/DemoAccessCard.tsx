import React, { useEffect, useId, useRef, useState } from 'react';
import { MonitorPlay } from 'lucide-react';
import { platformService, type DemoAccess } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { useConfirm } from '../../../shared/hooks';
import { Badge, Button, Card, Input, Modal } from '../../../shared/ui';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Switch of the demo access (docs/demo.md), in the super admin area: the API answers 403 to anyone else, so the
 * card renders nothing. Turning it on sets the password of every demo account; it is read from the two fields
 * when sending and never kept in state, storage or logs.
 */
export const DemoAccessCard: React.FC = () => {
    const titleId = useId();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const [access, setAccess] = useState<DemoAccess | null>(null);
    const [asking, setAsking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mismatch, setMismatch] = useState(false);
    const password = useRef<HTMLInputElement>(null);
    const repeat = useRef<HTMLInputElement>(null);

    const load = () => platformService.getDemoAccess().then(r => setAccess(r.data ?? null), () => setAccess(null));

    useEffect(() => { load(); }, []);

    if (!access) return null;

    const closeDialog = () => {
        setAsking(false);
        setMismatch(false);
    };

    const turnOn = async () => {
        const value = password.current?.value ?? '';
        if (value !== repeat.current?.value) {
            setMismatch(true);
            return;
        }
        setSaving(true);
        try {
            await platformService.setDemoAccess({ enabled: true, password: value });
            closeDialog();
            showNotification({ type: 'success', message: 'Acceso demo encendido' });
            await load();
        } catch {
            // el listener global muestra el error (también el de la política de contraseñas)
        } finally {
            // Refused or accepted, the typed password does not outlive the request.
            if (password.current) password.current.value = '';
            if (repeat.current) repeat.current.value = '';
            setSaving(false);
        }
    };

    const turnOff = async () => {
        const ok = await confirm({
            title: 'Apagar acceso demo',
            message: 'Apagar el acceso cierra las sesiones demo abiertas, y las cuentas demo no podrán entrar hasta que lo enciendas de nuevo.',
            confirmText: 'Apagar',
            type: 'warning',
        });
        if (!ok) return;
        setSaving(true);
        try {
            await platformService.setDemoAccess({ enabled: false });
            showNotification({ type: 'success', message: 'Acceso demo apagado' });
            await load();
        } catch {
            // el listener global muestra el error
        } finally {
            setSaving(false);
        }
    };

    const empty = access.organizations === 0;

    return (
        <Card padding="none" role="region" aria-labelledby={titleId} className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <MonitorPlay className="text-primary" size={20} aria-hidden="true" />
                        <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">Acceso demo</h2>
                        <Badge variant={access.enabled ? 'success' : 'default'}>{access.enabled ? 'Encendido' : 'Apagado'}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {empty
                            ? 'No hay organizaciones demo cargadas.'
                            : `${count(access.organizations, 'organización', 'organizaciones')} demo · ${count(access.users, 'usuario', 'usuarios')} demo`}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Encendido, las cuentas demo pueden entrar y la pantalla de acceso enlaza a la demostración. Apagado, no pueden entrar.
                    </p>
                </div>
                {access.enabled ? (
                    <Button variant="outline" isLoading={saving} aria-label="Apagar acceso demo" onClick={turnOff}>Apagar</Button>
                ) : (
                    <Button disabled={empty} aria-label="Encender acceso demo" onClick={() => setAsking(true)}>Encender</Button>
                )}
            </div>

            <Modal
                isOpen={asking}
                onClose={closeDialog}
                title="Encender acceso demo"
                onSubmit={turnOn}
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Encender</Button>
                        <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <Input
                        ref={password}
                        label="Contraseña de las cuentas demo"
                        type="password"
                        autoComplete="new-password"
                        hint="La tendrán todas las cuentas de las organizaciones demo; sus sesiones abiertas se cierran."
                        required
                    />
                    <Input
                        ref={repeat}
                        label="Confirmar contraseña"
                        type="password"
                        autoComplete="new-password"
                        error={mismatch ? 'Las contraseñas no coinciden' : undefined}
                        onChange={() => setMismatch(false)}
                        required
                    />
                </div>
            </Modal>
        </Card>
    );
};
