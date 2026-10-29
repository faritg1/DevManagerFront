import React from "react";
import { RoleDto } from "../../../shared/api/types";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { usePermission } from "../../../shared/hooks";
import { Badge, EmptyState, LoadingBlock, IconButton, TableActions, TABLE_CLASS, THEAD_CLASS, TH_CLASS, TH_ACTIONS_CLASS, TBODY_CLASS, TD_CLASS, TR_CLASS, TD_TRUNCATE_CLASS } from "../../../shared/ui";

interface RoleListProps {
  roles: RoleDto[];
  isLoading: boolean;
  onEdit: (role: RoleDto) => void;
  onDelete: (id: string) => void;
  onManagePermissions: (role: RoleDto) => void;
}

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  isLoading,
  onEdit,
  onDelete,
  onManagePermissions,
}) => {
  // Global roles are shared by every organization: only the platform super admin edits them
  const { isSuperAdmin } = usePermission();

  if (isLoading) {
    return <LoadingBlock label="Cargando roles…" />;
  }

  if (roles.length === 0) {
    return (
      <div className="border rounded-lg bg-slate-50 dark:bg-card-dark border-slate-200 dark:border-border-dark">
        <EmptyState title="No hay roles definidos" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-border-dark dark:bg-card-dark">
      <table className={TABLE_CLASS}>
        <thead className={THEAD_CLASS}>
          <tr>
            <th className={TH_CLASS}>Nombre</th>
            <th className={TH_CLASS}>Descripción</th>
            <th className={`${TH_CLASS} text-center`}>Usuarios</th>
            <th className={`${TH_CLASS} text-center`}>Permisos</th>
            <th className={TH_ACTIONS_CLASS}>Acciones</th>
          </tr>
        </thead>
        <tbody className={TBODY_CLASS}>
          {roles.map((role) => (
            <tr key={role.id} className={TR_CLASS}>
              <td className={`${TD_CLASS} font-medium text-slate-900 dark:text-white`}>
                <span className="flex items-center gap-2">
                  <span className={TD_TRUNCATE_CLASS} title={role.name}>{role.name}</span>
                  {role.isGlobal && <Badge variant="info">Global</Badge>}
                </span>
              </td>
              <td className={`${TD_CLASS} text-slate-600 dark:text-slate-400`}>
                <span className={TD_TRUNCATE_CLASS} title={role.description || undefined}>{role.description || "-"}</span>
              </td>
              <td className={`${TD_CLASS} text-center`}>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {role.userCount}
                </span>
              </td>
              <td className={`${TD_CLASS} text-center`}>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {role.permissionCount}
                </span>
              </td>
              <TableActions>
                <IconButton icon={KeyRound} label={`Permisos de ${role.name}`} variant="primary" onClick={() => onManagePermissions(role)} />
                {(!role.isGlobal || isSuperAdmin) && <IconButton icon={Pencil} label={`Editar ${role.name}`} onClick={() => onEdit(role)} />}
                {/* The API refuses deleting a global role for everyone */}
                {!role.isGlobal && <IconButton icon={Trash2} label={`Eliminar ${role.name}`} variant="danger" onClick={() => onDelete(role.id)} />}
              </TableActions>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
