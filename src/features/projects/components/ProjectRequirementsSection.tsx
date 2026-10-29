import React, { useState } from "react";
import { Target, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, Badge, Button, Modal, LevelSelector, Select, LoadingBlock } from "../../../shared/ui";
import { projectsService, skillsService } from "../../../shared/api";
import type {
  SkillRequirementResponse,
  SkillDto,
  AddSkillRequirementRequest,
} from "../../../shared/api/types";
import { useModal, useIsAdmin } from "../../../shared/hooks";
import { useNotification, useConfig } from "../../../shared/context";

interface ProjectRequirementsSectionProps {
  projectId: string;
  requirements: SkillRequirementResponse[];
  onRequirementsChange: (reqs: SkillRequirementResponse[]) => void;
}

export const ProjectRequirementsSection: React.FC<ProjectRequirementsSectionProps> = ({
  projectId,
  requirements,
  onRequirementsChange,
}) => {
  const { showNotification } = useNotification();
  const { catalogs } = useConfig();
  const requirementModal = useModal();
  // POST /projects/{id}/reqs is Admin-only on the API, so only admins get the add actions.
  const isAdmin = useIsAdmin();

  const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [savingRequirement, setSavingRequirement] = useState(false);
  const [requirementForm, setRequirementForm] = useState<AddSkillRequirementRequest>({
    skillId: "",
    requiredLevel: 3,
    isMandatory: true,
  });

  const getLevelLabel = (level: number) =>
    catalogs?.skillLevels.find((l) => l.id === level)?.name || `Nivel ${level}`;

  const handleOpenModal = async () => {
    requirementModal.open();
    setRequirementForm({ skillId: "", requiredLevel: 3, isMandatory: true });

    if (availableSkills.length === 0) {
      setLoadingSkills(true);
      try {
        const response = await skillsService.getAll();
        if (response.success && response.data) {
          const existingSkillIds = requirements.map((r) => r.skillId);
          setAvailableSkills(response.data.filter((s) => !existingSkillIds.includes(s.id)));
        }
      } catch {
        showNotification({ type: "error", message: "Error al cargar habilidades" });
      } finally {
        setLoadingSkills(false);
      }
    }
  };

  const handleSave = async () => {
    if (savingRequirement) return;
    if (!requirementForm.skillId) {
      showNotification({ type: "error", message: "Selecciona una habilidad" });
      return;
    }

    setSavingRequirement(true);
    try {
      const response = await projectsService.addRequirement(projectId, requirementForm);
      if (response.success) {
        showNotification({ type: "success", message: "Requisito agregado exitosamente" });
        requirementModal.close();
        const reqsRes = await projectsService.getRequirements(projectId);
        if (reqsRes.success && reqsRes.data) {
          onRequirementsChange(reqsRes.data);
          setAvailableSkills((prev) => prev.filter((s) => s.id !== requirementForm.skillId));
        }
      } else {
        showNotification({ type: "error", message: response.message || "Error al agregar requisito" });
      }
    } catch {
      showNotification({ type: "error", message: "Error de conexión" });
    } finally {
      setSavingRequirement(false);
    }
  };

  const mandatoryReqs = requirements.filter((r) => r.isMandatory);
  const optionalReqs = requirements.filter((r) => !r.isMandatory);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <Target className="text-primary shrink-0" size={20} />
              Requisitos de Habilidades
              <Badge variant="default">{requirements.length}</Badge>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" icon={Plus} onClick={handleOpenModal}>
                Agregar
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        {requirements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No hay requisitos definidos</p>
            {isAdmin && (
              <Button variant="outline" size="sm" icon={Plus} onClick={handleOpenModal}>
                Agregar Requisito
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {mandatoryReqs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Obligatorios
                </h4>
                <div className="space-y-2">
                  {mandatoryReqs.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-background-dark"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {req.skillName}
                        </span>
                      </div>
                      <Badge variant="danger">{getLevelLabel(req.requiredLevel)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optionalReqs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Opcionales
                </h4>
                <div className="space-y-2">
                  {optionalReqs.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-background-dark"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {req.skillName}
                        </span>
                      </div>
                      <Badge variant="default">{getLevelLabel(req.requiredLevel)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={requirementModal.isOpen}
        onClose={requirementModal.close}
        onSubmit={handleSave}
        title="Agregar Requisito de Habilidad"
        icon={<Target className="text-primary shrink-0" size={20} />}
        size="md"
        footer={
          <>
            <Button type="submit" isLoading={savingRequirement} icon={Plus}>
              Agregar Requisito
            </Button>
            <Button variant="outline" onClick={requirementModal.close}>
              Cancelar
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {loadingSkills ? (
            <LoadingBlock label="Cargando habilidades..." className="py-4" />
          ) : (
            <Select
              label="Habilidad *"
              required
              value={requirementForm.skillId}
              onChange={(e) => setRequirementForm((prev) => ({ ...prev, skillId: e.target.value }))}
              hint={availableSkills.length === 0 ? "No hay habilidades disponibles o todas ya están asignadas." : undefined}
            >
              <option value="">Seleccionar habilidad...</option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} {skill.category && `(${skill.category})`}
                </option>
              ))}
            </Select>
          )}

          <div className="flex flex-col gap-2" role="group" aria-labelledby="requirement-level">
            <p id="requirement-level" className="text-slate-700 dark:text-white text-sm font-bold">Nivel Requerido *</p>
            <LevelSelector
              levels={catalogs?.skillLevels || []}
              selectedId={requirementForm.requiredLevel}
              onSelect={(id) => setRequirementForm((prev) => ({ ...prev, requiredLevel: id }))}
            />
          </div>

          <div className="flex flex-col gap-2" role="group" aria-labelledby="requirement-type">
            <p id="requirement-type" className="text-slate-700 dark:text-white text-sm font-bold">Tipo de Requisito</p>
            <div className="flex gap-3">
              <button
                type="button"
                aria-pressed={requirementForm.isMandatory}
                onClick={() => setRequirementForm((prev) => ({ ...prev, isMandatory: true }))}
                className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                  requirementForm.isMandatory
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                    : "border-slate-200 dark:border-border-dark hover:border-rose-500/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`h-2 w-2 rounded-full ${requirementForm.isMandatory ? "bg-rose-500" : "bg-slate-300"}`} />
                  <p className={`font-bold ${requirementForm.isMandatory ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                    Obligatorio
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">El candidato debe tenerla</p>
              </button>
              <button
                type="button"
                aria-pressed={!requirementForm.isMandatory}
                onClick={() => setRequirementForm((prev) => ({ ...prev, isMandatory: false }))}
                className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                  !requirementForm.isMandatory
                    ? "border-slate-500 bg-slate-50 dark:bg-slate-500/10"
                    : "border-slate-200 dark:border-border-dark hover:border-slate-500/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`h-2 w-2 rounded-full ${!requirementForm.isMandatory ? "bg-slate-500" : "bg-slate-300"}`} />
                  <p className={`font-bold ${!requirementForm.isMandatory ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                    Opcional
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deseable pero no excluyente</p>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
