import React, { useState } from "react";
import { Loader2, UserX, Sparkles, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useAuth, useNotification, useConfig } from "../../../shared/context";
import { useModal } from "../../../shared/hooks";
import { useProfile } from "../hooks/useProfile";
import { useSkills } from "../hooks/useSkills";
import { agentService } from "../../../shared/api";
import { Card, Badge, Button, Modal } from "../../../shared/ui";
import {
  ProfileHeader,
  BioCard,
  ProfessionalInfoCard,
  LinksCard,
  RolesPermissionsCard,
  SkillsSection,
  SkillModal,
  RequestRoleModal,
} from "../components";
import type {
  EmployeeSkillResponse,
  UpsertEmployeeSkillRequest,
  ValidateSkillAIResponse,
} from "../../../shared/api/types";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { catalogs } = useConfig();

  const {
    profile,
    isLoading: isLoadingProfile,
    isEditing,
    isSaving,
    profileForm,
    effectivePerms,
    permsLoading,
    availableRoles,
    rolesLoading,
    requestingRoleId,
    setRequestingRoleId,
    setProfileForm,
    startEditing,
    cancelEditing,
    saveProfile,
    loadAvailableRoles,
    requestRoleChange,
  } = useProfile();

  const {
    skills: mySkills,
    isLoading: isLoadingSkills,
    opLoading: skillOpLoading,
    availableSkills,
    loadingAvailable,
    fetchAvailableSkills,
    saveSkill,
    deleteSkill,
  } = useSkills();

  const skillModal = useModal();
  const requestRoleModal = useModal();
  const aiValidationModal = useModal();
  const [editingSkill, setEditingSkill] =
    useState<EmployeeSkillResponse | null>(null);
  const [skillForm, setSkillForm] = useState<UpsertEmployeeSkillRequest>({
    skillId: "",
    level: 3,
    evidenceUrl: "",
  });
  const [validatingSkillId, setValidatingSkillId] = useState<string | null>(null);
  const [aiValidationResult, setAiValidationResult] = useState<{
    skillName: string;
    level: number;
    result: ValidateSkillAIResponse;
  } | null>(null);

  const addSkill = async () => {
    setEditingSkill(null);
    setSkillForm({ skillId: "", level: 3, evidenceUrl: "" });
    // always refresh list when opening
    await fetchAvailableSkills();
    skillModal.open();
  };

  const editSkill = (skill: EmployeeSkillResponse) => {
    setEditingSkill(skill);
    setSkillForm({
      id: skill.id,
      skillId: skill.skillId,
      level: skill.level,
      evidenceUrl: skill.evidenceUrl || "",
    });
    skillModal.open();
  };

  const removeSkill = async (skill: EmployeeSkillResponse) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta habilidad?")) return;
    const ok = await deleteSkill(skill);
    if (ok)
      showNotification({ type: "success", message: "Habilidad eliminada" });
  };

  const saveSkillHandler = async () => {
    if (!skillForm.skillId) {
      showNotification({ type: "error", message: "Selecciona una habilidad" });
      return;
    }
    const ok = await saveSkill(skillForm);
    if (ok) {
      showNotification({
        type: "success",
        message: editingSkill
          ? "Habilidad actualizada exitosamente"
          : "Habilidad agregada exitosamente",
      });
      skillModal.close();
      setEditingSkill(null);
    } else {
      showNotification({
        type: "error",
        message: "Error al guardar habilidad",
      });
    }
  };

  const handleRequestRole = async () => {
    if (!requestingRoleId) return;
    const ok = await requestRoleChange(requestingRoleId);
    if (ok) {
      showNotification({
        type: "success",
        message: "Solicitud enviada / Rol actualizado (si tienes permisos)",
      });
      requestRoleModal.close();
    } else {
      showNotification({
        type: "error",
        message: "No se pudo solicitar el cambio",
      });
    }
  };

  const handleValidateSkillAI = async (skill: EmployeeSkillResponse) => {
    if (!user?.id) return;
    setValidatingSkillId(skill.id);
    try {
      const response = await agentService.validateSkill({
        userId: user.id,
        skillId: skill.skillId,
        level: skill.level,
        evidenceUrl: skill.evidenceUrl,
      });
      if (response.success && response.data) {
        setAiValidationResult({
          skillName: skill.skillName,
          level: skill.level,
          result: response.data,
        });
        aiValidationModal.open();
      } else {
        showNotification({
          type: "error",
          message: response.message || "Error al validar la habilidad con IA",
        });
      }
    } catch (err) {
      showNotification({
        type: "error",
        message: "Error de conexión al servicio de IA",
      });
    } finally {
      setValidatingSkillId(null);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile && !isEditing && !isLoadingProfile) {
    return (
      <div className="flex flex-col h-full overflow-y-auto w-full items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
            <UserX className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Perfil no encontrado
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Aún no has configurado tu perfil profesional. Completalo para
            destacar en el equipo y compartir tus habilidades.
          </p>
          <button
            onClick={startEditing}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full"
          >
            Crear mi Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">
        <ProfileHeader
          userName={user?.name}
          userEmail={user?.email}
          userRole={user?.role}
          profile={profile}
          profileForm={profileForm}
          catalogs={catalogs}
          isEditing={isEditing}
          isSaving={isSaving}
          onStartEdit={startEditing}
          onCancelEdit={cancelEditing}
          onSave={async () => {
            const ok = await saveProfile();
            if (ok)
              showNotification({
                type: "success",
                message: "Perfil actualizado exitosamente",
              });
            else
              showNotification({
                type: "error",
                message: "Error al guardar perfil",
              });
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <BioCard
              bio={profile?.bio}
              isEditing={isEditing}
              formValue={profileForm.bio || ""}
              onChange={(val) =>
                setProfileForm((prev) => ({ ...prev, bio: val }))
              }
            />
            <ProfessionalInfoCard
              profile={profile}
              form={profileForm}
              catalogs={catalogs}
              isEditing={isEditing}
              onChange={(p) => setProfileForm((prev) => ({ ...prev, ...p }))}
            />
            <LinksCard
              profile={profile}
              form={profileForm}
              isEditing={isEditing}
              onChange={(p) => setProfileForm((prev) => ({ ...prev, ...p }))}
            />
            <RolesPermissionsCard
              effectivePerms={effectivePerms}
              permsLoading={permsLoading}
              onRequestRoleOpen={async () => {
                await loadAvailableRoles();
                requestRoleModal.open();
              }}
            />
          </div>
          <div className="space-y-6">
            <SkillsSection
              skills={mySkills}
              isLoading={isLoadingSkills}
              opLoading={skillOpLoading}
              validatingSkillId={validatingSkillId}
              onAdd={addSkill}
              onEdit={editSkill}
              onDelete={removeSkill}
              onValidateAI={handleValidateSkillAI}
              catalogs={catalogs}
            />
          </div>
        </div>
      </div>

      <SkillModal
        isOpen={skillModal.isOpen}
        onClose={() => {
          skillModal.close();
          setEditingSkill(null);
        }}
        loadingSkills={loadingAvailable}
        availableSkills={availableSkills}
        form={skillForm}
        setForm={setSkillForm}
        saving={skillOpLoading}
        editing={editingSkill}
        onSave={saveSkillHandler}
        catalogs={catalogs}
      />

      <RequestRoleModal
        isOpen={requestRoleModal.isOpen}
        onClose={() => {
          requestRoleModal.close();
          setRequestingRoleId(null);
        }}
        availableRoles={availableRoles}
        loading={rolesLoading}
        selectedRoleId={requestingRoleId}
        setSelectedRoleId={(id) => setRequestingRoleId(id)}
        onRequest={handleRequestRole}
      />

      {/* Modal resultado de validación IA */}
      <Modal
        isOpen={aiValidationModal.isOpen}
        onClose={aiValidationModal.close}
        title="Validación IA de Habilidad"
        icon={<Sparkles className="text-purple-500" size={20} />}
        size="md"
      >
        {aiValidationResult && (
          <div className="space-y-5">
            {/* Header con resultado */}
            <div className={`p-4 rounded-xl border ${
              aiValidationResult.result.isValid
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {aiValidationResult.result.isValid ? (
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                ) : (
                  <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                )}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {aiValidationResult.skillName} — Nivel {aiValidationResult.level}
                  </h4>
                  <p className={`text-sm font-medium ${
                    aiValidationResult.result.isValid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {aiValidationResult.result.isValid ? 'Nivel validado correctamente' : 'Requiere revisión'}
                  </p>
                </div>
              </div>

              {/* Barra de confianza */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Confianza del análisis</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {aiValidationResult.result.confidence}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      aiValidationResult.result.confidence >= 70
                        ? 'bg-emerald-500'
                        : aiValidationResult.result.confidence >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${aiValidationResult.result.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Razonamiento */}
            <div>
              <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                Análisis
              </h5>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-[#0d1419] p-3 rounded-xl border border-slate-200 dark:border-[#233948]">
                {aiValidationResult.result.reasoning}
              </p>
            </div>

            {/* Recomendaciones */}
            {aiValidationResult.result.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" />
                  Recomendaciones
                </h5>
                <ul className="space-y-2">
                  {aiValidationResult.result.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0d1419] p-3 rounded-lg border border-slate-200 dark:border-[#233948]"
                    >
                      <Badge variant="default" className="shrink-0 mt-0.5">{i + 1}</Badge>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={aiValidationModal.close}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfilePage;
