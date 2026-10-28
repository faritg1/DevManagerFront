import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CreateWelfareProgramRequest,
  CreateWelfareRequestRequest,
  SolidarityFundDto,
  WelfareAidDto,
  WelfareProgramDto,
  WelfareRequestDto,
} from "../types";

const E = API_ENDPOINTS.BIENESTAR;

export const bienestarService = {
  getPrograms: (): Promise<ApiResponse<WelfareProgramDto[]>> => apiClient.get(E.PROGRAMAS),

  createProgram: (data: CreateWelfareProgramRequest): Promise<ApiResponse<WelfareProgramDto>> => apiClient.post(E.PROGRAMAS, data),

  createRequest: (data: CreateWelfareRequestRequest): Promise<ApiResponse<WelfareRequestDto>> => apiClient.post(E.SOLICITUDES, data),

  getPendingRequests: (): Promise<ApiResponse<WelfareRequestDto[]>> => apiClient.get(E.SOLICITUDES_PENDIENTES),

  getRequestsByUser: (userId: string): Promise<ApiResponse<WelfareRequestDto[]>> => apiClient.get(E.SOLICITUDES_BY_USER(userId)),

  approveRequest: (id: string, approvedAmount: number, notes?: string): Promise<ApiResponse<WelfareRequestDto>> =>
    apiClient.post(E.SOLICITUD_APROBAR(id), notes ? { approvedAmount, notes } : { approvedAmount }),

  rejectRequest: (id: string, notes: string): Promise<ApiResponse<WelfareRequestDto>> =>
    apiClient.post(E.SOLICITUD_RECHAZAR(id), { notes }),

  deliverRequest: (id: string, requiresRepayment: boolean, concept?: string): Promise<ApiResponse<WelfareAidDto>> =>
    apiClient.post(E.SOLICITUD_ENTREGAR(id), concept ? { concept, requiresRepayment } : { requiresRepayment }),

  calculateFund: (period: string, notes?: string): Promise<ApiResponse<SolidarityFundDto>> =>
    apiClient.post(E.FONDO_CALCULAR, notes ? { period, notes } : { period }),

  getCurrentFund: (): Promise<ApiResponse<SolidarityFundDto>> => apiClient.get(E.FONDO),

  getAidsByUser: (userId: string): Promise<ApiResponse<WelfareAidDto[]>> => apiClient.get(E.AUXILIOS_BY_USER(userId)),
};

