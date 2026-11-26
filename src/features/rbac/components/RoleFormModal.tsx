import React, { useState, useEffect } from "react";

import {
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "../../../shared/api/types";
import { rbacService } from "../../../shared/api";
import { FormPanel, FormSection } from "../../../shared/ui";
import { Input } from "../../../shared/ui/Input";

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
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
  });
  const [nameError, setNameError] = useState<string | null>(null);

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
      setNameError(null);
    }
  }, [isOpen, roleToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setNameError("El nombre es obligatorio");
      return;
    }
    setNameError(null);

    // No try/catch: an API error rejects and the panel shows it.
    const request: CreateRoleRequest & UpdateRoleRequest = {
      name: formData.name,
      description: formData.description,
    };
    await (roleToEdit
      ? rbacService.updateRole(roleToEdit.id, request)
      : rbacService.createRole(request));
    onSuccess();
    onClose();
  };

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={roleToEdit ? "Editar Rol" : "Nuevo Rol"}
    >
      <FormSection>
        <Input
          label="Nombre del Rol *"
          required
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Editor de Contenido"
          error={nameError ?? undefined}
          autoFocus
        />

        <Input
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción breve de las responsabilidades"
        />
      </FormSection>
    </FormPanel>
  );
};
