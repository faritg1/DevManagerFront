import React, { useState } from "react";
import { Mail } from "lucide-react";
import { authService, type ApiError } from "../../../shared/api";
import { Button, Input } from "../../../shared/ui";
import { AuthCard } from "./AuthCard";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSending(true);
    try {
      const response = await authService.forgotPassword(email);
      setSent(response.message);
    } catch (err: unknown) {
      // API errors already raise the global toast
      if (!(err as ApiError).status) setError("No fue posible conectar. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthCard title="Recupera tu contraseña" subtitle="Te enviaremos un enlace para elegir una contraseña nueva.">
      {sent ? (
        <p role="status" className="text-slate-700 dark:text-slate-300 text-sm">{sent}</p>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@empresa.com"
            icon={Mail}
            required
          />
          <Button type="submit" fullWidth size="lg" isLoading={isSending}>
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthCard>
  );
};
