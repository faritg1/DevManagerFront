/**
 * Excedentes Service
 * Distribución de excedentes cooperativos (Ley 79/1988 art. 54).
 * Rutas: api/excedentes — la organización sale del JWT.
 */

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
  /** GET /api/excedentes */
  getAll: (): Promise<ApiResponse<SurplusDistributionDto[]>> => apiClient.get(E.BASE),

  /** GET /api/excedentes/{yyyy-MM-dd} — 404 si no hay distribución para el período */
  getByPeriod: (period: string): Promise<ApiResponse<SurplusDistributionDto>> => apiClient.get(E.BY_PERIODO(period)),

  /** POST /api/excedentes/calcular (Admin) */
  calculate: (data: CalculateSurplusRequest): Promise<ApiResponse<SurplusDistributionDto>> => apiClient.post(E.CALCULAR, data),

  /** POST /api/excedentes/{id}/aprobar (Admin) */
  approve: (id: string, data: ApproveSurplusRequest): Promise<ApiResponse<SurplusDistributionDto>> => apiClient.post(E.APROBAR(id), data),
};

export default excedentesService;
