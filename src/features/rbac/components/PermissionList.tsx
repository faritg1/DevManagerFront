import React from "react";
import { PermissionDto } from "../../../shared/api/types";

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
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Cargando permisos...
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-slate-50 dark:bg-[#16222b] border-slate-200 dark:border-[#233948] text-slate-500 dark:text-slate-400">
        No hay permisos definidos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg border-slate-200 dark:border-[#233948]">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 dark:bg-[#111b22] text-slate-700 dark:text-slate-300 uppercase font-medium">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Módulo</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-[#233948] bg-white dark:bg-[#16222b]">
          {permissions.map((permission) => (
            <tr
              key={permission.id}
              className="hover:bg-slate-50 dark:hover:bg-[#111b22] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                {permission.code}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                {permission.name}
              </td>
              <td className="px-4 py-3">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {permission.module}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {permission.description || "-"}
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onEdit(permission)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(permission.id)}
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
