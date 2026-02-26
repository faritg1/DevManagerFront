/**
 * RBAC Service
 * Maneja roles, permisos y asignaciones
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionDto,
  PermissionGroupDto,
  RolePermissionsResponse,
  UpdateRolePermissionsRequest,
  AssignRoleRequest,
  RevokeRoleRequest,
  AssignPermissionOverrideRequest,
  EffectivePermissionsResponse,
  ValidatePermissionRequest,
  ValidatePermissionResponse,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from "../types";

export const rbacService = {
  // ============ ROLES ============

  /**
   * Listar todos los roles de la organización
   * GET /api/roles
   */
  async getRoles(): Promise<ApiResponse<RoleDto[]>> {
    return apiClient.get<RoleDto[]>(API_ENDPOINTS.ROLES.BASE);
  },

  /**
   * Crear un nuevo rol
   * POST /api/roles
   */
  async createRole(data: CreateRoleRequest): Promise<ApiResponse<RoleDto>> {
    return apiClient.post<RoleDto>(API_ENDPOINTS.ROLES.BASE, data);
  },

  /**
   * Actualizar rol existente
   * PUT /api/roles/{id}
   */
  async updateRole(
    id: string,
    data: UpdateRoleRequest,
  ): Promise<ApiResponse<RoleDto>> {
    return apiClient.put<RoleDto>(API_ENDPOINTS.ROLES.BY_ID(id), data);
  },

  /**
   * Eliminar rol
   * DELETE /api/roles/{id}
   */
  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.ROLES.BY_ID(id));
  },

  // ============ ROLE PERMISSIONS ============

  /**
   * Ver permisos de un rol
   * GET /api/roles/{id}/permissions
   */
  async getRolePermissions(
    id: string,
  ): Promise<ApiResponse<RolePermissionsResponse>> {
    return apiClient.get<RolePermissionsResponse>(
      API_ENDPOINTS.ROLES.PERMISSIONS(id),
    );
  },

  /**
   * Asignar permisos a un rol (Reemplaza todos)
   * PUT /api/roles/{id}/permissions
   */
  async updateRolePermissions(
    roleId: string,
    data: UpdateRolePermissionsRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.ROLES.PERMISSIONS(roleId), data);
  },

  /**
   * Revocar un permiso específico de un rol
   * DELETE /api/roles/{roleId}/permissions/{permissionId}
   */
  async revokeRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      API_ENDPOINTS.ROLES.PERMISSION_REVOKE(roleId, permissionId),
    );
  },

  // ============ PERMISSIONS CATALOG ============

  /**
   * Listar todos los permisos (plano)
   * GET /api/permissions
   */
  async getAllPermissions(): Promise<ApiResponse<PermissionDto[]>> {
    return apiClient.get<PermissionDto[]>(API_ENDPOINTS.PERMISSIONS.BASE);
  },

  /**
   * Crear permiso
   * POST /api/permissions
   */
  async createPermission(
    data: CreatePermissionRequest,
  ): Promise<ApiResponse<PermissionDto>> {
    return apiClient.post<PermissionDto>(API_ENDPOINTS.PERMISSIONS.BASE, data);
  },

  /**
   * Actualizar permiso
   * PUT /api/permissions/{id}
   */
  async updatePermission(
    id: string,
    data: UpdatePermissionRequest,
  ): Promise<ApiResponse<PermissionDto>> {
    return apiClient.put<PermissionDto>(
      API_ENDPOINTS.PERMISSIONS.BY_ID(id),
      data,
    );
  },

  /**
   * Eliminar permiso
   * DELETE /api/permissions/{id}
   */
  async deletePermission(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.PERMISSIONS.BY_ID(id));
  },

  /**
   * Listar permisos agrupados por módulo
   * GET /api/permissions/grouped
   */
  async getGroupedPermissions(): Promise<ApiResponse<PermissionGroupDto[]>> {
    return apiClient.get<PermissionGroupDto[]>(
      API_ENDPOINTS.PERMISSIONS.GROUPED,
    );
  },

  // ============ ASSIGNMENTS & OVERRIDES ============

  /**
   * Asignar rol a usuario
   * POST /api/roles/assign-to-user
   */
  async assignRoleToUser(data: AssignRoleRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.ROLES.ASSIGN_TO_USER, data);
  },

  /**
   * Revocar rol de usuario
   * POST /api/roles/revoke-from-user
   */
  async revokeRoleFromUser(
    data: RevokeRoleRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.ROLES.REVOKE_FROM_USER, data);
  },

  /**
   * Asignar permiso directo (Override)
   * POST /api/permissions/assign-to-user
   */
  async assignPermissionToUser(
    data: AssignPermissionOverrideRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.PERMISSIONS.ASSIGN_TO_USER, data);
  },

  // ============ VALIDATION ============

  /**
   * Consultar permisos efectivos de un usuario
   * GET /api/permissions/user/{userId}/effective
   */
  async getUserEffectivePermissions(
    userId: string,
  ): Promise<ApiResponse<EffectivePermissionsResponse>> {
    return apiClient.get<EffectivePermissionsResponse>(
      API_ENDPOINTS.PERMISSIONS.USER_EFFECTIVE(userId),
    );
  },

  /**
   * Validar si un usuario tiene permiso (Check en tiempo real)
   * POST /api/permissions/validate
   */
  async validatePermission(
    data: ValidatePermissionRequest,
  ): Promise<ApiResponse<ValidatePermissionResponse>> {
    return apiClient.post<ValidatePermissionResponse>(
      API_ENDPOINTS.PERMISSIONS.VALIDATE,
      data,
    );
  },
};

export default rbacService;
