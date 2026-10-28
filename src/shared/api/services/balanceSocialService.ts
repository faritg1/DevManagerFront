/**
 * Balance Social Service
 * Indicadores calculados en vivo (educación, asambleas, órganos, auxilios) y reporte anual.
 * Rutas: api/balance-social — la organización sale del JWT.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, SocialBalanceIndicatorDto, SocialBalanceReportDto } from "../types";

const E = API_ENDPOINTS.BALANCE_SOCIAL;

export const balanceSocialService = {
  /** GET /api/balance-social/indicador/{userId}/{anio} (propio o Admin) */
  getIndicator: (userId: string, year: number): Promise<ApiResponse<SocialBalanceIndicatorDto>> =>
    apiClient.get(E.INDICADOR(userId, year)),

  /** GET /api/balance-social/organizacion/{anio} (Admin) */
  getOrganizationIndicators: (year: number): Promise<ApiResponse<SocialBalanceIndicatorDto[]>> =>
    apiClient.get(E.ORGANIZACION(year)),

  /** GET /api/balance-social/no-cumplen/{anio} (Admin) */
  getNonCompliant: (year: number): Promise<ApiResponse<SocialBalanceIndicatorDto[]>> =>
    apiClient.get(E.NO_CUMPLEN(year)),

  /** GET /api/balance-social/reporte/{anio}?incluirRecomendaciones= */
  getReport: (year: number, includeRecommendations = true): Promise<ApiResponse<SocialBalanceReportDto>> =>
    apiClient.get(E.REPORTE(year), { incluirRecomendaciones: includeRecommendations }),
};

export default balanceSocialService;
