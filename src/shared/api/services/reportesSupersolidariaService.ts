import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  GenerateSupersolidariaReportRequest,
  SupersolidariaReportDto,
} from "../types";

const E = API_ENDPOINTS.REPORTES_SUPERSOLIDARIA;

export const reportesSupersolidariaService = {
  getAll: (): Promise<ApiResponse<SupersolidariaReportDto[]>> => apiClient.get(E.BASE),

  getByPeriod: (period: string): Promise<ApiResponse<SupersolidariaReportDto>> => apiClient.get(E.BY_PERIODO(period)),

  generate: (data: GenerateSupersolidariaReportRequest): Promise<ApiResponse<SupersolidariaReportDto>> =>
    apiClient.post(E.GENERAR, data),

  markSent: (id: string): Promise<ApiResponse<SupersolidariaReportDto>> => apiClient.post(E.ENVIAR(id)),
};

