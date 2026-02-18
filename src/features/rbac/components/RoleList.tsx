import React from "react";
import { RoleDto } from "../../../shared/api/types";
import { Button } from "../../../shared/ui/Button"; // Fixed import casing
// Using standard HTML table since shared Table component doesn't exist

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
  if (isLoading) {
    return <div className="p-4 text-center">Cargando roles...</div>;
  }

  if (roles.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-slate-50 dark:bg-[#16222b] border-slate-200 dark:border-[#233948] text-slate-500 dark:text-slate-400">
        No hay roles definidos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg border-slate-200 dark:border-[#233948]">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 dark:bg-[#111b22] text-slate-700 dark:text-slate-300 uppercase font-medium">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3 text-center">Usuarios</th>
            <th className="px-4 py-3 text-center">Permisos</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-[#233948] bg-white dark:bg-[#16222b]">
          {roles.map((role) => (
            <tr
              key={role.id}
              className="hover:bg-slate-50 dark:hover:bg-[#111b22] transition-colors"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                {role.name}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {role.description || "-"}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {role.userCount}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {role.permissionCount}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onManagePermissions(role)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium text-xs border border-purple-200 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1 rounded transition-colors"
                >
                  Permisos
                </button>
                <button
                  onClick={() => onEdit(role)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(role.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-xs border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded transition-colors"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
