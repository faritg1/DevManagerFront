import React from "react";
import { PermissionDto } from "../../../shared/api/types";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState, LoadingBlock, IconButton, TableActions, TABLE_CLASS, THEAD_CLASS, TH_CLASS, TH_ACTIONS_CLASS, TBODY_CLASS, TD_CLASS, TR_CLASS, TD_TRUNCATE_CLASS } from "../../../shared/ui";

interface PermissionListProps {
  permissions: PermissionDto[];
  isLoading: boolean;
  onEdit: (permission: PermissionDto) => void;
  onDelete: (id: string) => void;
}

export const PermissionList: React.FC<PermissionListProps> = ({
  permissions,
  isLoading,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <LoadingBlock label="Cargando permisos…" />
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="border rounded-lg bg-slate-50 dark:bg-[#16222b] border-slate-200 dark:border-[#233948]">
        <EmptyState title="No hay permisos definidos" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#233948] dark:bg-[#16222b]">
      <table className={TABLE_CLASS}>
        <thead className={THEAD_CLASS}>
          <tr>
            <th className={TH_CLASS}>Código</th>
            <th className={TH_CLASS}>Nombre</th>
            <th className={TH_CLASS}>Módulo</th>
            <th className={TH_CLASS}>Descripción</th>
            <th className={TH_ACTIONS_CLASS}>Acciones</th>
          </tr>
        </thead>
        <tbody className={TBODY_CLASS}>
          {permissions.map((permission) => (
            <tr key={permission.id} className={TR_CLASS}>
              <td className={`${TD_CLASS} font-mono text-xs text-slate-500 dark:text-slate-400`}>
                {permission.code}
              </td>
              <td className={`${TD_CLASS} font-medium text-slate-900 dark:text-white`}>
                <span className={TD_TRUNCATE_CLASS} title={permission.name}>{permission.name}</span>
              </td>
              <td className={TD_CLASS}>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {permission.module}
                </span>
              </td>
              <td className={`${TD_CLASS} text-slate-600 dark:text-slate-400`}>
                <span className={TD_TRUNCATE_CLASS} title={permission.description || undefined}>{permission.description || "-"}</span>
              </td>
              <TableActions>
                <IconButton icon={Pencil} label={`Editar ${permission.name}`} onClick={() => onEdit(permission)} />
                <IconButton icon={Trash2} label={`Eliminar ${permission.name}`} variant="danger" onClick={() => onDelete(permission.id)} />
              </TableActions>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
