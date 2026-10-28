import React, { useEffect, useState } from "react";
import { rbacService } from "../../../shared/api";
import type { PermissionTreeNode } from "../../../shared/api/types";
import { EmptyState, LoadingBlock, PageContainer, PageHeader } from "../../../shared/ui";
import { routeForPermission } from "../../../widgets/Sidebar/navConfig";

/** Read-only catalogue of menu permissions: sections and the options (screens) they unlock. */
export const PermissionsPage: React.FC = () => {
  const [tree, setTree] = useState<PermissionTreeNode[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    rbacService.getPermissionTree().then((res) => setTree(res.data)).catch(() => setFailed(true));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Permisos del menú"
        description="Cada rol ve las secciones y opciones que tenga asignadas. Asígnalos desde Roles."
      />

      {failed ? (
        <EmptyState title="No se pudo cargar el catálogo de permisos" />
      ) : !tree ? (
        <LoadingBlock label="Cargando permisos…" />
      ) : (
        <div className="space-y-4">
          {tree.map((section) => (
            <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#233948] dark:bg-[#16222b]">
              <header className="border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-[#233948] dark:bg-[#111b22]">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{section.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <code>{section.code}</code>
                  {section.description && ` · ${section.description}`}
                </p>
              </header>
              <ul className="divide-y divide-slate-100 dark:divide-[#233948]">
                {section.children.map((option) => (
                  <li key={option.id} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{option.name}</span>
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                      <code>{routeForPermission(option.code) ?? option.code}</code>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{option.description && option.description !== routeForPermission(option.code) ? option.description : "—"}</span>
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
