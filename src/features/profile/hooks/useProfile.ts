import React, { useState, useEffect } from "react";
import { profileService, rbacService, usersService } from "../../../shared/api";
import type {
  ProfileResponse,
  UpdateProfileRequest,
  EffectivePermissionsResponse,
  RoleDto,
} from "../../../shared/api/types";
import type { ApiError } from "../../../shared/api";
import { useAuth } from "../../../shared/context";

const formatErrors = (errors: Record<string, string[]>): string =>
  Object.entries(errors).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join('; ');

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

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await profileService.getMyProfile();

      if (response.success && response.data) {
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
        setProfile(null);
        setProfileForm({});
      }

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
    } catch (err) {
      if ((err as ApiError)?.status === 404) {
        setProfile(null);
        setProfileForm({});
      } else {
        setError("No se pudo cargar el perfil. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const startEditing = () => setIsEditing(true);
  const cancelEditing = () => setIsEditing(false);

  const cleanProfileData = (data: UpdateProfileRequest): UpdateProfileRequest => {
    const cleaned: UpdateProfileRequest = {};
    
    if (data.bio && data.bio.trim()) {
      cleaned.bio = data.bio.trim();
    }
    
    if (data.yearsExperience !== undefined && data.yearsExperience !== null && data.yearsExperience >= 0) {
      cleaned.yearsExperience = data.yearsExperience;
    }
    
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
    
    if (data.seniorityLevelId !== undefined) cleaned.seniorityLevelId = data.seniorityLevelId;
    if (data.location) cleaned.location = data.location;
    if (data.timezone) cleaned.timezone = data.timezone;
    if (data.availability) cleaned.availability = data.availability;
    if (data.preferredTitle) cleaned.preferredTitle = data.preferredTitle;
    if (data.hourlyRate !== undefined) cleaned.hourlyRate = data.hourlyRate;
    
    return cleaned;
  };

  const saveProfile = async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    setIsSaving(true);
    
    try {
      const cleanedData = cleanProfileData(profileForm);
      
      let response;
      
      if (!profile) {
        // POST also reactivates a soft-deleted profile.
        try {
          response = await profileService.createMyProfile(cleanedData);
        } catch (postError) {
          // 409: the profile already exists, fall back to PUT.
          if ((postError as ApiError)?.status === 409) {
            response = await profileService.updateMyProfile(cleanedData);
          } else {
            throw postError;
          }
        }
      } else {
        response = await profileService.updateMyProfile(cleanedData);
      }

      if (response.success) {
        await fetchProfile();
        setIsEditing(false);
        return { success: true, message: response.message || 'Perfil guardado exitosamente' };
      }
      const errors = (response as { errors?: ApiError['errors'] }).errors;
      return { success: false, message: (errors ? formatErrors(errors) : response.message) || 'Error al guardar perfil' };
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError?.errors) {
        return { success: false, message: formatErrors(apiError.errors) };
      }
      return { success: false, message: apiError?.message || 'Error de conexión al guardar perfil' };
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfile = async (): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await profileService.deleteMyProfile();
    } catch (err) {
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
    reload: fetchProfile,
  };
}
