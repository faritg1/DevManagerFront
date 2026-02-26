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
  isEditing: boolean;
  isSaving: boolean;
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
  saveProfile: () => Promise<boolean>;
  loadAvailableRoles: () => Promise<void>;
  requestRoleChange: (roleId: string) => Promise<boolean>;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});

  const [effectivePerms, setEffectivePerms] =
    useState<EffectivePermissionsResponse | null>(null);
  const [permsLoading, setPermsLoading] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [requestingRoleId, setRequestingRoleId] = useState<string | null>(null);

  // load profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
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
            console.error("Failed to load effective permissions", err);
          } finally {
            setPermsLoading(false);
          }
        }
      } catch (err: any) {
        // if 404 not found, handle it gracefully by letting the user create it via UI
        if (err && err.status === 404) {
          setProfile(null);
          setProfileForm({});
        } else {
          console.error("Error fetching profile", err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const startEditing = () => setIsEditing(true);
  const cancelEditing = () => setIsEditing(false);

  const saveProfile = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const response = await profileService.updateMyProfile(profileForm);
      if (response.success) {
        setProfile((prev) => {
          if (prev) return { ...prev, ...profileForm };
          // create new profile object from form
          return { userId: user?.id || '', ...profileForm } as ProfileResponse;
        });
        setIsEditing(false);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
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
  };
}
