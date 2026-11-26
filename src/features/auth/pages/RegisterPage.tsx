import React, { useState } from 'react';
import { authService, type ApiError } from '../../../shared/api';
import { Button, Input } from '../../../shared/ui';
import { EMPTY_ORGANIZATION, OrganizationFields, toOrganizationRequest } from '../components/OrganizationFields';
import { AuthCard } from './AuthCard';

/** Public request of a new organization: it stays pending until the super admin approves it, so nobody is signed in. */
export const RegisterPage: React.FC = () => {
    const [form, setForm] = useState(EMPTY_ORGANIZATION);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [received, setReceived] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [isSending, setIsSending] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const errors: typeof fieldErrors = {};
        if (form.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
        if (form.password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsSending(true);
        try {
            const response = await authService.registerOrganization(toOrganizationRequest(form));
            setReceived(response.message || 'Solicitud recibida. La entidad queda pendiente de aprobación');
        } catch (err: unknown) {
            // API errors already raise the global toast
            if (!(err as ApiError).status) setError('No fue posible conectar. Intenta de nuevo.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AuthCard title="Crea tu cuenta" subtitle="Registra tu organización y comienza a gestionar tus agentes IA.">
            {received ? (
                <p role="status" className="text-slate-700 dark:text-slate-300 text-sm">{received}</p>
            ) : (
                <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                    {error && (
                        <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                            {error}
                        </div>
                    )}
                    <OrganizationFields value={form} onChange={setForm} passwordError={fieldErrors.password} />
                    <Input
                        label="Confirmar contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        error={fieldErrors.confirmPassword}
                        required
                    />
                    <Button type="submit" fullWidth size="lg" isLoading={isSending} className="mt-2">
                        Crear Cuenta
                    </Button>
                </form>
            )}
        </AuthCard>
    );
};
