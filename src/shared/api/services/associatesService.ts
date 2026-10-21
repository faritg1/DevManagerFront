/**
 * Associates Service
 * Asociados (ciclo de vida, periodos de membresía) y documento de identidad
 * Todos los endpoints son solo Admin
 */

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
  /** GET /api/associates?status= */
  async getAll(status?: AssociateStatus): Promise<ApiResponse<AssociateDto[]>> {
    const qs = status ? `?status=${status}` : "";
    return apiClient.get<AssociateDto[]>(`${API_ENDPOINTS.ASSOCIATES.BASE}${qs}`);
  },

  /** GET /api/associates/{userId} */
  async getById(userId: string): Promise<ApiResponse<AssociateDetailDto>> {
    return apiClient.get<AssociateDetailDto>(API_ENDPOINTS.ASSOCIATES.BY_ID(userId));
  },

  /** POST /api/associates — 404 usuario inexistente, 409 ya es asociado */
  async create(data: CreateAssociateRequest): Promise<ApiResponse<AssociateDetailDto>> {
    return apiClient.post<AssociateDetailDto>(API_ENDPOINTS.ASSOCIATES.BASE, data);
  },

  /** POST /api/associates/{userId}/transitions */
  async transition(
    userId: string,
    data: TransitionRequest,
  ): Promise<ApiResponse<TransitionResult>> {
    return apiClient.post<TransitionResult>(API_ENDPOINTS.ASSOCIATES.TRANSITIONS(userId), data);
  },

  /** PUT /api/users/{id}/document — 422 CONSENT_REQUIRED sin consentimiento activo */
  async setDocument(
    userId: string,
    data: SetDocumentRequest,
  ): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(API_ENDPOINTS.USERS.DOCUMENT(userId), data);
  },
};

export default associatesService;
