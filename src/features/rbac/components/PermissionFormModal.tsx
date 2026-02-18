import React, { useState, useEffect } from "react";
import {
  PermissionDto,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from "../../../shared/api/types";
import { rbacService } from "../../../shared/api";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  permissionToEdit?: PermissionDto | null;
}

interface PermissionFormData {
  code: string;
  name: string;
  module: string;
  description: string;
}

export const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  permissionToEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PermissionFormData>({
    code: "",
    name: "",
    module: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (permissionToEdit) {
        setFormData({
          code: permissionToEdit.code,
          name: permissionToEdit.name,
          module: permissionToEdit.module,
          description: permissionToEdit.description || "",
        });
      } else {
        setFormData({ code: "", name: "", module: "", description: "" });
      }
      setError(null);
    }
  }, [isOpen, permissionToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.code.trim() ||
      !formData.name.trim() ||
      !formData.module.trim()
    ) {
      setError("Código, Nombre y Módulo son obligatorios");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (permissionToEdit) {
        const updateRequest: UpdatePermissionRequest = {
          code: formData.code,
          name: formData.name,
          module: formData.module,
          description: formData.description,
        };
        const response = await rbacService.updatePermission(
          permissionToEdit.id,
          updateRequest,
        );
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || "Error al actualizar el permiso");
        }
      } else {
        const createRequest: CreatePermissionRequest = {
          code: formData.code,
          name: formData.name,
          module: formData.module,
          description: formData.description,
        };
        const response = await rbacService.createPermission(createRequest);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || "Error al crear el permiso");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={permissionToEdit ? "Editar Permiso" : "Nuevo Permiso"}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Código"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="Ej: users.create"
          error={error && !formData.code ? "Requerido" : undefined}
          autoFocus={!permissionToEdit}
        />

        <Input
          label="Nombre"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Crear Usuarios"
          error={error && !formData.name ? "Requerido" : undefined}
        />

        <Input
          label="Módulo"
          name="module"
          value={formData.module}
          onChange={handleChange}
          placeholder="Ej: Usuarios"
          error={error && !formData.module ? "Requerido" : undefined}
        />

        <Input
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción breve del permiso"
        />

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};
