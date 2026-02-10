import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Info,
  Save,
  X,
  Calendar,
  DollarSign,
  Loader2,
  ArrowLeft,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Modal,
} from "../../../shared/ui";
import { useModal } from "../../../shared/hooks";
import { useNotification, useConfig } from "../../../shared/context";
import { ROUTES } from "../../../shared/config/constants";
import { projectsService, skillsService } from "../../../shared/api";
import {
  ProjectStatus,
  ProjectComplexity,
  type ProjectResponse,
  type SkillRequirementResponse,
  type SkillDto,
} from "../../../shared/api/types";

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  complexity: string;
  status: string;
  budgetEstimate: string;
}

const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

export const EditProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { catalogs } = useConfig();
  const addSkillModal = useModal();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [requirements, setRequirements] = useState<SkillRequirementResponse[]>(
    [],
  );
  const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Form para agregar skill
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("3");
  const [newSkillMandatory, setNewSkillMandatory] = useState(true);

  const getStatusLabel = (statusId: number) => {
    return catalogs?.projectStatuses.find(s => s.id === statusId)?.name || "Desconocido";
  };

  const getLevelLabel = (levelId: number) => {
    return catalogs?.skillLevels.find(l => l.id === levelId)?.name || `Nivel ${levelId}`;
  };

  // Estado del formulario - se inicializa con valores vacíos y se actualiza cuando llega el proyecto
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    complexity: "1",
    status: "0",
    budgetEstimate: "",
  });

  // Handlers del formulario
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Cargar datos del proyecto
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectRes, reqsRes, skillsRes] = await Promise.all([
          projectsService.getById(id),
          projectsService.getRequirements(id),
          skillsService.getAll(),
        ]);

        if (projectRes.success && projectRes.data) {
          const p = projectRes.data;
          setProject(p);
          // Precargar valores del proyecto en el formulario
          setFormData({
            name: p.name || "",
            description: p.description || "",
            startDate: formatDateForInput(p.startDate),
            endDate: formatDateForInput(p.endDate),
            complexity: p.complexity.toString(),
            status: p.status.toString(),
            budgetEstimate: p.budgetEstimate?.toString() || "",
          });
        } else {
          showNotification({
            type: "error",
            message: "Proyecto no encontrado",
          });
          navigate(ROUTES.PROJECTS);
          return;
        }

        if (reqsRes.success && reqsRes.data) {
          setRequirements(reqsRes.data);
        }

        if (skillsRes.success && skillsRes.data) {
          setAvailableSkills(skillsRes.data);
        }
      } catch (error) {
        showNotification({
          type: "error",
          message: "Error al cargar el proyecto",
        });
        console.error("Error loading project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !formData.name.trim()) {
      showNotification({
        type: "error",
        message: "El nombre del proyecto es requerido",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await projectsService.update(id, {
        name: formData.name,
        description: formData.description || null,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        complexity: parseInt(formData.complexity) as ProjectComplexity,
        status: parseInt(formData.status) as ProjectStatus,
        budgetEstimate: formData.budgetEstimate
          ? parseFloat(formData.budgetEstimate)
          : null,
      });

      if (response.success) {
        showNotification({
          type: "success",
          message: "Proyecto actualizado exitosamente",
        });
        navigate(`/projects/${id}`);
      } else {
        showNotification({
          type: "error",
          message: response.message || "Error al actualizar proyecto",
        });
      }
    } catch (error) {
      showNotification({ type: "error", message: "Error de conexión" });
      console.error("Error updating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSkill = async () => {
    if (!id || !newSkillId) {
      showNotification({ type: "error", message: "Selecciona una habilidad" });
      return;
    }

    setIsAddingSkill(true);

    try {
      const response = await projectsService.addRequirement(id, {
        skillId: newSkillId,
        requiredLevel: parseInt(newSkillLevel),
        isMandatory: newSkillMandatory,
      });

      if (response.success) {
        showNotification({
          type: "success",
          message: "Requisito agregado exitosamente",
        });
        // Recargar requisitos
        const reqsRes = await projectsService.getRequirements(id);
        if (reqsRes.success && reqsRes.data) {
          setRequirements(reqsRes.data);
        }
        addSkillModal.close();
        setNewSkillId("");
        setNewSkillLevel("3");
        setNewSkillMandatory(true);
      } else {
        showNotification({
          type: "error",
          message: response.message || "Error al agregar requisito",
        });
      }
    } catch (error) {
      showNotification({ type: "error", message: "Error de conexión" });
    } finally {
      setIsAddingSkill(false);
    }
  };

  // Filtrar skills que ya están como requisitos
  const filteredSkills = availableSkills.filter(
    (skill) => !requirements.some((req) => req.skillId === skill.id),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          Cargando proyecto...
        </p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const mandatoryReqs = requirements.filter((r) => r.isMandatory);
  const optionalReqs = requirements.filter((r) => !r.isMandatory);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col max-w-[1024px] w-full px-4 md:px-6 py-6 mx-auto pb-20">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors w-fit mb-6"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Volver al Proyecto</span>
        </button>

        {/* Header */}
        <div className="flex flex-wrap justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#233948] mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-black leading-tight">
              Editar Proyecto
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal">
              {project.code || project.name}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              variant="outline"
              icon={X}
              onClick={() => navigate(`/projects/${id}`)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              icon={isSubmitting ? Loader2 : Save}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>

        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="text-primary" size={24} />
                Información Básica
              </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Nombre del Proyecto *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Sistema de Gestión Hospitalaria"
                required
              />
              <div className="flex flex-col gap-2">
                <span className="text-slate-700 dark:text-white text-sm font-bold">
                  Estado
                </span>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  {catalogs?.projectStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex flex-col gap-2">
                  <span className="text-slate-700 dark:text-white text-sm font-bold">
                    Descripción
                  </span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-32 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Describe los objetivos y alcance del proyecto..."
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Timeline & Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-blue-500" size={24} />
                Fechas y Presupuesto
              </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Fecha de Inicio"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
              <Input
                label="Fecha de Fin"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
              <div className="flex flex-col gap-2">
                <span className="text-slate-700 dark:text-white text-sm font-bold">
                  Complejidad
                </span>
                <select
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  {catalogs?.complexityLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Presupuesto Estimado"
                type="number"
                name="budgetEstimate"
                value={formData.budgetEstimate}
                onChange={handleChange}
                placeholder="50000"
                icon={DollarSign}
                hint="En USD (opcional)"
              />
            </div>
          </Card>

          {/* Skill Requirements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <Target className="text-emerald-500" size={24} />
                  Requisitos de Habilidades
                  <Badge variant="default">{requirements.length}</Badge>
                </CardTitle>
                <Button
                  size="sm"
                  icon={Plus}
                  onClick={addSkillModal.open}
                  type="button"
                >
                  Agregar
                </Button>
              </div>
            </CardHeader>

            {requirements.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No hay requisitos de habilidades definidos
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={addSkillModal.open}
                  type="button"
                >
                  Agregar Primer Requisito
                </Button>
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
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {req.skillName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="danger">
                              {getLevelLabel(req.requiredLevel)}
                            </Badge>
                          </div>
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
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {req.skillName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="default">
                              {getLevelLabel(req.requiredLevel)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </form>
      </div>

      {/* Modal para agregar skill */}
      <Modal
        isOpen={addSkillModal.isOpen}
        onClose={addSkillModal.close}
        title="Agregar Requisito de Habilidad"
        size="md"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-slate-700 dark:text-white text-sm font-bold">
              Habilidad *
            </span>
            <select
              value={newSkillId}
              onChange={(e) => setNewSkillId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            >
              <option value="">Seleccionar habilidad...</option>
              {filteredSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} {skill.category ? `(${skill.category})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-slate-700 dark:text-white text-sm font-bold">
              Nivel Requerido
            </span>
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            >
              {catalogs?.skillLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.id} - {level.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newSkillMandatory}
              onChange={(e) => setNewSkillMandatory(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 dark:border-[#233948] text-primary focus:ring-primary"
            />
            <span className="text-slate-700 dark:text-white text-sm font-medium">
              ¿Es obligatorio?
            </span>
          </label>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-[#233948]">
            <Button
              variant="outline"
              onClick={addSkillModal.close}
              disabled={isAddingSkill}
            >
              Cancelar
            </Button>
            <Button
              icon={isAddingSkill ? Loader2 : CheckCircle2}
              onClick={handleAddSkill}
              isLoading={isAddingSkill}
              disabled={!newSkillId}
            >
              {isAddingSkill ? "Agregando..." : "Agregar Requisito"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditProjectPage;