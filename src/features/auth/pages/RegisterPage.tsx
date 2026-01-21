import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Eye, EyeOff, Hexagon } from 'lucide-react';
import { useAuth } from '../../../shared/context';
import { Button, Input } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        organizationName: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                organizationName: formData.organizationName,
            });
            navigate(ROUTES.DASHBOARD);
        } catch (err) {
            setError('Error al crear la cuenta. Intenta de nuevo.');
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary blur-[100px]" />
            </div>

            <div className="w-full max-w-[500px] relative z-10">
                {/* Header */}
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

                {/* Form Card */}
                <div className="bg-white dark:bg-[#192833] rounded-2xl shadow-xl border border-slate-200 dark:border-[#233948] p-6 sm:p-8 backdrop-blur-sm">
                    <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
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
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="juan@empresa.com"
                            icon={Mail}
                            required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Contraseña</span>
                                <div className="relative">
                                    <input 
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 pl-4 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="••••••••" 
                                        type={showPassword ? "text" : "password"}
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Confirmar</span>
                                <input 
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-300 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••" 
                                    type="password"
                                    required
                                />
                            </div>
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

                    {/* Login Link */}
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

export default RegisterPage;
