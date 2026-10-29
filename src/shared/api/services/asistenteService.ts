import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  ComplianceDto,
  SocialBalanceReportDto,
  VerifyComplianceRequest,
} from "../types";

const E = API_ENDPOINTS.ASISTENTE;

export const asistenteService = {
  generateReport: (year: number, includeRecommendations: boolean): Promise<ApiResponse<SocialBalanceReportDto>> =>
    apiClient.post(E.GENERAR_REPORTE, { year, includeRecommendations }),

  verifyCompliance: (data: VerifyComplianceRequest): Promise<ApiResponse<ComplianceDto>> =>
    apiClient.post(E.VERIFICAR_CUMPLIMIENTO, data),
};

