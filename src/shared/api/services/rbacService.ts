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
  PermissionTreeNode,
  MyPermissionsResponse,
} from "../types";

export const rbacService = {
  async getRoles(): Promise<ApiResponse<RoleDto[]>> {
    return apiClient.get<RoleDto[]>(API_ENDPOINTS.ROLES.BASE);
  },

  async createRole(data: CreateRoleRequest): Promise<ApiResponse<RoleDto>> {
    return apiClient.post<RoleDto>(API_ENDPOINTS.ROLES.BASE, data);
  },

  async updateRole(
    id: string,
    data: UpdateRoleRequest,
  ): Promise<ApiResponse<RoleDto>> {
    return apiClient.put<RoleDto>(API_ENDPOINTS.ROLES.BY_ID(id), data);
  },

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.ROLES.BY_ID(id));
  },

  async getRolePermissions(
    id: string,
  ): Promise<ApiResponse<RolePermissionsResponse>> {
    return apiClient.get<RolePermissionsResponse>(
      API_ENDPOINTS.ROLES.PERMISSIONS(id),
    );
  },

  async updateRolePermissions(
    roleId: string,
    data: UpdateRolePermissionsRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.ROLES.PERMISSIONS(roleId), data);
  },

  async revokeRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      API_ENDPOINTS.ROLES.PERMISSION_REVOKE(roleId, permissionId),
    );
  },

  async getAllPermissions(): Promise<ApiResponse<PermissionDto[]>> {
    return apiClient.get<PermissionDto[]>(API_ENDPOINTS.PERMISSIONS.BASE);
  },

  async getPermissionTree(roleId?: string): Promise<ApiResponse<PermissionTreeNode[]>> {
    return apiClient.get<PermissionTreeNode[]>(API_ENDPOINTS.PERMISSIONS.TREE, { roleId });
  },

  async getMyPermissions(): Promise<ApiResponse<MyPermissionsResponse>> {
    return apiClient.get<MyPermissionsResponse>(API_ENDPOINTS.PERMISSIONS.ME);
  },

  async getGroupedPermissions(): Promise<ApiResponse<PermissionGroupDto[]>> {
    return apiClient.get<PermissionGroupDto[]>(
      API_ENDPOINTS.PERMISSIONS.GROUPED,
    );
  },

  async assignRoleToUser(data: AssignRoleRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.ROLES.ASSIGN_TO_USER, data);
  },

  async revokeRoleFromUser(
    data: RevokeRoleRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.ROLES.REVOKE_FROM_USER, data);
  },

  async assignPermissionToUser(
    data: AssignPermissionOverrideRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.PERMISSIONS.ASSIGN_TO_USER, data);
  },

  async getUserEffectivePermissions(
    userId: string,
  ): Promise<ApiResponse<EffectivePermissionsResponse>> {
    return apiClient.get<EffectivePermissionsResponse>(
      API_ENDPOINTS.PERMISSIONS.USER_EFFECTIVE(userId),
    );
  },

};

