import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AssociateDto,
  AssociateDetailDto,
  AssociateStatus,
  CreateAssociateRequest,
  TransitionRequest,
  TransitionResult,
  SetDocumentRequest,
  UserResponse,
  ApiResponse,
} from "../types";

export const associatesService = {
  async getAll(status?: AssociateStatus): Promise<ApiResponse<AssociateDto[]>> {
    const qs = status ? `?status=${status}` : "";
    return apiClient.get<AssociateDto[]>(`${API_ENDPOINTS.ASSOCIATES.BASE}${qs}`);
  },

  async getById(userId: string): Promise<ApiResponse<AssociateDetailDto>> {
    return apiClient.get<AssociateDetailDto>(API_ENDPOINTS.ASSOCIATES.BY_ID(userId));
  },

  async create(data: CreateAssociateRequest): Promise<ApiResponse<AssociateDetailDto>> {
    return apiClient.post<AssociateDetailDto>(API_ENDPOINTS.ASSOCIATES.BASE, data);
  },

  async transition(
    userId: string,
    data: TransitionRequest,
  ): Promise<ApiResponse<TransitionResult>> {
    return apiClient.post<TransitionResult>(API_ENDPOINTS.ASSOCIATES.TRANSITIONS(userId), data);
  },

  async setDocument(
    userId: string,
    data: SetDocumentRequest,
  ): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(API_ENDPOINTS.USERS.DOCUMENT(userId), data);
  },
};

