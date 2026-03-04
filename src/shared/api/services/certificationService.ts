/**
 * Certification Service
 * Maneja las certificaciones profesionales del usuario autenticado
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  CertificationResponse,
  CreateCertificationRequest,
  UpdateCertificationRequest,
  ApiResponse,
} from "../types";

export const certificationService = {
  /**
   * Obtiene todas las certificaciones del usuario autenticado
   * GET /api/certifications/me
   */
  async getMyCertifications(): Promise<ApiResponse<CertificationResponse[]>> {
    return apiClient.get<CertificationResponse[]>(
      API_ENDPOINTS.CERTIFICATIONS.ME,
    );
  },

  /**
   * Obtiene una certificación específica por ID
   * GET /api/certifications/me/{id}
   */
  async getMyCertificationById(
    id: string,
  ): Promise<ApiResponse<CertificationResponse>> {
    return apiClient.get<CertificationResponse>(
      API_ENDPOINTS.CERTIFICATIONS.BY_ID(id),
    );
  },

  /**
   * Crea una nueva certificación para el usuario autenticado
   * POST /api/certifications/me
   */
  async createMyCertification(
    data: CreateCertificationRequest,
  ): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.CERTIFICATIONS.ME, data);
  },

  /**
   * Actualiza una certificación del usuario autenticado
   * PUT /api/certifications/me/{id}
   */
  async updateMyCertification(
    id: string,
    data: UpdateCertificationRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.CERTIFICATIONS.BY_ID(id), data);
  },

  /**
   * Elimina una certificación del usuario autenticado (soft delete)
   * DELETE /api/certifications/me/{id}
   */
  async deleteMyCertification(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.CERTIFICATIONS.BY_ID(id));
  },
};

export default certificationService;
