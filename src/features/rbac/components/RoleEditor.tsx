import React, { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { rbacService } from "../../../shared/api";
import type { PermissionTreeNode } from "../../../shared/api/types";
import { ROUTES } from "../../../shared/config/constants";
import { useToast } from "../../../shared/context";
import { isAdminRoleName, usePermission } from "../../../shared/hooks";
import { Button, EmptyState, Input, LoadingBlock, PageContainer, PageHeader } from "../../../shared/ui";
import { routeForPermission } from "../../../widgets/Sidebar/navConfig";

const CHECKBOX_CLASS = "size-4 shrink-0 accent-primary disabled:cursor-not-allowed";

/** Ids a section toggles: its options, or the section itself when it has none. */
const leafIds = (section: PermissionTreeNode) =>
  section.children.length ? section.children.map((c) => c.id) : [section.id];

const matches = (node: PermissionTreeNode, q: string) =>
  [node.name, node.code, node.description ?? ""].some((v) => v.toLowerCase().includes(q));

/** Tri-state checkbox: `indeterminate` is a DOM property, not an attribute. */
const TriCheckbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { indeterminate: boolean }> = ({ indeterminate, ...props }) => (
  <input type="checkbox" ref={(el) => { if (el) el.indeterminate = indeterminate; }} className={CHECKBOX_CLASS} {...props} />
);

export const RoleEditor: React.FC<{ roleId: string }> = ({ roleId }) => {
  const toast = useToast();
  const { refresh: refreshMyPermissions } = usePermission();
  const [tree, setTree] = useState<PermissionTreeNode[] | null>(null);
  const [roleName, setRoleName] = useState("");
  // Selected leaves only; sections are derived (granted when any option is).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([rbacService.getPermissionTree(roleId), rbacService.getRolePermissions(roleId)])
      .then(([treeRes, roleRes]) => {
        setTree(treeRes.data);
        setRoleName(roleRes.data.name);
        setSelected(new Set(treeRes.data.flatMap((s) =>
          (s.children.length ? s.children : [s]).filter((n) => n.isGranted).map((n) => n.id))));
      })
      .catch(() => setTree(null))
      .finally(() => setIsLoading(false));
  }, [roleId]);

  const readOnly = isAdminRoleName(roleName);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!tree || !q) return tree ?? [];
    return tree
      .map((s) => (matches(s, q) ? s : { ...s, children: s.children.filter((c) => matches(c, q)) }))
      .filter((s) => s.children.length > 0 || matches(s, q));
  }, [tree, search]);

  const setMany = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const allLeaves = (tree ?? []).flatMap(leafIds);

  const handleSave = async () => {
    if (!tree) return;
    // Sections go along automatically whenever any of their options is checked.
    const permissionIds = tree.flatMap((s) => {
      const chosen = leafIds(s).filter((id) => selected.has(id));
      return chosen.length && s.children.length ? [s.id, ...chosen] : chosen;
    });
    setIsSaving(true);
    try {
      await rbacService.updateRolePermissions(roleId, { permissionIds });
      toast.success("Permisos guardados", `El rol ${roleName} se actualizó.`);
      // The current user may hold this role: refetch so the sidebar reflects it.
      refreshMyPermissions();
    } catch {
      toast.error("Error", "No se pudieron guardar los permisos del rol.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageContainer><LoadingBlock label="Cargando permisos…" /></PageContainer>;
  }

  if (!tree) {
    return (
      <PageContainer>
        <PageHeader backTo={ROUTES.ROLES} title="Permisos del rol" />
        <EmptyState title="Rol no encontrado" description="El rol no existe o pertenece a otra organización." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        backTo={ROUTES.ROLES}
        title={`Permisos — ${roleName}`}
        description="Elige qué secciones y opciones del menú ve este rol."
        actions={!readOnly && (
          <Button onClick={handleSave} isLoading={isSaving}>Guardar permisos</Button>
        )}
      />

      {readOnly && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-slate-700 dark:text-slate-200">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p>Los roles administradores siempre tienen acceso completo; sus permisos no se pueden editar.</p>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            icon={Search}
            inputSize="sm"
            placeholder="Buscar sección u opción…"
            aria-label="Buscar permisos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setMany(allLeaves, true)}>Seleccionar todo</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>Ninguno</Button>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Sin resultados" description="Ningún permiso coincide con la búsqueda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((section) => {
            const leaves = leafIds(section);
            const count = leaves.filter((id) => selected.has(id)).length;
            const sectionOn = readOnly || count === leaves.length;
            return (
              <fieldset key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-border-dark dark:bg-card-dark">
                <legend className="sr-only">{section.name}</legend>
                <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-border-dark dark:bg-background-dark">
                  <TriCheckbox
                    checked={sectionOn}
                    indeterminate={!readOnly && count > 0 && count < leaves.length}
                    disabled={readOnly}
                    onChange={() => setMany(leaves, !sectionOn)}
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{section.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {readOnly ? leaves.length : count}/{leaves.length}
                  </span>
                </label>
                <ul className="divide-y divide-slate-100 dark:divide-border-dark">
                  {section.children.map((option) => (
                    <li key={option.id}>
                      <label className={`flex items-start gap-3 px-4 py-2.5 ${readOnly ? "" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                        <input
                          type="checkbox"
                          className={`${CHECKBOX_CLASS} mt-0.5`}
                          checked={readOnly || selected.has(option.id)}
                          disabled={readOnly}
                          onChange={(e) => setMany([option.id], e.target.checked)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{option.name}</span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {routeForPermission(option.code) ?? option.code}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
