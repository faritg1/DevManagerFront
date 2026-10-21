/**
 * Consents Service
 * Políticas de tratamiento de datos (Habeas Data) y consentimientos
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  DataPolicyDto,
  CreateDataPolicyRequest,
  ConsentDto,
  ApiResponse,
} from "../types";

export const consentsService = {
  /** GET /api/data-policies (más reciente primero) */
  async getPolicies(): Promise<ApiResponse<DataPolicyDto[]>> {
    return apiClient.get<DataPolicyDto[]>(API_ENDPOINTS.DATA_POLICIES.BASE);
  },

  /** POST /api/data-policies — 409 versión duplicada. Las políticas son inmutables. */
  async createPolicy(data: CreateDataPolicyRequest): Promise<ApiResponse<DataPolicyDto>> {
    return apiClient.post<DataPolicyDto>(API_ENDPOINTS.DATA_POLICIES.BASE, data);
  },

  /** GET /api/users/{userId}/consents */
  async getByUser(userId: string): Promise<ApiResponse<ConsentDto[]>> {
    return apiClient.get<ConsentDto[]>(API_ENDPOINTS.USERS.CONSENTS(userId));
  },

  /** POST /api/users/{userId}/consents — 409 si ya hay uno activo */
  async grant(userId: string, policyVersionId: string): Promise<ApiResponse<ConsentDto>> {
    return apiClient.post<ConsentDto>(API_ENDPOINTS.USERS.CONSENTS(userId), { policyVersionId });
  },

  /** POST /api/consents/{id}/revoke — 400 sin motivo, 409 ya revocado */
  async revoke(id: string, reason: string): Promise<ApiResponse<ConsentDto>> {
    return apiClient.post<ConsentDto>(API_ENDPOINTS.CONSENTS.REVOKE(id), { reason });
  },
};

export default consentsService;
