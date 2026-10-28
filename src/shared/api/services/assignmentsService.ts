import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentResponse,
  ApiResponse,
} from "../types";

export const assignmentsService = {
  async getAll(filters?: {
    projectId?: string;
    userId?: string;
  }): Promise<ApiResponse<AssignmentResponse[]>> {
    return apiClient.get<AssignmentResponse[]>(
      API_ENDPOINTS.ASSIGNMENTS.BASE,
      filters,
    );
  },

  async create(data: CreateAssignmentRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.ASSIGNMENTS.BASE, data);
  },

  async update(
    id: string,
    data: UpdateAssignmentRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.ASSIGNMENTS.BY_ID(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.ASSIGNMENTS.BY_ID(id));
  },
};

