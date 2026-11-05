import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  LoginRequest,
  LoginResponse,
  RegisterOrganizationRequest,
  RegisterOrganizationResponse,
  ChangePasswordResponse,
  ApiResponse,
} from "../types";
import { STORAGE_KEYS } from "../../config/constants";
import { clearImpersonation } from "../impersonation";

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

  /** Closes every other session; the JWT it stores keeps this one alive. */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<ChangePasswordResponse>> {
    const response = await apiClient.post<ChangePasswordResponse>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });

    if (response.success && response.data?.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    }

    return response;
  },

  forgotPassword(email: string): Promise<ApiResponse<null>> {
    return apiClient.post<null>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
    return apiClient.post<null>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
  },

  /** Same policy as the API; returns the message to show, empty when valid. */
  validateNewPassword(password: string, confirmation: string): string {
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    return password === confirmation ? "" : "Las contraseñas no coinciden";
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    // Signing out while impersonating ends both sessions
    clearImpersonation();
    window.location.hash = "#/";
  },
};

