/**
 * Asistente Cooperativo Service
 * Consultas normativas, dudas de asociados, Balance Social y verificación de cumplimiento.
 * Rutas: api/asistente — la organización sale del JWT.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  ComplianceDto,
  CooperativeQueryResponse,
  SocialBalanceReportDto,
  VerifyComplianceRequest,
} from "../types";

const E = API_ENDPOINTS.ASISTENTE;

export const asistenteService = {
  /** POST /api/asistente/consultar */
  query: (query: string, context?: string): Promise<ApiResponse<CooperativeQueryResponse>> =>
    apiClient.post(E.CONSULTAR, context ? { query, context } : { query }),

  /** POST /api/asistente/responder */
  answer: (question: string, associateType?: string): Promise<ApiResponse<CooperativeQueryResponse>> =>
    apiClient.post(E.RESPONDER, associateType ? { question, associateType } : { question }),

  /** POST /api/asistente/generar-reporte (Admin) */
  generateReport: (year: number, includeRecommendations: boolean): Promise<ApiResponse<SocialBalanceReportDto>> =>
    apiClient.post(E.GENERAR_REPORTE, { year, includeRecommendations }),

  /** POST /api/asistente/verificar-cumplimiento (Admin) */
  verifyCompliance: (data: VerifyComplianceRequest): Promise<ApiResponse<ComplianceDto>> =>
    apiClient.post(E.VERIFICAR_CUMPLIMIENTO, data),
};

