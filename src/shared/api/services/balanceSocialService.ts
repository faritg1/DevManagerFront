import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, SocialBalanceIndicatorDto, SocialBalanceReportDto } from "../types";

const E = API_ENDPOINTS.BALANCE_SOCIAL;

export const balanceSocialService = {
  getIndicator: (userId: string, year: number): Promise<ApiResponse<SocialBalanceIndicatorDto>> =>
    apiClient.get(E.INDICADOR(userId, year)),

  getOrganizationIndicators: (year: number): Promise<ApiResponse<SocialBalanceIndicatorDto[]>> =>
    apiClient.get(E.ORGANIZACION(year)),

  getNonCompliant: (year: number): Promise<ApiResponse<SocialBalanceIndicatorDto[]>> =>
    apiClient.get(E.NO_CUMPLEN(year)),

  getReport: (year: number, includeRecommendations = true): Promise<ApiResponse<SocialBalanceReportDto>> =>
    apiClient.get(E.REPORTE(year), { incluirRecomendaciones: includeRecommendations }),
};

