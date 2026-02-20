import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rbacService, usersService } from "../../../shared/api";
import { RoleDto } from "../../../shared/api/types";
import { RoleList } from "../components/RoleList";
import { RoleFormModal } from "../components/RoleFormModal";
import { useToast } from "../../../shared/context";
import { useConfirm } from "../../../shared/hooks";

export const RolesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const [rolesResp, usersResp] = await Promise.all([
        rbacService.getRoles(),
        usersService.getAll(),
      ]);

      if (!rolesResp.success) {
        throw new Error(rolesResp.message || 'Failed to load roles');
      }

      const rolesData = rolesResp.data || [];

      // If we have users, compute counts by primary roleName (frontend source of truth)
      const usersData = usersResp.success && usersResp.data ? usersResp.data : [];
      const countsByRoleName: Record<string, number> = {};
      usersData.forEach((u) => {
        const rn = (u.roleName || 'Sin rol').trim();
        countsByRoleName[rn] = (countsByRoleName[rn] || 0) + 1;
      });

      const enriched = rolesData.map((r) => ({
        ...r,
        userCount: countsByRoleName[r.name] ?? r.userCount ?? 0,
      }));

      setRoles(enriched);
    } catch (error) {
      console.error("Failed to load roles", error);
      toast.error("Error", "No se pudieron cargar los roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: RoleDto) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const { confirm } = useConfirm();

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: '¿Estás seguro de eliminar este rol?'
    });
    if (!ok) return;

    try {
      const response = await rbacService.deleteRole(id);
      if (response.success) {
        toast.success("Rol eliminado correctamente");
        loadRoles(); // Reload list
      } else {
        toast.error("Error al eliminar rol", response.message || undefined);
      }
    } catch (error) {
      console.error("Failed to delete role", error);
      toast.error("Error", "Ocurrió un error al eliminar el rol");
    }
  };

  const handleManagePermissions = (role: RoleDto) => {
    // Pasamos el nombre del rol en location.state para que el Header pueda mostrarlo en el breadcrumb
    navigate(`/roles/${role.id}/permissions`, { state: { roleName: role.name } });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleModalSuccess = () => {
    toast.success(
      editingRole
        ? "Rol actualizado correctamente"
        : "Rol creado correctamente",
    );
    loadRoles();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestión de Roles
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Administra los roles y sus permisos en la organización
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Crear Nuevo Rol
        </button>
      </div>

      <RoleList
        roles={roles}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManagePermissions={handleManagePermissions}
      />

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        roleToEdit={editingRole}
      />
    </div>
  );
};
