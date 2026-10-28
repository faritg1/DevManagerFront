/**
 * Habeas Data Service
 * Autorizaciones de tratamiento de datos y solicitudes ARCO (Ley 1581/2012)
 * Rutas: api/habeas-data
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  AutorizacionDto,
  CreateAutorizacionDto,
  CreateSolicitudARCODto,
  SolicitudARCODto,
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

export const habeasDataService = {
  // ===== Autorizaciones =====

  /**
   * Registra una autorización de tratamiento de datos
   * POST /api/habeas-data/autorizaciones
   */
  async registrarAutorizacion(
    data: CreateAutorizacionDto,
  ): Promise<ApiResponse<AutorizacionDto>> {
    return apiClient.post<AutorizacionDto>(
      API_ENDPOINTS.HABEAS_DATA.AUTORIZACIONES_CREATE,
      data,
    );
  },

  /**
   * Revoca una autorización de tratamiento de datos
   * POST /api/habeas-data/autorizaciones/{autorizacionId}/revocar
   */
  async revocarAutorizacion(
    autorizacionId: string,
  ): Promise<ApiResponse<AutorizacionDto>> {
    return apiClient.post<AutorizacionDto>(
      API_ENDPOINTS.HABEAS_DATA.AUTORIZACION_REVOCAR(autorizacionId),
    );
  },

  /**
   * Obtiene la autorización vigente de un asociado
   * GET /api/habeas-data/autorizaciones/{asociadoId}/vigente
   */
  async getAutorizacionVigente(
    asociadoId: string,
  ): Promise<ApiResponse<AutorizacionDto | null>> {
    return apiClient.get<AutorizacionDto | null>(
      API_ENDPOINTS.HABEAS_DATA.AUTORIZACION_VIGENTE(asociadoId),
    );
  },

  /**
   * Verifica si un asociado tiene autorización vigente
   * GET /api/habeas-data/autorizaciones/{asociadoId}/tiene-vigente
   */
  async tieneAutorizacionVigente(
    asociadoId: string,
  ): Promise<ApiResponse<boolean>> {
    return apiClient.get<boolean>(
      API_ENDPOINTS.HABEAS_DATA.AUTORIZACION_TIENE_VIGENTE(asociadoId),
    );
  },

  // ===== Solicitudes ARCO =====

  /**
   * Registra una solicitud ARCO
   * POST /api/habeas-data/arco
   */
  async crearSolicitudARCO(
    data: CreateSolicitudARCODto,
  ): Promise<ApiResponse<SolicitudARCODto>> {
    return apiClient.post<SolicitudARCODto>(
      API_ENDPOINTS.HABEAS_DATA.ARCO_CREATE,
      data,
    );
  },

  /**
   * Atiende una solicitud ARCO (query params)
   * POST /api/habeas-data/arco/{solicitudId}/atender?respuesta=
   */
  async atenderSolicitudARCO(
    solicitudId: string,
    respuesta: string,
  ): Promise<ApiResponse<SolicitudARCODto>> {
    const endpoint = withQuery(API_ENDPOINTS.HABEAS_DATA.ARCO_ATENDER(solicitudId), {
      respuesta,
    });
    return apiClient.post<SolicitudARCODto>(endpoint);
  },

  /**
   * Rechaza una solicitud ARCO (query params)
   * POST /api/habeas-data/arco/{solicitudId}/rechazar?motivoRechazo=
   */
  async rechazarSolicitudARCO(
    solicitudId: string,
    motivoRechazo: string,
  ): Promise<ApiResponse<SolicitudARCODto>> {
    const endpoint = withQuery(
      API_ENDPOINTS.HABEAS_DATA.ARCO_RECHAZAR(solicitudId),
      { motivoRechazo },
    );
    return apiClient.post<SolicitudARCODto>(endpoint);
  },

  /**
   * Obtiene las solicitudes ARCO de un asociado
   * GET /api/habeas-data/arco/asociado/{asociadoId}
   */
  async getSolicitudesARCOByAsociado(
    asociadoId: string,
  ): Promise<ApiResponse<SolicitudARCODto[]>> {
    return apiClient.get<SolicitudARCODto[]>(
      API_ENDPOINTS.HABEAS_DATA.ARCO_BY_ASOCIADO(asociadoId),
    );
  },

  /**
   * Obtiene solicitudes ARCO pendientes de una organización
   * GET /api/habeas-data/arco/pendientes/{organizationId}
   */
  async getSolicitudesARCOPendientes(
    organizationId: string,
  ): Promise<ApiResponse<SolicitudARCODto[]>> {
    return apiClient.get<SolicitudARCODto[]>(
      API_ENDPOINTS.HABEAS_DATA.ARCO_PENDIENTES(organizationId),
    );
  },
};

export default habeasDataService;
