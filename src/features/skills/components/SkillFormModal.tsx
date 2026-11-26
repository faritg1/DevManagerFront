import React, { useState, useEffect } from "react";
import { Code2, Globe, Building2 } from "lucide-react";
import { skillsService } from "../../../shared/api";
import type {
  SkillDto,
  CreateSkillRequest,
  SkillType,
  SkillCategoryDto,
} from "../../../shared/api/types";
import { useToast } from "../../../shared/context";
import { FormPanel, FormSection, Input, Select } from "../../../shared/ui";

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
    if (!validate()) return;

    const resolvedCategory = category === "__custom__" ? customCategory.trim() : category;
    const fields = { name: name.trim(), category: resolvedCategory || null, skillType };

    // No try/catch: an API error rejects and the panel shows it.
    if (skill) {
      const payload: SkillDto = { ...fields, id: skill.id, organizationId: skill.organizationId };
      await skillsService.update(skill.id, payload);
      toast.success("Habilidad actualizada correctamente");
    } else {
      const payload: CreateSkillRequest = fields;
      await skillsService.create(payload);
      toast.success("Habilidad creada correctamente");
    }
    onSuccess();
  };

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={isEditing ? "Editar Habilidad" : "Nueva Habilidad"}
      icon={<Code2 size={20} className="text-primary-600 dark:text-primary" />}
      submitText={isEditing ? "Guardar cambios" : "Crear habilidad"}
      // The type buttons emit no input or change event.
      dirty={skillType !== (skill?.skillType ?? 1)}
    >
      <FormSection>
        <Input
          label="Nombre de la habilidad *"
          required
          name="name"
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
            // With a new category, the text field below is the one that feeds `category`.
            name={category === "__custom__" ? undefined : "category"}
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
              name="category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              error={errors.category}
            />
          )}
        </div>

        <div className="space-y-2 sm:col-span-2" role="group" aria-labelledby="skill-form-tipo">
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
                  skillType === 1 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
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
      </FormSection>
    </FormPanel>
  );
};

