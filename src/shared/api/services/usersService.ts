import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
} from "../types";

export const usersService = {
  async getAll(): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>(API_ENDPOINTS.USERS.BASE);
  },

  async getById(id: string): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>(API_ENDPOINTS.USERS.BY_ID(id));
  },

  async create(data: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.post<UserResponse>(API_ENDPOINTS.USERS.BASE, data);
  },

  async update(
    id: string,
    data: UpdateUserRequest,
  ): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(API_ENDPOINTS.USERS.BY_ID(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USERS.BY_ID(id));
  },
};

