/**
 * Nomina Service
 * Compensación de asociados (CTAs) y planilla PILA del sector solidario
 * Rutas: api/nomina/compensacion, api/nomina/pila
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CompensacionDto,
  CreateCompensacionDto,
  PilaAporteDto,
} from "../types";

/**
 * Concatena query params a un endpoint (los métodos post/put/patch de apiClient
 * no aceptan params, así que se construyen manualmente para endpoints query-based).
 */
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

export const nominaService = {
  /**
   * Obtiene las compensaciones de un asociado en un año
   * GET /api/nomina/compensacion/{asociadoId}/{anio}
   */
  async getCompensacionesByAsociado(
    asociadoId: string,
    anio: number,
  ): Promise<ApiResponse<CompensacionDto[]>> {
    return apiClient.get<CompensacionDto[]>(
      API_ENDPOINTS.NOMINA.COMPENSACION_BY_ASOCIADO(asociadoId, anio),
    );
  },

  /**
   * Crea un nuevo registro de compensación
   * POST /api/nomina/compensacion
   */
  async createCompensacion(
    data: CreateCompensacionDto,
  ): Promise<ApiResponse<CompensacionDto>> {
    return apiClient.post<CompensacionDto>(
      API_ENDPOINTS.NOMINA.COMPENSACION_CREATE,
      data,
    );
  },

  /**
   * Genera la planilla PILA de una organización en un período
   * GET /api/nomina/pila/{organizationId}/{anio}/{mes}
   */
  async getPilaPlanilla(
    organizationId: string,
    anio: number,
    mes: number,
  ): Promise<ApiResponse<PilaAporteDto[]>> {
    return apiClient.get<PilaAporteDto[]>(
      API_ENDPOINTS.NOMINA.PILA_PLANILLA(organizationId, anio, mes),
    );
  },

  /**
   * Calcula los aportes PILA para un asociado (query params)
   * POST /api/nomina/pila/calcular?asociadoId=&ingresos=&nivelRiesgoARL=
   */
  async calcularPila(
    asociadoId: string,
    ingresos: number,
    nivelRiesgoARL = 1,
  ): Promise<ApiResponse<PilaAporteDto>> {
    const endpoint = withQuery(API_ENDPOINTS.NOMINA.PILA_CALCULAR, {
      asociadoId,
      ingresos,
      nivelRiesgoARL,
    });
    return apiClient.post<PilaAporteDto>(endpoint);
  },
};

export default nominaService;
