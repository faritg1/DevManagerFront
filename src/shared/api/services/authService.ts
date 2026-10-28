import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  LoginRequest,
  LoginResponse,
  RegisterOrganizationRequest,
  RegisterOrganizationResponse,
  ApiResponse,
} from "../types";
import { STORAGE_KEYS } from "../../config/constants";

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );

    if (response.success && response.data?.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    }

    return response;
  },

  async registerOrganization(
    data: RegisterOrganizationRequest,
  ): Promise<ApiResponse<RegisterOrganizationResponse>> {
    const response = await apiClient.post<RegisterOrganizationResponse>(
      API_ENDPOINTS.AUTH.REGISTER_ORGANIZATION,
      data,
    );

    if (response.success && response.data?.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    }

    return response;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    window.location.hash = "#/";
  },
};

