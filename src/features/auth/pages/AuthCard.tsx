import React from "react";
import { Link } from "react-router-dom";
import { Hexagon } from "lucide-react";
import { ROUTES } from "../../../shared/config/constants";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/** Frame of the password recovery pages, with the way back to the login. */
export const AuthCard: React.FC<Props> = ({ title, subtitle, children }) => (
  <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
    <div className="w-full max-w-[460px]">
      <div className="mb-8 text-center sm:text-left flex flex-col gap-4">
        <div className="size-10 sm:size-12 text-primary mx-auto sm:mx-0" aria-hidden="true">
          <Hexagon fill="currentColor" className="w-full h-full" />
        </div>
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl leading-8 sm:text-[28px] sm:leading-9 font-extrabold tracking-tight mb-2">{title}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base">{subtitle}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark p-6 sm:p-8">
        {children}
        <div className="mt-4 text-center">
          <Link to={ROUTES.LOGIN} className="inline-flex min-h-11 items-center rounded px-1 text-sm font-medium text-primary-600 dark:text-primary hover:underline underline-offset-2">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  </main>
);
