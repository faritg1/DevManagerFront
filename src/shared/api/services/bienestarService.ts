/**
 * Bienestar Service
 * Programas de bienestar, solicitudes, auxilios y fondo de solidaridad
 * Rutas: api/bienestar
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  AuxilioDto,
  CreateProgramaBienestarDto,
  CreateSolicitudBienestarDto,
  FondoSolidaridadDto,
  ProgramaBienestarDto,
  SolicitudBienestarDto,
} from "../types";

const withQuery = (
  endpoint: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string => {
  const search = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return search ? `${endpoint}?${search}` : endpoint;
};

export const bienestarService = {
  // ===== Programas =====

  /**
   * Obtiene los programas de bienestar de una organización
   * GET /api/bienestar/programas/{organizationId}
   */
  async getProgramas(
    organizationId: string,
  ): Promise<ApiResponse<ProgramaBienestarDto[]>> {
    return apiClient.get<ProgramaBienestarDto[]>(
      API_ENDPOINTS.BIENESTAR.PROGRAMAS(organizationId),
    );
  },

  /**
   * Crea un nuevo programa de bienestar
   * POST /api/bienestar/programas
   */
  async createPrograma(
    data: CreateProgramaBienestarDto,
  ): Promise<ApiResponse<ProgramaBienestarDto>> {
    return apiClient.post<ProgramaBienestarDto>(
      API_ENDPOINTS.BIENESTAR.PROGRAMAS_CREATE,
      data,
    );
  },

  // ===== Solicitudes =====

  /**
   * Crea una solicitud de bienestar
   * POST /api/bienestar/solicitudes
   */
  async createSolicitud(
    data: CreateSolicitudBienestarDto,
  ): Promise<ApiResponse<SolicitudBienestarDto>> {
    return apiClient.post<SolicitudBienestarDto>(
      API_ENDPOINTS.BIENESTAR.SOLICITUDES_CREATE,
      data,
    );
  },

  /**
   * Obtiene las solicitudes de un asociado
   * GET /api/bienestar/solicitudes/{asociadoId}
   */
  async getSolicitudesByAsociado(
    asociadoId: string,
  ): Promise<ApiResponse<SolicitudBienestarDto[]>> {
    return apiClient.get<SolicitudBienestarDto[]>(
      API_ENDPOINTS.BIENESTAR.SOLICITUDES_BY_ASOCIADO(asociadoId),
    );
  },

  /**
   * Aprueba una solicitud de bienestar (query params)
   * POST /api/bienestar/solicitudes/{solicitudId}/aprobar?montoAprobado=&resueltoPorUserId=
   */
  async aprobarSolicitud(
    solicitudId: string,
    montoAprobado: number,
    resueltoPorUserId: string,
  ): Promise<ApiResponse<SolicitudBienestarDto>> {
    const endpoint = withQuery(
      API_ENDPOINTS.BIENESTAR.SOLICITUD_APROBAR(solicitudId),
      { montoAprobado, resueltoPorUserId },
    );
    return apiClient.post<SolicitudBienestarDto>(endpoint);
  },

  /**
   * Rechaza una solicitud de bienestar (query params)
   * POST /api/bienestar/solicitudes/{solicitudId}/rechazar?observaciones=&resueltoPorUserId=
   */
  async rechazarSolicitud(
    solicitudId: string,
    observaciones: string,
    resueltoPorUserId: string,
  ): Promise<ApiResponse<SolicitudBienestarDto>> {
    const endpoint = withQuery(
      API_ENDPOINTS.BIENESTAR.SOLICITUD_RECHAZAR(solicitudId),
      { observaciones, resueltoPorUserId },
    );
    return apiClient.post<SolicitudBienestarDto>(endpoint);
  },

  // ===== Fondo de Solidaridad =====

  /**
   * Calcula y registra el aporte al fondo de solidaridad (10% excedentes)
   * POST /api/bienestar/fondo/calcular?organizationId=&periodo=&totalExcedentes=
   */
  async calcularAporteFondo(
    organizationId: string,
    periodo: string,
    totalExcedentes: number,
  ): Promise<ApiResponse<FondoSolidaridadDto>> {
    const endpoint = withQuery(API_ENDPOINTS.BIENESTAR.FONDO_CALCULAR, {
      organizationId,
      periodo,
      totalExcedentes,
    });
    return apiClient.post<FondoSolidaridadDto>(endpoint);
  },

  /**
   * Obtiene el estado actual del fondo de solidaridad
   * GET /api/bienestar/fondo/{organizationId}
   */
  async getFondoActual(
    organizationId: string,
  ): Promise<ApiResponse<FondoSolidaridadDto | null>> {
    return apiClient.get<FondoSolidaridadDto | null>(
      API_ENDPOINTS.BIENESTAR.FONDO_ACTUAL(organizationId),
    );
  },

  // ===== Auxilios =====

  /**
   * Obtiene los auxilios de un asociado
   * GET /api/bienestar/auxilios/{asociadoId}
   */
  async getAuxiliosByAsociado(
    asociadoId: string,
  ): Promise<ApiResponse<AuxilioDto[]>> {
    return apiClient.get<AuxilioDto[]>(
      API_ENDPOINTS.BIENESTAR.AUXILIOS_BY_ASOCIADO(asociadoId),
    );
  },
};

export default bienestarService;
