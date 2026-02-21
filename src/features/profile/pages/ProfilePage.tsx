import React, { useState } from "react";
import { Loader2, UserX } from "lucide-react";
import { useAuth, useNotification, useConfig } from "../../../shared/context";
import { useModal } from "../../../shared/hooks";
import { useProfile } from "../hooks/useProfile";
import { useSkills } from "../hooks/useSkills";
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
  const [editingSkill, setEditingSkill] =
    useState<EmployeeSkillResponse | null>(null);
  const [skillForm, setSkillForm] = useState<UpsertEmployeeSkillRequest>({
    skillId: "",
    level: 3,
    evidenceUrl: "",
  });

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
              onAdd={addSkill}
              onEdit={editSkill}
              onDelete={removeSkill}
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
    </div>
  );
};

export default ProfilePage;
