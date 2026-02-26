import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rbacService } from "../../../shared/api";
import type {
  PermissionGroupDto,
  RolePermissionsResponse,
} from "../../../shared/api/types";
import { ROUTES } from "../../../shared/config/constants";

interface RoleEditorProps {
  roleId?: string; // si se pasa, carga permisos del rol para editar
  onSaved?: (id: string) => void;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({ roleId, onSaved }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<RolePermissionsResponse | null>(null);
  const [groups, setGroups] = useState<PermissionGroupDto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [collapsedModules, setCollapsedModules] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [groupsResp, roleResp] = await Promise.all([
          rbacService.getGroupedPermissions(),
          roleId
            ? rbacService.getRolePermissions(roleId)
            : Promise.resolve(null),
        ]);

        if (groupsResp.success) setGroups(groupsResp.data);
        if (roleResp && roleResp.success) {
          setRole(roleResp.data);
          setRoleName(roleResp.data.name);
          setRoleDescription(
            roleResp.data.permissions?.length
              ? `${roleResp.data.permissions.length} permisos asignados`
              : "",
          );
          const initial = new Set(roleResp.data.permissions.map((p) => p.id));
          setSelected(initial);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [roleId]);

  // Filtrado por búsqueda
  const visibleGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, search]);

  const togglePermission = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isModuleAllSelected = (module: PermissionGroupDto) =>
    module.permissions.every((p) => selected.has(p.id));
  const isModulePartial = (module: PermissionGroupDto) =>
    module.permissions.some((p) => selected.has(p.id)) &&
    !isModuleAllSelected(module);

  const toggleModule = (module: PermissionGroupDto) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = module.permissions.every((p) => next.has(p.id));
      module.permissions.forEach((p) => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const allIds = groups.flatMap((g) => g.permissions.map((p) => p.id));
      const currentlyAll = allIds.every((id) => prev.has(id));
      return currentlyAll ? new Set() : new Set(allIds);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (roleId) {
        const res = await rbacService.updateRolePermissions(roleId, {
          permissionIds: Array.from(selected),
        });
        if (res.success) {
          onSaved?.(roleId);
        }
      } else {
        // Crear rol nuevo y asignar permisos
        const created = await rbacService.createRole({
          name: roleName,
          description: roleDescription,
          permissionIds: Array.from(selected),
        });
        if (created && created.data?.id) {
          onSaved?.(created.data.id);
          navigate(`${ROUTES.ROLES}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-6 text-slate-500 dark:text-slate-400">
        Cargando editor...
      </div>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {roleId ? `Editar rol — ${roleName}` : "Crear nuevo rol"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define qué puede o no puede hacer este rol en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="w-4 h-4"
              onChange={toggleAll}
              checked={
                groups.length > 0 &&
                groups
                  .flatMap((g) => g.permissions)
                  .every((p) => selected.has(p.id))
              }
            />
            <span>Seleccionar todos</span>
          </label>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {isSaving
              ? "Guardando..."
              : roleId
                ? "Guardar permisos"
                : "Crear rol y asignar permisos"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
            <input
              className="w-full md:w-64 px-3 py-2 rounded-md border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#111b22] text-sm text-slate-800 dark:text-white placeholder-slate-400"
              placeholder="Buscar permisos (nombre o código)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <input
              className="w-full md:w-80 px-3 py-2 rounded-md border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#111b22] text-sm text-slate-800 dark:text-white placeholder-slate-400"
              placeholder="Nombre del rol"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />

            <input
              className="w-full md:w-96 px-3 py-2 rounded-md border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#111b22] text-sm text-slate-800 dark:text-white placeholder-slate-400"
              placeholder="Descripción (opcional)"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {visibleGroups.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400">
              No se encontraron permisos para la búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleGroups.map((group) => {
                const all = isModuleAllSelected(group);
                const partial = isModulePartial(group);
                const collapsed = collapsedModules[group.module];

                return (
                  <div
                    key={group.module}
                    className="border border-slate-200 dark:border-[#233948] rounded-md overflow-hidden bg-white dark:bg-[#111b22]"
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#111b22] border-b border-slate-100 dark:border-[#233948]">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={all}
                            ref={(el) => {
                              if (!el) return;
                              el.indeterminate = !!partial;
                            }}
                            onChange={() => toggleModule(group)}
                          />
                          <div className="text-sm font-semibold text-slate-800 dark:text-white capitalize">
                            {group.module}
                          </div>
                        </label>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {group.permissions.length} perms
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCollapsedModules((s) => ({
                              ...s,
                              [group.module]: !collapsed,
                            }))
                          }
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {collapsed ? "Mostrar" : "Ocultar"}
                        </button>
                      </div>
                    </div>

                    {!collapsed && (
                      <div className="p-4 space-y-3">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 p-2 rounded-md border transition-colors cursor-pointer ${
                              selected.has(perm.id)
                                ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50"
                                : "bg-white dark:bg-[#16222b] border-slate-100 dark:border-[#233948] hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />

                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {perm.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {perm.code}
                                </div>
                              </div>
                              {perm.description && (
                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                  {perm.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleEditor;