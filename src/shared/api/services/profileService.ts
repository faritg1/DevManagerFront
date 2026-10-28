import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ProfileResponse,
  UpdateProfileRequest,
  ApiResponse,
} from "../types";

export const profileService = {
  async getMyProfile(): Promise<ApiResponse<ProfileResponse>> {
    return apiClient.get<ProfileResponse>(API_ENDPOINTS.PROFILE.ME);
  },

  async updateMyProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.PROFILE.ME, data);
  },

  async createMyProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.PROFILE.ME, data);
  },

  async deleteMyProfile(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.PROFILE.ME);
  },
};

