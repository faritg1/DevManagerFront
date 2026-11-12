import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context';
import { Button, Card, Input, Select } from '../../shared/ui';
import { ROUTES } from '../../shared/config/constants';
import { DEMO_ORGANIZATIONS, DEMO_PERSONAS, demoEmail } from './catalog';

/** Demo entry (#/demo): pick an organization and a persona, type the password, sign in with the regular login. */
export const DemoPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();
    const [slug, setSlug] = useState(DEMO_ORGANIZATIONS[0].slug);
    const [personaKey, setPersonaKey] = useState(DEMO_PERSONAS[0].key);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const organization = DEMO_ORGANIZATIONS.find((o) => o.slug === slug)!;
    const persona = DEMO_PERSONAS.find((p) => p.key === personaKey)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            // login() replaces any session already open, so the presenter can switch personas from here.
            await login(demoEmail(persona, organization), password);
            navigate(ROUTES.DASHBOARD, { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión. Intenta de nuevo.');
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-[520px]">
                <h1 className="text-slate-900 dark:text-white text-2xl leading-8 font-extrabold tracking-tight mb-2">Modo demo</h1>
                <p className="text-slate-600 dark:text-slate-400 text-base mb-6">
                    Elige la entidad y la persona con la que vas a presentar. Los datos son de prueba.
                </p>

                <Card padding="none" className="p-4 sm:p-6">
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {error && (
                            <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Select label="Entidad" value={slug} onChange={(e) => setSlug(e.target.value)}>
                            {DEMO_ORGANIZATIONS.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
                        </Select>

                        <fieldset role="radiogroup" aria-labelledby="demo-persona-legend" className="flex flex-col gap-2">
                            <legend id="demo-persona-legend" className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Persona</legend>
                            {DEMO_PERSONAS.map((p) => (
                                <label
                                    key={p.key}
                                    className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 dark:border-border-dark p-3 has-[:checked]:border-primary-600 has-[:checked]:bg-primary/5 dark:has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
                                >
                                    <input
                                        type="radio"
                                        name="demo-persona"
                                        value={p.key}
                                        checked={p.key === personaKey}
                                        onChange={() => setPersonaKey(p.key)}
                                        className="mt-1 size-4 shrink-0 accent-primary-600"
                                    />
                                    <span className="min-w-0 text-sm">
                                        <span className="block font-semibold text-slate-900 dark:text-white">{p.label}</span>
                                        <span className="block break-all text-slate-600 dark:text-slate-400">{demoEmail(p, organization)}</span>
                                        <span className="block text-slate-600 dark:text-slate-400">{p.description}</span>
                                    </span>
                                </label>
                            ))}
                        </fieldset>

                        <Input
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="off"
                            hint="La que definió el superadministrador al encender el acceso demo."
                            required
                        />

                        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>Iniciar sesión demo</Button>
                    </form>
                </Card>
            </div>
        </main>
    );
};
