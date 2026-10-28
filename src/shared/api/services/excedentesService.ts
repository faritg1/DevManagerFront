import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  ApproveSurplusRequest,
  CalculateSurplusRequest,
  SurplusDistributionDto,
} from "../types";

const E = API_ENDPOINTS.EXCEDENTES;

export const excedentesService = {
  getAll: (): Promise<ApiResponse<SurplusDistributionDto[]>> => apiClient.get(E.BASE),

  getByPeriod: (period: string): Promise<ApiResponse<SurplusDistributionDto>> => apiClient.get(E.BY_PERIODO(period)),

  calculate: (data: CalculateSurplusRequest): Promise<ApiResponse<SurplusDistributionDto>> => apiClient.post(E.CALCULAR, data),

  approve: (id: string, data: ApproveSurplusRequest): Promise<ApiResponse<SurplusDistributionDto>> => apiClient.post(E.APROBAR(id), data),
};

