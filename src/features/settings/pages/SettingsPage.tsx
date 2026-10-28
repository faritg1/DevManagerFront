import React, { useState } from "react";
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  User,
  Shield,
  Bell,
  LogOut,
  Save,
  Check,
  Globe,
  HardDrive,
  Loader2,
} from "lucide-react";
import { Card, Badge, Button, Avatar, PageContainer, PageHeader } from "../../../shared/ui";
import { useAuth, useNotification } from "../../../shared/context";
import { STORAGE_KEYS, ROUTES } from "../../../shared/config/constants";
import { useNavigate } from "react-router-dom";
import { useTheme, type Theme } from "../../../shared/hooks";

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true"
  );
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (mode: Theme) => {
    setTheme(mode);
    showNotification({ type: "success", message: `Tema cambiado a ${mode === "light" ? "Claro" : mode === "dark" ? "Oscuro" : "Sistema"}` });
  };

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEYS.SIDEBAR_COLLAPSED }));
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const themeOptions: { mode: Theme; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { mode: "light", label: "Claro", icon: Sun },
    { mode: "dark", label: "Oscuro", icon: Moon },
    { mode: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <PageContainer narrow className="space-y-6">
      <PageHeader
        icon={<Settings size={28} className="text-primary" />}
        title="Configuración"
        description="Personaliza tu experiencia en DevManager"
      />

      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User size={20} className="text-primary" />
          Cuenta
        </h2>

        {user ? (
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.role ? (
                  <Badge variant="purple" icon={Shield}>
                    {user.role}
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Sin rol</span>
                )}
                {user.organizationName && (
                  <Badge variant="info" icon={Globe}>
                    {user.organizationName}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.PROFILE)}
            >
              Editar perfil
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Moon size={20} className="text-indigo-500" />
          Apariencia
        </h2>

        <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">
          Selecciona el tema de la interfaz
        </p>

        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ mode, label, icon: Icon }) => {
            const isActive = theme === mode;
            return (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div
                  className={`p-3 rounded-full ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <Icon size={24} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <Check size={16} className="text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <HardDrive size={20} className="text-emerald-500" />
          Interfaz
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Barra lateral compacta
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Colapsa la barra de navegación por defecto
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sidebarCollapsed}
              aria-label="Barra lateral compacta"
              onClick={() => handleSidebarToggle(!sidebarCollapsed)}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#16222b] ${
                sidebarCollapsed
                  ? "bg-primary"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  sidebarCollapsed ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="border-rose-200 dark:border-rose-500/20">
        <h2 className="text-lg font-bold text-rose-500 flex items-center gap-2 mb-4">
          <LogOut size={20} />
          Sesión
        </h2>

        <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">
          Cierra tu sesión actual en todos los dispositivos.
        </p>

        <Button
          variant="danger"
          icon={LogOut}
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </Card>
    </PageContainer>
  );
};

