import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { rbacService } from "../../../shared/api";
import type { PermissionTreeNode } from "../../../shared/api/types";
import { EmptyState, LoadingBlock, PageContainer, PageHeader } from "../../../shared/ui";
import { routeForPermission } from "../../../widgets/Sidebar/navConfig";
import { PermissionAuditTable } from "../components/PermissionAuditTable";

/** Read-only catalogue of menu permissions (sections, options, actions) and the history of permission changes (?tab=history[&roleId=]). */
export const PermissionsPage: React.FC = () => {
  const [tree, setTree] = useState<PermissionTreeNode[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "history" ? "history" : "catalog";
  const roleId = searchParams.get("roleId") ?? undefined;

  useEffect(() => {
    rbacService.getPermissionTree().then((res) => setTree(res.data)).catch(() => setFailed(true));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Permisos del menú"
        description="Cada rol ve las secciones y opciones que tenga asignadas y hace las acciones concedidas en ellas. Asígnalos desde Roles; cada cambio queda en el historial."
      />

      <div role="tablist" aria-label="Vista" className="mb-4 flex gap-2 border-b border-slate-200 dark:border-border-dark">
        {([["catalog", "Catálogo"], ["history", "Historial de cambios"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setSearchParams(key === "history" ? { tab: "history" } : {})}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "history" ? (
        <>
          {roleId && (
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              Cambios del rol <strong>{searchParams.get("role") ?? ""}</strong> y sus asignaciones ·{" "}
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setSearchParams({ tab: "history" })}>
                Ver todos
              </button>
            </p>
          )}
          <PermissionAuditTable key={roleId ?? "all"} roleId={roleId} />
        </>
      ) : failed ? (
        <EmptyState title="No se pudo cargar el catálogo de permisos" />
      ) : !tree ? (
        <LoadingBlock label="Cargando permisos…" />
      ) : (
        <div className="space-y-4">
          {tree.map((section) => (
            <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-border-dark dark:bg-card-dark">
              <header className="border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-border-dark dark:bg-background-dark">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{section.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <code>{section.code}</code>
                  {section.description && ` · ${section.description}`}
                </p>
              </header>
              <ul className="divide-y divide-slate-100 dark:divide-border-dark">
                {section.children.map((option) => (
                  <li key={option.id} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{option.name}</span>
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                      <code>{routeForPermission(option.code) ?? option.code}</code>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{option.description && option.description !== routeForPermission(option.code) ? option.description : null}</span>
                    {option.children.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5 sm:col-span-3" aria-label={`Acciones de ${option.name}`}>
                        {option.children.map((action) => (
                          <li key={action.id} title={action.description ?? undefined} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 dark:border-border-dark dark:text-slate-300">
                            {action.name} <code className="text-slate-400">{action.code.split(".").pop()}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
