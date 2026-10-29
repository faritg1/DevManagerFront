import React, { useEffect, useMemo, useState } from "react";
import { History, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { rbacService } from "../../../shared/api";
import type { PermissionTreeNode } from "../../../shared/api/types";
import { ROUTES } from "../../../shared/config/constants";
import { useToast } from "../../../shared/context";
import { isAdminRoleName, usePermission } from "../../../shared/hooks";
import { Button, EmptyState, Input, LoadingBlock, PageContainer, PageHeader } from "../../../shared/ui";
import { routeForPermission } from "../../../widgets/Sidebar/navConfig";

const CHECKBOX_CLASS = "size-4 shrink-0 accent-primary disabled:cursor-not-allowed";

/** Ids counted for a section: its options, or the section itself when it has none. */
const leafIds = (section: PermissionTreeNode) =>
  section.children.length ? section.children.map((c) => c.id) : [section.id];

/** Ids a section toggles: its options with their actions, or the section itself when it has none. */
const allIds = (section: PermissionTreeNode) =>
  section.children.length ? section.children.flatMap((o) => [o.id, ...o.children.map((a) => a.id)]) : [section.id];

const matches = (node: PermissionTreeNode, q: string) =>
  [node.name, node.code, node.description ?? ""].some((v) => v.toLowerCase().includes(q));

const optionMatches = (option: PermissionTreeNode, q: string) =>
  matches(option, q) || option.children.some((a) => matches(a, q));

/** Tri-state checkbox: `indeterminate` is a DOM property, not an attribute. */
const TriCheckbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { indeterminate: boolean }> = ({ indeterminate, ...props }) => (
  <input type="checkbox" ref={(el) => { if (el) el.indeterminate = indeterminate; }} className={CHECKBOX_CLASS} {...props} />
);

export const RoleEditor: React.FC<{ roleId: string }> = ({ roleId }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh: refreshMyPermissions } = usePermission();
  const [tree, setTree] = useState<PermissionTreeNode[] | null>(null);
  const [roleName, setRoleName] = useState("");
  // Selected options and actions only; sections are derived (granted when any option is).
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
          (s.children.length ? s.children.flatMap((o) => [o, ...o.children]) : [s]).filter((n) => n.isGranted).map((n) => n.id))));
      })
      .catch(() => setTree(null))
      .finally(() => setIsLoading(false));
  }, [roleId]);

  const readOnly = isAdminRoleName(roleName);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!tree || !q) return tree ?? [];
    return tree
      .map((s) => (matches(s, q) ? s : { ...s, children: s.children.filter((c) => optionMatches(c, q)) }))
      .filter((s) => s.children.length > 0 || matches(s, q));
  }, [tree, search]);

  const setMany = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const allLeaves = (tree ?? []).flatMap(allIds);

  const handleSave = async () => {
    if (!tree) return;
    // Sections go along whenever any of their options is checked; actions only with their option.
    const permissionIds = tree.flatMap((s) => {
      if (!s.children.length) return selected.has(s.id) ? [s.id] : [];
      const chosen = s.children.filter((o) => selected.has(o.id))
        .flatMap((o) => [o.id, ...o.children.filter((a) => selected.has(a.id)).map((a) => a.id)]);
      return chosen.length ? [s.id, ...chosen] : [];
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
        description="Elige qué secciones y opciones del menú ve este rol y qué acciones puede hacer en cada una."
        actions={<>
          <Button
            variant="secondary"
            icon={History}
            onClick={() => navigate(`${ROUTES.PERMISSIONS}?${new URLSearchParams({ tab: "history", roleId, role: roleName })}`)}
          >
            Historial
          </Button>
          {!readOnly && <Button onClick={handleSave} isLoading={isSaving}>Guardar permisos</Button>}
        </>}
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
            placeholder="Buscar sección, opción o acción…"
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
                    onChange={() => setMany(allIds(section), !sectionOn)}
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{section.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {readOnly ? leaves.length : count}/{leaves.length}
                  </span>
                </label>
                <ul className="divide-y divide-slate-100 dark:divide-border-dark">
                  {section.children.map((option) => {
                    const optionOn = readOnly || selected.has(option.id);
                    const actionIds = option.children.map((a) => a.id);
                    const allActionsOn = actionIds.every((id) => selected.has(id));
                    return (
                      <li key={option.id} className="px-4 py-2.5">
                        <label className={`flex items-start gap-3 ${readOnly ? "" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            className={`${CHECKBOX_CLASS} mt-0.5`}
                            checked={optionOn}
                            disabled={readOnly}
                            // Unchecking an option drops its actions: they only count with it
                            onChange={(e) => setMany(e.target.checked ? [option.id] : [option.id, ...actionIds], e.target.checked)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{option.name}</span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                              {routeForPermission(option.code) ?? option.code}
                            </span>
                          </span>
                        </label>
                        {option.children.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7" role="group" aria-label={`Acciones de ${option.name}`}>
                            {option.children.map((action) => (
                              <label
                                key={action.id}
                                title={action.description ?? undefined}
                                className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-border-dark dark:text-slate-200 ${optionOn && !readOnly ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" : "opacity-60"}`}
                              >
                                <input
                                  type="checkbox"
                                  className={CHECKBOX_CLASS}
                                  checked={readOnly || (optionOn && selected.has(action.id))}
                                  disabled={readOnly || !optionOn}
                                  onChange={(e) => setMany([action.id], e.target.checked)}
                                />
                                {action.name}
                              </label>
                            ))}
                            {!readOnly && optionOn && actionIds.length > 1 && (
                              <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => setMany(actionIds, !allActionsOn)}
                              >
                                {allActionsOn ? "Quitar todas" : "Todas"}
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
