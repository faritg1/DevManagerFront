import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Hexagon } from "lucide-react";
import { useAuth } from "../../../shared/context";
import { Button, Input } from "../../../shared/ui";
import { ROUTES } from "../../../shared/config/constants";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 sm:mb-8 text-center sm:text-left flex flex-col gap-4">
          <div className="size-10 sm:size-12 text-primary mx-auto sm:mx-0" aria-hidden="true">
            <Hexagon fill="currentColor" className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-2xl leading-8 sm:text-[28px] sm:leading-9 font-extrabold tracking-tight mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Ingresa tus credenciales para acceder a tu workspace.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark p-6 sm:p-8">
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email Corporativo"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              icon={Mail}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <Link to={ROUTES.FORGOT_PASSWORD} className="-my-2 inline-flex min-h-11 items-center self-end rounded text-sm font-medium text-primary-600 dark:text-primary hover:underline underline-offset-2">
              ¿Olvidaste tu contraseña?
            </Link>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-1"
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex min-h-11 items-center rounded px-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ¿No tienes cuenta?{" "}
              <span className="ml-1 font-semibold text-primary-600 dark:text-primary hover:underline underline-offset-2">
                Registrar Organización
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

