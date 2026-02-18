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

// Acciones comunes para facilitar creación
const COMMON_ACTIONS = [
  "read",
  "write",
  "create",
  "update",
  "delete",
  "manage",
  "publish",
  "assign",
  "review",
  "approve",
  "execute",
  "view",
  "generate",
  "validate",
  "self_update",
  "assign_roles",
];

// Sugerencias basadas en tu lista (click -> rellena el formulario)
const SUGGESTED_CODES = [
  "roles.read",
  "applications.read",
  "system.manage",
  "projects.publish",
  "users.read",
  "skills.read",
  "certifications.write",
  "reports.generate",
  "assignments.manage",
  "projects.read",
  "talent.read",
  "roles.write",
  "agent.actions.approve",
  "certifications.read",
  "projects.apply",
  "agent.actions.view",
  "reports.read",
  "permissions.write",
  "applications.review",
  "projects.assign",
  "skills.self_update",
  "audit.read",
  "projects.write",
  "skills.validate",
  "skills.write",
  "agent.actions.execute",
  "config.write",
  "permissions.read",
  "users.write",
  "talent.write",
  "config.read",
  "users.assign_roles",
];

const normalizeCode = (value: string) => {
  // lowercase, replace spaces/underscores with dot, remove invalid chars, collapse dots
  return (
    value
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/_+/g, '.')
      .replace(/[^a-z0-9.\-]/g, '')
      .replace(/\.\.+/g, '.')
      .replace(/^\.+|\.+$/g, '')
  );
};

const humanizeNameFromCode = (code: string) => {
  const parts = code.split('.');
  const last = parts[parts.length - 1] || '';
  // Capitalize and replace underscores
  return last.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

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

  // Autogeneración: true por defecto; si el usuario edita manualmente `code` se desactiva
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [codeTouched, setCodeTouched] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>(COMMON_ACTIONS[0]);

  useEffect(() => {
    if (isOpen) {
      if (permissionToEdit) {
        setFormData({
          code: permissionToEdit.code,
          name: permissionToEdit.name,
          module: permissionToEdit.module,
          description: permissionToEdit.description || "",
        });
        setAutoGenerate(false);
        setCodeTouched(true);
      } else {
        setFormData({ code: "", name: "", module: "", description: "" });
        setAutoGenerate(true);
        setCodeTouched(false);
        setSelectedAction(COMMON_ACTIONS[0]);
      }
      setError(null);
    }
  }, [isOpen, permissionToEdit]);

  // Sincronizar generación automática de `code` cuando module o action cambien
  useEffect(() => {
    if (!autoGenerate || codeTouched) return;
    const modulePart = (formData.module || '').trim();
    const actionPart = (selectedAction || '').trim();
    if (!modulePart || !actionPart) return;

    const generated = normalizeCode(`${modulePart}.${actionPart}`);
    setFormData((prev) => ({ ...prev, code: generated }));
  }, [formData.module, selectedAction, autoGenerate, codeTouched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Si el usuario cambia el code manualmente marcamos como touch
    if (name === 'code') {
      setCodeTouched(true);
      setAutoGenerate(false);
      setFormData((prev) => ({ ...prev, [name]: normalizeCode(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAction(e.target.value);
    // si el usuario no ha tocado el código permitimos regenerarlo
    if (!codeTouched) setAutoGenerate(true);
  };

  const applySuggestedCode = (code: string) => {
    const normalized = normalizeCode(code);
    const parts = normalized.split('.');
    const action = parts.pop() || '';
    const module = parts.join('.') || '';

    setFormData((prev) => ({ ...prev, code: normalized, module, name: humanizeNameFromCode(normalized) }));
    setSelectedAction(action || COMMON_ACTIONS[0]);
    setCodeTouched(true);
    setAutoGenerate(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeCode(formData.code || `${formData.module}.${selectedAction}`);

    if (!code || !formData.name.trim() || !formData.module.trim()) {
      setError('Código, Nombre y Módulo son obligatorios');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (permissionToEdit) {
        const updateRequest: UpdatePermissionRequest = {
          code,
          name: formData.name,
          module: formData.module,
          description: formData.description,
        };
        const response = await rbacService.updatePermission(permissionToEdit.id, updateRequest);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || 'Error al actualizar el permiso');
        }
      } else {
        const createRequest: CreatePermissionRequest = {
          code,
          name: formData.name,
          module: formData.module,
          description: formData.description,
        };
        const response = await rbacService.createPermission(createRequest);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || 'Error al crear el permiso');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={permissionToEdit ? 'Editar Permiso' : 'Nuevo Permiso'}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-1 md:col-span-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Módulo</label>
            <Input
              name="module"
              value={formData.module}
              onChange={handleChange}
              placeholder="Ej: users o agent.actions"
            />
          </div>

          <div className="col-span-1 md:col-span-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Acción</label>
            <select
              value={selectedAction}
              onChange={handleActionChange}
              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#111b22] text-sm text-slate-800 dark:text-white"
            >
              {COMMON_ACTIONS.map((a) => (
                <option key={a} value={a} className="capitalize">
                  {a.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 md:col-span-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Código</label>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Se generará automáticamente: module.action"
              error={error && !formData.code ? 'Requerido' : undefined}
            />
            <div className="text-xs text-slate-400 mt-2">Ejemplo: <code className="bg-slate-50 dark:bg-[#111b22] px-1 rounded">{normalizeCode(`${formData.module || 'module'}.${selectedAction}`)}</code></div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Nombre</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Crear Usuarios"
            error={error && !formData.name ? 'Requerido' : undefined}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Descripción</label>
          <Input
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción breve del permiso"
          />
        </div>

        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Sugerencias rápidas</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CODES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => applySuggestedCode(c)}
                className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] hover:bg-slate-100 dark:hover:bg-[#17232b] transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</div>
        )}
      </form>
    </Modal>
  );
};
