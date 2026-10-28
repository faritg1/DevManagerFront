/**
 * Excedentes Service
 * Distribución de excedentes (Ley 79 art. 54 — 20/20/10)
 * Rutas: api/excedentes
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, CreateExcedenteDto, ExcedenteDto } from "../types";

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

export const excedentesService = {
  /**
   * Calcula y registra la distribución de excedentes
   * POST /api/excedentes/calcular
   */
  async calcularDistribucion(
    data: CreateExcedenteDto,
  ): Promise<ApiResponse<ExcedenteDto>> {
    return apiClient.post<ExcedenteDto>(API_ENDPOINTS.EXCEDENTES.CALCULAR, data);
  },

  /**
   * Obtiene distribución por período (periodo = 'yyyy-MM-dd')
   * GET /api/excedentes/{organizationId}/{periodo}
   */
  async getByPeriodo(
    organizationId: string,
    periodo: string,
  ): Promise<ApiResponse<ExcedenteDto | null>> {
    return apiClient.get<ExcedenteDto | null>(
      API_ENDPOINTS.EXCEDENTES.BY_PERIODO(organizationId, periodo),
    );
  },

  /**
   * Obtiene todas las distribuciones de una organización
   * GET /api/excedentes/{organizationId}
   */
  async getByOrganizacion(
    organizationId: string,
  ): Promise<ApiResponse<ExcedenteDto[]>> {
    return apiClient.get<ExcedenteDto[]>(
      API_ENDPOINTS.EXCEDENTES.BY_ORGANIZACION(organizationId),
    );
  },

  /**
   * Aprueba la distribución en Asamblea General (query params)
   * POST /api/excedentes/{excedenteId}/aprobar?revalorizacion=&retornoCooperativo=
   */
  async aprobarDistribucion(
    excedenteId: string,
    revalorizacion?: number | null,
    retornoCooperativo?: number | null,
  ): Promise<ApiResponse<ExcedenteDto>> {
    const endpoint = withQuery(API_ENDPOINTS.EXCEDENTES.APROBAR(excedenteId), {
      revalorizacion,
      retornoCooperativo,
    });
    return apiClient.post<ExcedenteDto>(endpoint);
  },
};

export default excedentesService;
