import React, { useEffect, useState } from "react";
import { History } from "lucide-react";
import { rbacService } from "../../../shared/api";
import type { PermissionAuditEntry, PermissionAuditPage } from "../../../shared/api/types";
import { asUtc, formatDateTime } from "../../../shared/format";
import type { PagedFilter } from "../../../shared/hooks";
import { Badge, EmptyState, LoadingBlock, Pager, TABLE_CLASS, TBODY_CLASS, TD_CLASS, THEAD_CLASS, TH_CLASS, TR_CLASS } from "../../../shared/ui";

const ACTION_LABELS: Record<string, string> = {
  permissions_updated: "Permisos del rol modificados",
  role_created: "Rol creado",
  role_deleted: "Rol eliminado",
  role_assigned: "Rol asignado",
  role_removed: "Rol retirado",
  user_override: "Permiso directo",
  user_override_removed: "Permiso directo retirado",
};

const Chips: React.FC<{ items: PermissionAuditEntry["granted"]; variant: "success" | "danger"; sign: string }> = ({ items, variant, sign }) => (
  <>
    {items.map((p) => (
      <span key={p.code} title={p.code}>
        <Badge variant={variant}>{sign} {p.name}</Badge>
      </span>
    ))}
  </>
);

/** Append-only history of permission changes (admin-only endpoint); with roleId, only that role's changes and assignments. Key it by roleId to restart paging. */
export const PermissionAuditTable: React.FC<{ roleId?: string }> = ({ roleId }) => {
  const [data, setData] = useState<PermissionAuditPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setData(null);
    setFailed(false);
    rbacService
      .getPermissionAudit(roleId ? { targetType: "Role", targetId: roleId, page } : { page })
      .then((res) => setData(res.data))
      .catch(() => setFailed(true));
  }, [roleId, page]);

  if (failed) return <EmptyState title="No se pudo cargar el historial de cambios" />;
  if (!data) return <LoadingBlock label="Cargando historial…" />;
  if (data.total === 0)
    return <EmptyState icon={History} title="Sin cambios registrados" description="Aquí aparecerán los cambios de permisos, roles y asignaciones." />;

  const pager: PagedFilter<unknown> = {
    query: "",
    setQuery: () => {},
    page: data.page,
    setPage,
    pageItems: data.items,
    filtered: data.items,
    total: data.total,
    pageCount: Math.max(1, Math.ceil(data.total / data.pageSize)),
    pageSize: data.pageSize,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-border-dark dark:bg-card-dark">
      <div className="overflow-x-auto">
        <table className={TABLE_CLASS}>
          <thead className={THEAD_CLASS}>
            <tr>
              <th className={TH_CLASS}>Fecha</th>
              <th className={TH_CLASS}>Quién</th>
              <th className={TH_CLASS}>A quién</th>
              <th className={TH_CLASS}>Acción</th>
              <th className={TH_CLASS}>Permisos</th>
            </tr>
          </thead>
          <tbody className={TBODY_CLASS}>
            {data.items.map((e) => (
              <tr key={e.id} className={TR_CLASS}>
                <td className={TD_CLASS}>{formatDateTime(asUtc(e.createdAt))}</td>
                <td className={TD_CLASS}>
                  {e.actorName}
                  {e.impersonatedUserId && (
                    <span className="block text-xs text-amber-600 dark:text-amber-400">Superadmin actuando como {e.impersonatedUserName ?? "usuario eliminado"}</span>
                  )}
                </td>
                <td className={TD_CLASS}>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{e.targetName}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {e.targetType === "Role" ? "Rol" : "Usuario"}
                    {e.roleName && ` · rol ${e.roleName}`}
                  </span>
                </td>
                <td className={TD_CLASS}>{ACTION_LABELS[e.action] ?? e.action}</td>
                <td className={`${TD_CLASS} whitespace-normal`}>
                  <div className="flex min-w-[16rem] flex-wrap gap-1.5">
                    <Chips items={e.granted} variant="success" sign="+" />
                    <Chips items={e.revoked} variant="danger" sign="−" />
                    {e.granted.length + e.revoked.length === 0 && <span className="text-slate-500 dark:text-slate-400">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager pager={pager} />
    </div>
  );
};
