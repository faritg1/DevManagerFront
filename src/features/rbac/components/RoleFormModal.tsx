import React, { useState, useEffect } from "react";

import {
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "../../../shared/api/types";
import { rbacService } from "../../../shared/api";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleToEdit?: RoleDto | null;
}

interface RoleFormData {
  name: string;
  description: string;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roleToEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        setFormData({
          name: roleToEdit.name,
          description: roleToEdit.description || "",
        });
      } else {
        setFormData({ name: "", description: "" });
      }
      setError(null);
    }
  }, [isOpen, roleToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (roleToEdit) {
        const updateRequest: UpdateRoleRequest = {
          name: formData.name,
          description: formData.description,
        };
        const response = await rbacService.updateRole(
          roleToEdit.id,
          updateRequest,
        );
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || "Error al actualizar el rol");
        }
      } else {
        const createRequest: CreateRoleRequest = {
          name: formData.name,
          description: formData.description,
        };
        const response = await rbacService.createRole(createRequest);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || "Error al crear el rol");
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
      title={roleToEdit ? "Editar Rol" : "Nuevo Rol"}
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
          label="Nombre del Rol"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Editor de Contenido"
          error={error && !formData.name ? "Requerido" : undefined}
          autoFocus
        />

        <Input
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción breve de las responsabilidades"
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
