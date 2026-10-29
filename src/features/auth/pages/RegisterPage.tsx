import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Hexagon } from 'lucide-react';
import { useAuth } from '../../../shared/context';
import { Button, Input, Select } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';
import { ENTITY_TYPES } from '../../associates/labels';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuth();
    const [formData, setFormData] = useState({
        organizationName: '',
        entityType: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const errors: typeof fieldErrors = {};
        if (formData.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                organizationName: formData.organizationName,
                entityType: formData.entityType ? Number(formData.entityType) : undefined,
            });
            navigate(ROUTES.DASHBOARD);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al crear la cuenta. Intenta de nuevo.';
            setError(message);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background-light dark:bg-background-dark overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500 blur-[120px] animate-pulse motion-reduce:animate-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary blur-[100px]" />
            </div>

            <div className="w-full max-w-[500px] relative z-10">
                <div className="mb-8 text-center sm:text-left flex flex-col gap-4">
                    <div className="size-12 text-primary mx-auto sm:mx-0">
                        <Hexagon fill="currentColor" className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-2">
                            Crea tu cuenta
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base">
                            Registra tu organización y comienza a gestionar tus agentes IA.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-border-dark p-6 sm:p-8 backdrop-blur-sm">
                    <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                        {error && (
                            <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Nombre de la Organización"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            placeholder="Mi Empresa S.A.S"
                            icon={Building2}
                            required
                        />

                        <Select
                            label="Tipo de entidad (opcional)"
                            value={formData.entityType}
                            onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value }))}
                        >
                            <option value="">No especificar</option>
                            {Object.entries(ENTITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </Select>

                        <Input
                            label="Tu Nombre"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Juan Pérez"
                            icon={User}
                            required
                        />

                        <Input
                            label="Email Corporativo"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="juan@empresa.com"
                            icon={Mail}
                            required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Contraseña"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                error={fieldErrors.password}
                                required
                            />
                            <Input
                                label="Confirmar contraseña"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                error={fieldErrors.confirmPassword}
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            fullWidth 
                            size="lg" 
                            isLoading={isLoading}
                            className="mt-2"
                        >
                            Crear Cuenta
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to={ROUTES.LOGIN} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors">
                            ¿Ya tienes cuenta? <span className="text-primary hover:underline">Iniciar Sesión</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

