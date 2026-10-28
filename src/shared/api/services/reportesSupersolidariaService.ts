/**
 * Reportes Supersolidaria Service
 * Reportes trimestrales/anuales para la Superintendencia de la Economía Solidaria.
 * Rutas: api/reportes/supersolidaria — la organización sale del JWT.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  GenerateSupersolidariaReportRequest,
  SupersolidariaReportDto,
} from "../types";

const E = API_ENDPOINTS.REPORTES_SUPERSOLIDARIA;

export const reportesSupersolidariaService = {
  /** GET /api/reportes/supersolidaria */
  getAll: (): Promise<ApiResponse<SupersolidariaReportDto[]>> => apiClient.get(E.BASE),

  /** GET /api/reportes/supersolidaria/{yyyy-MM-dd} — 404 si no hay reporte para el período */
  getByPeriod: (period: string): Promise<ApiResponse<SupersolidariaReportDto>> => apiClient.get(E.BY_PERIODO(period)),

  /** POST /api/reportes/supersolidaria/generar (Admin) — regenera mientras no se haya enviado */
  generate: (data: GenerateSupersolidariaReportRequest): Promise<ApiResponse<SupersolidariaReportDto>> =>
    apiClient.post(E.GENERAR, data),

  /** POST /api/reportes/supersolidaria/{id}/enviar (Admin) */
  markSent: (id: string): Promise<ApiResponse<SupersolidariaReportDto>> => apiClient.post(E.ENVIAR(id)),
};

export default reportesSupersolidariaService;
