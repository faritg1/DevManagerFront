import React, { useState, useEffect } from "react";
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
import { Card, Badge, Button, Avatar } from "../../../shared/ui";
import { useAuth, useNotification } from "../../../shared/context";
import { STORAGE_KEYS, ROUTES } from "../../../shared/config/constants";
import { useNavigate } from "react-router-dom";

type ThemeMode = "light" | "dark" | "system";

const getStoredTheme = (): ThemeMode => {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
};

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
};

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true"
  );
  const [saved, setSaved] = useState(false);

  // Apply theme on change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem(STORAGE_KEYS.THEME, mode);
    applyTheme(mode);
    showNotification({ type: "success", message: `Tema cambiado a ${mode === "light" ? "Claro" : mode === "dark" ? "Oscuro" : "Sistema"}` });
  };

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
    // Dispatch storage event so Sidebar picks it up
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { mode: "light", label: "Claro", icon: Sun },
    { mode: "dark", label: "Oscuro", icon: Moon },
    { mode: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings size={24} className="text-primary" />
          Configuración
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Personaliza tu experiencia en DevManager
        </p>
      </div>

      {/* ─── Account Info ────────────────────── */}
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
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="purple" icon={Shield}>
                  {user.role}
                </Badge>
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

      {/* ─── Appearance ──────────────────────── */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Moon size={20} className="text-indigo-500" />
          Apariencia
        </h2>

        <p className="text-sm text-slate-500 mb-4">
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

      {/* ─── Interface ───────────────────────── */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <HardDrive size={20} className="text-emerald-500" />
          Interfaz
        </h2>

        <div className="space-y-4">
          {/* Sidebar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Barra lateral compacta
              </p>
              <p className="text-xs text-slate-500">
                Colapsa la barra de navegación por defecto
              </p>
            </div>
            <button
              onClick={() => handleSidebarToggle(!sidebarCollapsed)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
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

      {/* ─── Danger Zone ─────────────────────── */}
      <Card className="border-rose-200 dark:border-rose-500/20">
        <h2 className="text-lg font-bold text-rose-500 flex items-center gap-2 mb-4">
          <LogOut size={20} />
          Sesión
        </h2>

        <p className="text-sm text-slate-500 mb-4">
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
    </div>
  );
};

export default SettingsPage;
