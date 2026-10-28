import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rbacService } from "../../../shared/api";
import { RoleDto } from "../../../shared/api/types";
import { RoleList } from "../components/RoleList";
import { RoleFormModal } from "../components/RoleFormModal";
import { useToast } from "../../../shared/context";
import { useConfirm } from "../../../shared/hooks";
import { Button, PageContainer, PageHeader } from "../../../shared/ui";
import { Plus } from "lucide-react";

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
      const rolesResp = await rbacService.getRoles();

      if (!rolesResp.success) {
        throw new Error(rolesResp.message || 'Failed to load roles');
      }

      const rolesData = rolesResp.data || [];

      // Use userCount from API directly (backend provides accurate count)
      // Fallback to 0 if not provided
      const enriched = rolesData.map((r) => ({
        ...r,
        userCount: r.userCount ?? 0,
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
    <PageContainer>
      <PageHeader
        title="Gestión de Roles"
        description="Administra los roles y sus permisos en la organización"
        actions={
        <Button icon={Plus} onClick={handleCreate}>
          Crear Nuevo Rol
        </Button>
        }
      />

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
    </PageContainer>
  );
};
