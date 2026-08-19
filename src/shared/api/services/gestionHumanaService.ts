/**
 * Gestión Humana Solidaria Service
 * Competencias cooperativas + Educación cooperativa
 * Rutas: api/gestion-humana/competencias, api/gestion-humana/educacion
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  AsociadoEducacionDto,
  CompetenciaAsociadoDto,
  CreateAsociadoEducacionDto,
  CreateProgramaEducacionDto,
  ProgramaEducacionDto,
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

  // ===== Educación =====

  /**
   * Obtiene los programas educativos de una organización
   * GET /api/gestion-humana/educacion/programas/{organizationId}
   */
  async getProgramasEducacion(
    organizationId: string,
  ): Promise<ApiResponse<ProgramaEducacionDto[]>> {
    return apiClient.get<ProgramaEducacionDto[]>(
      API_ENDPOINTS.EDUCACION.PROGRAMAS(organizationId),
    );
  },

  /**
   * Crea un nuevo programa educativo
   * POST /api/gestion-humana/educacion/programas
   */
  async createProgramaEducacion(
    data: CreateProgramaEducacionDto,
  ): Promise<ApiResponse<ProgramaEducacionDto>> {
    return apiClient.post<ProgramaEducacionDto>(
      API_ENDPOINTS.EDUCACION.PROGRAMAS_CREATE,
      data,
    );
  },

  /**
   * Inscribe un asociado en un programa educativo
   * POST /api/gestion-humana/educacion/inscribir
   */
  async inscribirEducacion(
    data: CreateAsociadoEducacionDto,
  ): Promise<ApiResponse<AsociadoEducacionDto>> {
    return apiClient.post<AsociadoEducacionDto>(
      API_ENDPOINTS.EDUCACION.INSCRIBIR,
      data,
    );
  },

  /**
   * Obtiene el historial educativo de un asociado
   * GET /api/gestion-humana/educacion/historial/{asociadoId}
   */
  async getHistorialEducacion(
    asociadoId: string,
  ): Promise<ApiResponse<AsociadoEducacionDto[]>> {
    return apiClient.get<AsociadoEducacionDto[]>(
      API_ENDPOINTS.EDUCACION.HISTORIAL(asociadoId),
    );
  },

  /**
   * Verifica si un asociado cumple las 20 horas mínimas anuales
   * GET /api/gestion-humana/educacion/cumplimiento/{asociadoId}/{anio}
   */
  async cumpleMinimoHoras(
    asociadoId: string,
    anio: number,
  ): Promise<ApiResponse<boolean>> {
    return apiClient.get<boolean>(
      API_ENDPOINTS.EDUCACION.CUMPLIMIENTO(asociadoId, anio),
    );
  },
};

export default gestionHumanaService;
