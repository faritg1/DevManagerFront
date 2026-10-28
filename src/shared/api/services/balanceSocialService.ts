/**
 * Balance Social Service
 * Indicadores por asociado y por organización, no-cumplen educación
 * Rutas: api/balance-social
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, IndicadorBalanceSocialDto } from "../types";

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

export const balanceSocialService = {
  /**
   * Obtiene el indicador de balance social de un asociado en un año
   * GET /api/balance-social/indicador/{asociadoId}/{anio}
   */
  async getIndicador(
    asociadoId: string,
    anio: number,
  ): Promise<ApiResponse<IndicadorBalanceSocialDto | null>> {
    return apiClient.get<IndicadorBalanceSocialDto | null>(
      API_ENDPOINTS.BALANCE_SOCIAL.INDICADOR(asociadoId, anio),
    );
  },

  /**
   * Calcula y registra el indicador de balance social de un asociado (query params)
   * POST /api/balance-social/indicador/calcular?asociadoId=&organizationId=&anio=
   */
  async calcularIndicador(
    asociadoId: string,
    organizationId: string,
    anio: number,
  ): Promise<ApiResponse<IndicadorBalanceSocialDto>> {
    const endpoint = withQuery(API_ENDPOINTS.BALANCE_SOCIAL.INDICADOR_CALCULAR, {
      asociadoId,
      organizationId,
      anio,
    });
    return apiClient.post<IndicadorBalanceSocialDto>(endpoint);
  },

  /**
   * Obtiene los indicadores de una organización en un año
   * GET /api/balance-social/organizacion/{organizationId}/{anio}
   */
  async getIndicadoresByOrganizacion(
    organizationId: string,
    anio: number,
  ): Promise<ApiResponse<IndicadorBalanceSocialDto[]>> {
    return apiClient.get<IndicadorBalanceSocialDto[]>(
      API_ENDPOINTS.BALANCE_SOCIAL.ORGANIZACION(organizationId, anio),
    );
  },

  /**
   * Obtiene los asociados que NO cumplen con las horas mínimas de educación
   * GET /api/balance-social/no-cumplen/{organizationId}/{anio}
   */
  async getNoCumplenEducacion(
    organizationId: string,
    anio: number,
  ): Promise<ApiResponse<IndicadorBalanceSocialDto[]>> {
    return apiClient.get<IndicadorBalanceSocialDto[]>(
      API_ENDPOINTS.BALANCE_SOCIAL.NO_CUMPLEN(organizationId, anio),
    );
  },
};

export default balanceSocialService;
