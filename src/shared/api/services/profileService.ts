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

  /**
   * Crea el perfil del usuario autenticado. Si el backend sólo soporta PUT esto
   * será equivalente a llamar a updateMyProfile, pero lo incluyo por si la API
   * responde con 404 en la primera inserción.
   */
  async createMyProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.PROFILE.ME, data);
  },

  /**
   * Elimina el perfil del usuario autenticado. Puede que el backend no lo exponga;
   * si no existe la ruta, la llamada fallará y el frontend lo manejará.
   * DELETE /api/profile/me  (no documentado pero intentamos)
   */
  async deleteMyProfile(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.PROFILE.ME);
  },
};

export default profileService;