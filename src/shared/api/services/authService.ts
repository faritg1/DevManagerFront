/**
 * Auth Service
 * Maneja autenticación y registro de organizaciones
 * Basado en: API_GUIDE.md
 */

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
  /**
   * Inicia sesión con email y contraseña
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );

    // Guardar token y datos de usuario si el login es exitoso
    if (response.success && response.data) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      localStorage.setItem(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify({
          id: response.data.userId,
          email: response.data.email,
          name: response.data.fullName,
          role: response.data.role,
          organizationId: response.data.organizationId,
          organizationName: response.data.organizationName,
        }),
      );
    }

    return response;
  },

  /**
   * Registra una nueva organización con su usuario administrador
   * POST /api/auth/register-organization
   * Retorna token JWT para acceso inmediato
   */
  async registerOrganization(
    data: RegisterOrganizationRequest,
  ): Promise<ApiResponse<RegisterOrganizationResponse>> {
    const response = await apiClient.post<RegisterOrganizationResponse>(
      API_ENDPOINTS.AUTH.REGISTER_ORGANIZATION,
      data,
    );

    // Guardar token si el registro es exitoso
    if (response.success && response.data?.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      localStorage.setItem(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify({
          id: response.data.adminUserId,
          email: response.data.adminEmail,
          organizationId: response.data.organizationId,
          organizationName: response.data.organizationName,
        }),
      );
    }

    return response;
  },

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    window.location.hash = "#/";
  },

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Obtiene el usuario actual del localStorage
   */
  getCurrentUser(): {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    organizationName: string;
  } | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

export default authService;