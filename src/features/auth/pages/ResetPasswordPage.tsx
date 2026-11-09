import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService, type ApiError } from "../../../shared/api";
import { useAuth, useNotification } from "../../../shared/context";
import { Button, Input } from "../../../shared/ui";
import { ROUTES } from "../../../shared/config/constants";
import { AuthCard } from "./AuthCard";

/** Outside PublicRoute: whoever opens the link with a session open must reach it too. */
export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { logout } = useAuth();
  const { showNotification } = useNotification();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = authService.validateNewPassword(password, confirmation);
    setError(invalid);
    if (invalid || !token) return;

    setIsSaving(true);
    try {
      const response = await authService.resetPassword(token, password);
      showNotification({ type: "success", message: response.message ?? "Contraseña restablecida" });
      // Every session of the account is closed: also goes back to the login
      logout();
    } catch (err: unknown) {
      // API errors already raise the global toast
      if (!(err as ApiError).status) setError("No fue posible conectar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthCard title="Elige una contraseña nueva" subtitle="Al guardarla se cerrarán las sesiones abiertas de tu cuenta.">
      {token ? (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>}
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
          <Button type="submit" fullWidth size="lg" isLoading={isSaving}>
            Guardar contraseña
          </Button>
        </form>
      ) : (
        <p role="alert" className="text-slate-700 dark:text-slate-300 text-sm">
          El enlace no es válido o ya expiró.{" "}
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary-600 dark:text-primary hover:underline">Solicita uno nuevo.</Link>
        </p>
      )}
    </AuthCard>
  );
};
