import React, { useState, useEffect } from "react";
import { Code2, Save, Globe, Building2 } from "lucide-react";
import { skillsService } from "../../../shared/api";
import type {
  SkillDto,
  CreateSkillRequest,
  SkillType,
  SkillCategoryDto,
} from "../../../shared/api/types";
import { useToast } from "../../../shared/context";
import { Modal, Button, Input, Select } from "../../../shared/ui";

interface SkillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  skill: SkillDto | null;
  categories: string[];
  catalogCategories: SkillCategoryDto[];
}

export const SkillFormModal: React.FC<SkillFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  skill,
  categories,
  catalogCategories,
}) => {
  const toast = useToast();
  const isEditing = skill !== null;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [skillType, setSkillType] = useState<SkillType>(1 as SkillType); // Default: Organizational
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (skill) {
        setName(skill.name);
        setCategory(skill.category || "");
        setCustomCategory("");
        setSkillType(skill.skillType);
      } else {
        setName("");
        setCategory("");
        setCustomCategory("");
        setSkillType(1 as SkillType);
      }
      setErrors({});
    }
  }, [isOpen, skill]);

  const allCategories = React.useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c));
    catalogCategories.forEach((c) => set.add(c.name));
    return Array.from(set).sort();
  }, [categories, catalogCategories]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "El nombre es requerido";
    } else if (name.trim().length > 120) {
      errs.name = "Máximo 120 caracteres";
    }

    const resolvedCategory = category === "__custom__" ? customCategory : category;
    if (resolvedCategory && resolvedCategory.length > 80) {
      errs.category = "Máximo 80 caracteres";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!validate()) return;

    const resolvedCategory = category === "__custom__" ? customCategory.trim() : category;

    setIsSaving(true);
    try {
      if (isEditing && skill) {
        const payload: SkillDto = {
          id: skill.id,
          name: name.trim(),
          category: resolvedCategory || null,
          skillType,
          organizationId: skill.organizationId,
        };
        const response = await skillsService.update(skill.id, payload);
        if (response.success) {
          toast.success("Habilidad actualizada correctamente");
          onSuccess();
        } else {
          toast.error("Error al actualizar", response.message || undefined);
        }
      } else {
        const payload: CreateSkillRequest = {
          name: name.trim(),
          category: resolvedCategory || null,
          skillType,
        };
        const response = await skillsService.create(payload);
        if (response.success) {
          toast.success("Habilidad creada correctamente");
          onSuccess();
        } else {
          toast.error("Error al crear", response.message || undefined);
        }
      }
    } catch (error) {
      console.error("Save skill error:", error);
      toast.error("Error", "Ocurrió un error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={isEditing ? "Editar Habilidad" : "Nueva Habilidad"}
      icon={<Code2 size={20} className="text-primary" />}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save} isLoading={isSaving}>
            {isEditing ? "Guardar cambios" : "Crear habilidad"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Input
          label="Nombre de la habilidad *"
          required
          placeholder="Ej: React, Docker, SAP ERP..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={Code2}
          autoFocus
        />

        <div className="space-y-2">
          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__custom__">+ Nueva categoría...</option>
          </Select>
          {category === "__custom__" && (
            <Input
              placeholder="Nombre de la nueva categoría"
              aria-label="Nombre de la nueva categoría"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              error={errors.category}
            />
          )}
        </div>

        <div className="space-y-2" role="group" aria-labelledby="skill-form-tipo">
          <p id="skill-form-tipo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Tipo de habilidad
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={skillType === 1}
              onClick={() => setSkillType(1 as SkillType)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                skillType === 1
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <Building2
                size={20}
                className={
                  skillType === 1 ? "text-amber-500" : "text-slate-400"
                }
              />
              <div className="text-left">
                <p
                  className={`text-sm font-medium ${
                    skillType === 1
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Organizacional
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Específica de tu organización
                </p>
              </div>
            </button>
            <button
              type="button"
              aria-pressed={skillType === 0}
              onClick={() => setSkillType(0 as SkillType)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                skillType === 0
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <Globe
                size={20}
                className={
                  skillType === 0 ? "text-blue-500" : "text-slate-400"
                }
              />
              <div className="text-left">
                <p
                  className={`text-sm font-medium ${
                    skillType === 0
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Global
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Disponible para todos
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

