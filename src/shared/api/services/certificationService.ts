import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  CertificationResponse,
  CreateCertificationRequest,
  UpdateCertificationRequest,
  ApiResponse,
} from "../types";

export const certificationService = {
  async getMyCertifications(): Promise<ApiResponse<CertificationResponse[]>> {
    return apiClient.get<CertificationResponse[]>(
      API_ENDPOINTS.CERTIFICATIONS.ME,
    );
  },

  async getMyCertificationById(
    id: string,
  ): Promise<ApiResponse<CertificationResponse>> {
    return apiClient.get<CertificationResponse>(
      API_ENDPOINTS.CERTIFICATIONS.BY_ID(id),
    );
  },

  async createMyCertification(
    data: CreateCertificationRequest,
  ): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.CERTIFICATIONS.ME, data);
  },

  async updateMyCertification(
    id: string,
    data: UpdateCertificationRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.CERTIFICATIONS.BY_ID(id), data);
  },

  async deleteMyCertification(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.CERTIFICATIONS.BY_ID(id));
  },
};

