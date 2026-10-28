/**
 * Asistente Cooperativo Service
 * Consultas normativas, reportes de Balance Social y verificación de cumplimiento
 * Rutas: api/asistente
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  BalanceSocialReportDto,
  CooperativaQueryRequest,
  CooperativaQueryResponse,
  CumplimientoDto,
  GenerarBalanceSocialRequest,
  ResponderDudaRequest,
  VerificarCumplimientoRequest,
} from "../types";

export const asistenteService = {
  /**
   * Consulta normativa al Asistente Cooperativo
   * POST /api/asistente/consultar
   */
  async consultar(
    data: CooperativaQueryRequest,
  ): Promise<ApiResponse<CooperativaQueryResponse>> {
    return apiClient.post<CooperativaQueryResponse>(
      API_ENDPOINTS.ASISTENTE.CONSULTAR,
      data,
    );
  },

  /**
   * Genera un reporte de Balance Social
   * POST /api/asistente/generar-reporte
   */
  async generarReporte(
    data: GenerarBalanceSocialRequest,
  ): Promise<ApiResponse<BalanceSocialReportDto>> {
    return apiClient.post<BalanceSocialReportDto>(
      API_ENDPOINTS.ASISTENTE.GENERAR_REPORTE,
      data,
    );
  },

  /**
   * Verifica cumplimiento normativo cooperativo
   * POST /api/asistente/verificar-cumplimiento
   */
  async verificarCumplimiento(
    data: VerificarCumplimientoRequest,
  ): Promise<ApiResponse<CumplimientoDto>> {
    return apiClient.post<CumplimientoDto>(
      API_ENDPOINTS.ASISTENTE.VERIFICAR_CUMPLIMIENTO,
      data,
    );
  },

  /**
   * Responde una duda de asociado
   * POST /api/asistente/responder
   */
  async responder(
    data: ResponderDudaRequest,
  ): Promise<ApiResponse<CooperativaQueryResponse>> {
    return apiClient.post<CooperativaQueryResponse>(
      API_ENDPOINTS.ASISTENTE.RESPONDER,
      data,
    );
  },
};

export default asistenteService;
