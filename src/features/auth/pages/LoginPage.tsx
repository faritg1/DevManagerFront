import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Eye, EyeOff, Hexagon } from "lucide-react";
import { useAuth } from "../../../shared/context";
import { Button, Input } from "../../../shared/ui";
import { ROUTES } from "../../../shared/config/constants";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Credenciales inválidas. Intenta de nuevo.";
      setError(message);
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
                <span className="text-slate-700 dark:text-white text-sm font-bold">
                  Contraseña
                </span>
                <a href="#" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
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

          {/* Register Link */}
          <div className="mt-6 text-center">
            <Link
              to={ROUTES.REGISTER}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
            >
              ¿No tienes cuenta?{" "}
              <span className="text-primary hover:underline">
                Registrar Organización
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;