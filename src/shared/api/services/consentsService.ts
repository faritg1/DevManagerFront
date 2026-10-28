import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  DataPolicyDto,
  CreateDataPolicyRequest,
  ConsentDto,
  ApiResponse,
} from "../types";

export const consentsService = {
  async getPolicies(): Promise<ApiResponse<DataPolicyDto[]>> {
    return apiClient.get<DataPolicyDto[]>(API_ENDPOINTS.DATA_POLICIES.BASE);
  },

  async createPolicy(data: CreateDataPolicyRequest): Promise<ApiResponse<DataPolicyDto>> {
    return apiClient.post<DataPolicyDto>(API_ENDPOINTS.DATA_POLICIES.BASE, data);
  },

  async getByUser(userId: string): Promise<ApiResponse<ConsentDto[]>> {
    return apiClient.get<ConsentDto[]>(API_ENDPOINTS.USERS.CONSENTS(userId));
  },

  async grant(userId: string, policyVersionId: string): Promise<ApiResponse<ConsentDto>> {
    return apiClient.post<ConsentDto>(API_ENDPOINTS.USERS.CONSENTS(userId), { policyVersionId });
  },

  async revoke(id: string, reason: string): Promise<ApiResponse<ConsentDto>> {
    return apiClient.post<ConsentDto>(API_ENDPOINTS.CONSENTS.REVOKE(id), { reason });
  },
};

