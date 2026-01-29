/**
 * Profile Service
 * Maneja el perfil profesional del usuario autenticado
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ProfileResponse,
  UpdateProfileRequest,
  ApiResponse,
} from "../types";

export const profileService = {
  /**
   * Obtiene el perfil profesional del usuario autenticado
   * GET /api/profile/me
   */
  async getMyProfile(): Promise<ApiResponse<ProfileResponse>> {
    return apiClient.get<ProfileResponse>(API_ENDPOINTS.PROFILE.ME);
  },

  /**
   * Crea o actualiza el perfil del usuario autenticado (upsert)
   * PUT /api/profile/me
   */
  async updateMyProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.PROFILE.ME, data);
  },
};

export default profileService;