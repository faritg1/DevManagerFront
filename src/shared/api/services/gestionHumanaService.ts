/**
 * Gestión Humana Solidaria Service
 * Competencias cooperativas
 * Rutas: api/gestion-humana/competencias
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CompetenciaAsociadoDto,
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

export const gestionHumanaService = {
  // ===== Competencias =====

  /**
   * Obtiene las competencias de un asociado
   * GET /api/gestion-humana/competencias/{asociadoId}
   */
  async getCompetenciasByAsociado(
    asociadoId: string,
  ): Promise<ApiResponse<CompetenciaAsociadoDto[]>> {
    return apiClient.get<CompetenciaAsociadoDto[]>(
      API_ENDPOINTS.GESTION_HUMANA.COMPETENCIAS_BY_ASOCIADO(asociadoId),
    );
  },

  /**
   * Registra una nueva competencia para un asociado (query params)
   * POST /api/gestion-humana/competencias?asociadoId=&organizationId=&competencia=&nivel=
   */
  async createCompetencia(
    asociadoId: string,
    organizationId: string,
    competencia: string,
    nivel: number,
  ): Promise<ApiResponse<CompetenciaAsociadoDto>> {
    const endpoint = withQuery(API_ENDPOINTS.GESTION_HUMANA.COMPETENCIAS_CREATE, {
      asociadoId,
      organizationId,
      competencia,
      nivel,
    });
    return apiClient.post<CompetenciaAsociadoDto>(endpoint);
  },

  /**
   * Actualiza la disponibilidad de una competencia (body: bool crudo)
   * PATCH /api/gestion-humana/competencias/{competenciaId}/disponibilidad
   */
  async updateCompetenciaDisponibilidad(
    competenciaId: string,
    disponible: boolean,
  ): Promise<ApiResponse<CompetenciaAsociadoDto>> {
    return apiClient.patch<CompetenciaAsociadoDto>(
      API_ENDPOINTS.GESTION_HUMANA.COMPETENCIA_DISPONIBILIDAD(competenciaId),
      disponible,
    );
  },
};

export default gestionHumanaService;
