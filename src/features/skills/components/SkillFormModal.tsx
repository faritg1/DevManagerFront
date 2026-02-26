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
import { Modal, Button, Input } from "../../../shared/ui";

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

  // ─── Form state ─────────────────────────────────────────
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [skillType, setSkillType] = useState<SkillType>(1 as SkillType); // Default: Organizational
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Populate form when editing ─────────────────────────
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

  // ─── Resolve all category options ───────────────────────
  const allCategories = React.useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c));
    catalogCategories.forEach((c) => set.add(c.name));
    return Array.from(set).sort();
  }, [categories, catalogCategories]);

  // ─── Validation ─────────────────────────────────────────
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

  // ─── Submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const resolvedCategory = category === "__custom__" ? customCategory.trim() : category;

    setIsSaving(true);
    try {
      if (isEditing && skill) {
        // UPDATE
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
        // CREATE
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
      title={isEditing ? "Editar Habilidad" : "Nueva Habilidad"}
      icon={<Code2 size={20} className="text-primary" />}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            icon={Save}
            isLoading={isSaving}
            onClick={handleSubmit}
          >
            {isEditing ? "Guardar cambios" : "Crear habilidad"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <Input
          label="Nombre de la habilidad"
          placeholder="Ej: React, Docker, SAP ERP..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={Code2}
          autoFocus
        />

        {/* Categoría */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-[#16222b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="">Sin categoría</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__custom__">+ Nueva categoría...</option>
          </select>
          {category === "__custom__" && (
            <Input
              placeholder="Nombre de la nueva categoría"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              error={errors.category}
            />
          )}
        </div>

        {/* Tipo de skill */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Tipo de habilidad
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
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
                <p className="text-xs text-slate-400">
                  Específica de tu organización
                </p>
              </div>
            </button>
            <button
              type="button"
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
                <p className="text-xs text-slate-400">
                  Disponible para todos
                </p>
              </div>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SkillFormModal;
