import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, Hexagon } from 'lucide-react';
import { useAuth } from '../../../shared/context';
import { Button, Input } from '../../../shared/ui';
import { ROUTES } from '../../../shared/config/constants';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            await login(email, password);
            navigate(ROUTES.DASHBOARD);
        } catch (err) {
            setError('Credenciales inválidas. Intenta de nuevo.');
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#325167] blur-[100px]" />
            </div>

            <div className="w-full max-w-[460px] relative z-10">
                {/* Header */}
                <div className="mb-8 text-center sm:text-left flex flex-col gap-4">
                    <div className="size-12 text-primary mx-auto sm:mx-0">
                        <Hexagon fill="currentColor" className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-2">
                            Bienvenido de vuelta
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base">
                            Ingresa tus credenciales para acceder a tu workspace.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-[#192833] rounded-2xl shadow-xl border border-slate-200 dark:border-[#233948] p-6 sm:p-8 backdrop-blur-sm">
                    <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Corporativo"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            icon={Mail}
                            required
                        />

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Contraseña</span>
                                <a href="#" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</a>
                            </div>
                            <div className="relative">
                                <input 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 pl-4 pr-12 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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

                        <Button 
                            type="submit" 
                            fullWidth 
                            size="lg" 
                            isLoading={isLoading}
                            className="mt-2"
                        >
                            Iniciar Sesión
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-[#233948]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-[#192833] px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                O continúa con
                            </span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="secondary" className="gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                            </svg>
                            Google
                        </Button>
                        <Button variant="secondary" className="gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 23 23">
                                <path fill="currentColor" d="M0 0h11.377v11.372H0zM11.733 0H23.11v11.372H11.733zM0 11.732h11.377V23.105H0zM11.733 11.732H23.11V23.105H11.733z"/>
                            </svg>
                            Microsoft
                        </Button>
                    </div>

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <Link to={ROUTES.REGISTER} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors">
                            ¿No tienes cuenta? <span className="text-primary hover:underline">Registrar Organización</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;
