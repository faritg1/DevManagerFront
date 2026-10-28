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
  query: (query: string, context?: string): Promise<ApiResponse<CooperativeQueryResponse>> =>
    apiClient.post(E.CONSULTAR, context ? { query, context } : { query }),

  answer: (question: string, associateType?: string): Promise<ApiResponse<CooperativeQueryResponse>> =>
    apiClient.post(E.RESPONDER, associateType ? { question, associateType } : { question }),

  generateReport: (year: number, includeRecommendations: boolean): Promise<ApiResponse<SocialBalanceReportDto>> =>
    apiClient.post(E.GENERAR_REPORTE, { year, includeRecommendations }),

  verifyCompliance: (data: VerifyComplianceRequest): Promise<ApiResponse<ComplianceDto>> =>
    apiClient.post(E.VERIFICAR_CUMPLIMIENTO, data),
};

