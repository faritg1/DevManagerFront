import React, { useState, useEffect } from "react";
import { profileService, rbacService, usersService } from "../../../shared/api";
import type {
  ProfileResponse,
  UpdateProfileRequest,
  EffectivePermissionsResponse,
  RoleDto,
} from "../../../shared/api/types";
import { useAuth } from "../../../shared/context";

interface UseProfileResult {
  profile: ProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  profileForm: UpdateProfileRequest;
  effectivePerms: EffectivePermissionsResponse | null;
  permsLoading: boolean;
  availableRoles: RoleDto[];
  rolesLoading: boolean;
  requestingRoleId: string | null;
  setRequestingRoleId: React.Dispatch<React.SetStateAction<string | null>>;
  setProfileForm: React.Dispatch<React.SetStateAction<UpdateProfileRequest>>;
  startEditing: () => void;
  cancelEditing: () => void;
  saveProfile: () => Promise<{ success: boolean; message?: string }>;
  deleteProfile: () => Promise<boolean>;
  loadAvailableRoles: () => Promise<void>;
  requestRoleChange: (roleId: string) => Promise<boolean>;
  reload: () => void;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});

  const [effectivePerms, setEffectivePerms] =
    useState<EffectivePermissionsResponse | null>(null);
  const [permsLoading, setPermsLoading] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [requestingRoleId, setRequestingRoleId] = useState<string | null>(null);

  // function to load profile (reusable)
  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    console.log('[Profile] Iniciando carga de perfil...');
    try {
      const response = await profileService.getMyProfile();
      console.log('[Profile] Respuesta getMyProfile:', response);

      if (response.success && response.data) {
        console.log('[Profile] Perfil encontrado:', response.data);
        setProfile(response.data);
        setProfileForm({
          bio: response.data.bio || "",
          yearsExperience: response.data.yearsExperience || 0,
          linkedinUrl: response.data.linkedinUrl || "",
          githubUrl: response.data.githubUrl || "",
          portfolioUrl: response.data.portfolioUrl || "",
          seniorityLevelId: response.data.seniorityLevelId ?? undefined,
          location: response.data.location ?? undefined,
          timezone: response.data.timezone ?? undefined,
          availability: response.data.availability ?? undefined,
          preferredTitle: response.data.preferredTitle ?? undefined,
          hourlyRate: response.data.hourlyRate ?? undefined,
        });
      } else {
        console.log('[Profile] No se encontró perfil (respuesta sin datos)');
        setProfile(null);
        setProfileForm({});
      }

      // load perms regardless
      if (user?.id) {
        setPermsLoading(true);
        try {
          const permResp = await rbacService.getUserEffectivePermissions(
            user.id,
          );
          if (permResp.success && permResp.data) {
            setEffectivePerms(permResp.data);
          }
        } catch (err) {
          console.error("[Profile] Error al cargar permisos:", err);
        } finally {
          setPermsLoading(false);
        }
      }
    } catch (err: any) {
      console.error('[Profile] Error fetching profile:', err);
      // Verificar si es error 404
      const status = err?.status || err?.response?.status;
      if (status === 404) {
        console.log('[Profile] Perfil no encontrado (404)');
        setProfile(null);
        setProfileForm({});
      } else {
        setError("No se pudo cargar el perfil. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
      console.log('[Profile] Carga de perfil finalizada');
    }
  };

  // load profile on mount / user change
  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const startEditing = () => setIsEditing(true);
  const cancelEditing = () => setIsEditing(false);

  // Función para limpiar y preparar datos del perfil antes de enviar
  const cleanProfileData = (data: UpdateProfileRequest): UpdateProfileRequest => {
    const cleaned: UpdateProfileRequest = {};
    
    // Bio - texto libre
    if (data.bio && data.bio.trim()) {
      cleaned.bio = data.bio.trim();
    }
    
    // Years experience - número positivo
    if (data.yearsExperience !== undefined && data.yearsExperience !== null && data.yearsExperience >= 0) {
      cleaned.yearsExperience = data.yearsExperience;
    }
    
    // URLs - solo enviar si son válidas o vacías
    const isValidUrl = (url: string | null | undefined): boolean => {
      if (!url || url.trim() === '') return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };
    
    if (isValidUrl(data.linkedinUrl)) {
      cleaned.linkedinUrl = data.linkedinUrl;
    }
    if (isValidUrl(data.githubUrl)) {
      cleaned.githubUrl = data.githubUrl;
    }
    if (isValidUrl(data.portfolioUrl)) {
      cleaned.portfolioUrl = data.portfolioUrl;
    }
    
    // Otros campos opcionales
    if (data.seniorityLevelId !== undefined) cleaned.seniorityLevelId = data.seniorityLevelId;
    if (data.location) cleaned.location = data.location;
    if (data.timezone) cleaned.timezone = data.timezone;
    if (data.availability) cleaned.availability = data.availability;
    if (data.preferredTitle) cleaned.preferredTitle = data.preferredTitle;
    if (data.hourlyRate !== undefined) cleaned.hourlyRate = data.hourlyRate;
    
    console.log('[Profile] Datos limpiados:', cleaned);
    return cleaned;
  };

  const saveProfile = async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    setIsSaving(true);
    console.log('[Profile] Iniciando guardado...', { profileExists: !!profile, formData: profileForm });
    
    try {
      // Limpiar y validar datos antes de enviar
      const cleanedData = cleanProfileData(profileForm);
      
      let response;
      
      if (!profile) {
        // No existe perfil -> Usar POST para crear nuevo
        // POST reactiva el perfil si fue soft-deleted
        console.log('[Profile] No existe perfil, usando POST (crear) /api/profile/me...');
        
        try {
          response = await profileService.createMyProfile(cleanedData);
          console.log('[Profile] Respuesta createMyProfile (POST):', response);
        } catch (postError: any) {
          // Si POST retorna 409 (perfil ya existe), intentamos con PUT
          console.log('[Profile] POST lanzó error:', postError);
          if (postError?.status === 409) {
            console.log('[Profile] POST retornó 409, intentando con PUT...');
            response = await profileService.updateMyProfile(cleanedData);
            console.log('[Profile] Respuesta updateMyProfile (fallback PUT):', response);
          } else {
            // Rethrow si no es 409
            throw postError;
          }
        }
      } else {
        // Existe perfil -> Usar PUT para actualizar
        console.log('[Profile] Perfil existe, usando PUT (actualizar) /api/profile/me...');
        response = await profileService.updateMyProfile(cleanedData);
        console.log('[Profile] Respuesta updateMyProfile (PUT):', response);
      }

      if (response.success) {
        console.log('[Profile] Guardado exitoso, recargando perfil...');
        await fetchProfile();
        setIsEditing(false);
        console.log('[Profile] Perfil guardado exitosamente');
        return { success: true, message: response.message || 'Perfil guardado exitosamente' };
      } else {
        // Mostrar errores de validación del servidor
        const validationErrors = (response as any).errors ? 
          Object.entries((response as any).errors).map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`).join('; ') 
          : response.message;
        console.warn('[Profile] Guardado falló:', validationErrors);
        return { success: false, message: validationErrors || 'Error al guardar perfil' };
      }
    } catch (err: any) {
      console.error('[Profile] Excepción durante guardado:', err);
      
      // Manejar errores de validación (400 con errors)
      if (err?.errors) {
        const validationErrors = Object.entries(err.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join('; ');
        console.error('[Profile] Errores de validación:', validationErrors);
        return { success: false, message: validationErrors };
      }
      
      const errorMessage = err?.message || 'Error de conexión al guardar perfil';
      return { success: false, message: errorMessage };
    } finally {
      setIsSaving(false);
      console.log('[Profile] Guardado finalizado');
    }
  };

  const deleteProfile = async (): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const resp = await profileService.deleteMyProfile();
      if (resp.success) {
        // nothing additional
      }
    } catch (err) {
      console.warn("deleteMyProfile failed or not implemented", err);
    } finally {
      setProfile(null);
      setProfileForm({});
      setIsEditing(false);
      setIsDeleting(false);
    }
    return true;
  };

  const loadAvailableRoles = async () => {
    setRolesLoading(true);
    try {
      const resp = await rbacService.getRoles();
      if (resp.success && resp.data) setAvailableRoles(resp.data);
    } catch (err) {
      console.error("Failed to load roles list", err);
    } finally {
      setRolesLoading(false);
    }
  };

  const requestRoleChange = async (roleId: string) => {
    if (!user?.id) return false;
    try {
      const resp = await usersService.update(user.id, { roleId });
      if (resp.success) {
        // refresh perms
        const permResp = await rbacService.getUserEffectivePermissions(user.id);
        if (permResp.success && permResp.data) setEffectivePerms(permResp.data);
        return true;
      }
    } catch (err) {
      console.error("Request role change failed", err);
    }
    return false;
  };

  return {
    profile,
    isLoading,
    error,
    isEditing,
    isSaving,
    isDeleting,
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
    deleteProfile,
    loadAvailableRoles,
    requestRoleChange,
    // allow consumer to refetch
    reload: fetchProfile,
  };
}
