/**
 * Users Service
 * Maneja operaciones CRUD de usuarios
 * Basado en: API_GUIDE.md
 *
 * Todos los endpoints filtran automáticamente por OrganizationId (multi-tenancy)
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
} from "../types";

export const usersService = {
  /**
   * Obtiene todos los usuarios de la organización
   * GET /api/users
   */
  async getAll(): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>(API_ENDPOINTS.USERS.BASE);
  },

  /**
   * Obtiene un usuario por su ID
   * GET /api/users/{id}
   */
  async getById(id: string): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>(API_ENDPOINTS.USERS.BY_ID(id));
  },

  /**
   * Crea un nuevo usuario en la organización
   * POST /api/users
   * Requiere rol Admin o Manager
   */
  async create(data: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.post<UserResponse>(API_ENDPOINTS.USERS.BASE, data);
  },

  /**
   * Actualiza un usuario existente (partial update)
   * PUT /api/users/{id}
   * Nota: No se puede cambiar el email por seguridad
   */
  async update(
    id: string,
    data: UpdateUserRequest,
  ): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(API_ENDPOINTS.USERS.BY_ID(id), data);
  },

  /**
   * Elimina lógicamente un usuario (soft delete)
   * DELETE /api/users/{id}
   * El registro se mantiene para auditoría
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USERS.BY_ID(id));
  },
};

export default usersService;