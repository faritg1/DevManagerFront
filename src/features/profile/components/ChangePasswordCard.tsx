import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { authService, type ApiError } from '../../../shared/api';
import { useNotification } from '../../../shared/context';
import { Button, Card, CardHeader, CardTitle, Input } from '../../../shared/ui';

/** Changing the password closes every session: authService keeps this one alive with the JWT it gets back. */
export const ChangePasswordCard: React.FC = () => {
    const { showNotification } = useNotification();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const invalid = authService.validateNewPassword(password, confirmation);
        setError(invalid);
        if (invalid) return;

        setIsSaving(true);
        try {
            await authService.changePassword(current, password);
            setCurrent('');
            setPassword('');
            setConfirmation('');
            showNotification({ type: 'success', message: 'Contraseña actualizada. Se cerraron tus demás sesiones.' });
        } catch (err: unknown) {
            // API errors already raise the global toast
            if (!(err as ApiError).status) setError('No fue posible conectar. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="text-primary" size={20} />
                    Cambiar contraseña
                </CardTitle>
            </CardHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>}
                <Input
                    label="Contraseña actual"
                    type="password"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    required
                />
                <Input
                    label="Contraseña nueva"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Input
                    label="Confirma la contraseña"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    required
                />
                <Button type="submit" fullWidth isLoading={isSaving}>
                    Guardar contraseña
                </Button>
            </form>
        </Card>
    );
};
