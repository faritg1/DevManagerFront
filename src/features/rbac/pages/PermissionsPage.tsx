import React, { useEffect, useState } from "react";
import { PermissionDto } from "../../../shared/api/types";
import { rbacService } from "../../../shared/api";
import { PermissionList } from "../components/PermissionList";
import { PermissionFormModal } from "../components/PermissionFormModal";
import { useToast } from "../../../shared/context";

export const PermissionsPage: React.FC = () => {
  const toast = useToast();
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<PermissionDto | null>(null);

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await rbacService.getAllPermissions();
      if (response.success) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error("Failed to load permissions", error);
      toast.error("Error", "No se pudieron cargar los permisos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleCreate = () => {
    setEditingPermission(null);
    setIsModalOpen(true);
  };

  const handleEdit = (permission: PermissionDto) => {
    setEditingPermission(permission);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este permiso?")) return;

    try {
      const response = await rbacService.deletePermission(id);
      if (response.success) {
        toast.success("Permiso eliminado correctamente");
        loadPermissions(); // Reload list
      } else {
        toast.error(
          "Error",
          response.message || "Error al eliminar el permiso",
        );
      }
    } catch (error) {
      console.error("Failed to delete permission", error);
      toast.error("Error", "Ocurrió un error al eliminar el permiso");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
  };

  const handleModalSuccess = () => {
    toast.success(
      editingPermission
        ? "Permiso actualizado correctamente"
        : "Permiso creado correctamente",
    );
    loadPermissions();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestión de Permisos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Administra el catálogo de permisos del sistema
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Crear Nuevo Permiso
        </button>
      </div>

      <PermissionList
        permissions={permissions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PermissionFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        permissionToEdit={editingPermission}
      />
    </div>
  );
};
