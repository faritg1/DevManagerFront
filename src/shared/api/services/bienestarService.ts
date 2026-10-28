/**
 * Bienestar Service
 * Programas de bienestar, solicitudes de auxilio, auxilios entregados y fondo de solidaridad.
 * Rutas: api/bienestar — la organización sale del JWT.
 */

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
  /** GET /api/bienestar/programas */
  getPrograms: (): Promise<ApiResponse<WelfareProgramDto[]>> => apiClient.get(E.PROGRAMAS),

  /** POST /api/bienestar/programas (Admin) */
  createProgram: (data: CreateWelfareProgramRequest): Promise<ApiResponse<WelfareProgramDto>> => apiClient.post(E.PROGRAMAS, data),

  /** POST /api/bienestar/solicitudes — userId omitido = el usuario autenticado */
  createRequest: (data: CreateWelfareRequestRequest): Promise<ApiResponse<WelfareRequestDto>> => apiClient.post(E.SOLICITUDES, data),

  /** GET /api/bienestar/solicitudes/pendientes (Admin) */
  getPendingRequests: (): Promise<ApiResponse<WelfareRequestDto[]>> => apiClient.get(E.SOLICITUDES_PENDIENTES),

  /** GET /api/bienestar/solicitudes/{userId} (propio o Admin) */
  getRequestsByUser: (userId: string): Promise<ApiResponse<WelfareRequestDto[]>> => apiClient.get(E.SOLICITUDES_BY_USER(userId)),

  /** POST /api/bienestar/solicitudes/{id}/aprobar (Admin) */
  approveRequest: (id: string, approvedAmount: number, notes?: string): Promise<ApiResponse<WelfareRequestDto>> =>
    apiClient.post(E.SOLICITUD_APROBAR(id), notes ? { approvedAmount, notes } : { approvedAmount }),

  /** POST /api/bienestar/solicitudes/{id}/rechazar (Admin) */
  rejectRequest: (id: string, notes: string): Promise<ApiResponse<WelfareRequestDto>> =>
    apiClient.post(E.SOLICITUD_RECHAZAR(id), { notes }),

  /** POST /api/bienestar/solicitudes/{id}/entregar (Admin) */
  deliverRequest: (id: string, requiresRepayment: boolean, concept?: string): Promise<ApiResponse<WelfareAidDto>> =>
    apiClient.post(E.SOLICITUD_ENTREGAR(id), concept ? { concept, requiresRepayment } : { requiresRepayment }),

  /** POST /api/bienestar/fondo/calcular (Admin) — aporte desde la distribución de excedentes del período */
  calculateFund: (period: string, notes?: string): Promise<ApiResponse<SolidarityFundDto>> =>
    apiClient.post(E.FONDO_CALCULAR, notes ? { period, notes } : { period }),

  /** GET /api/bienestar/fondo — 404 si aún no hay fondo */
  getCurrentFund: (): Promise<ApiResponse<SolidarityFundDto>> => apiClient.get(E.FONDO),

  /** GET /api/bienestar/auxilios/{userId} (propio o Admin) */
  getAidsByUser: (userId: string): Promise<ApiResponse<WelfareAidDto[]>> => apiClient.get(E.AUXILIOS_BY_USER(userId)),
};

