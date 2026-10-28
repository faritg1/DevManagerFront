/**
 * Gestión Humana Service — competencias cooperativas
 * Rutas: api/gestion-humana/competencias — la organización sale del JWT.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, CompetencyDto, CreateCompetencyRequest } from "../types";

const E = API_ENDPOINTS.GESTION_HUMANA;

export const gestionHumanaService = {
  /** GET /api/gestion-humana/competencias/{userId} */
  getByUser: (userId: string): Promise<ApiResponse<CompetencyDto[]>> => apiClient.get(E.COMPETENCIAS_BY_USER(userId)),

  /** GET /api/gestion-humana/competencias/buscar?name=&onlyAvailable= */
  search: (name: string, onlyAvailable = true): Promise<ApiResponse<CompetencyDto[]>> =>
    apiClient.get(E.COMPETENCIAS_BUSCAR, { name, onlyAvailable }),

  /** POST /api/gestion-humana/competencias (Admin) */
  create: (data: CreateCompetencyRequest): Promise<ApiResponse<CompetencyDto>> => apiClient.post(E.COMPETENCIAS, data),

  /** PATCH /api/gestion-humana/competencias/{id}/disponibilidad (Admin) */
  setAvailability: (id: string, isAvailable: boolean): Promise<ApiResponse<CompetencyDto>> =>
    apiClient.patch(E.COMPETENCIA_DISPONIBILIDAD(id), { isAvailable }),
};

export default gestionHumanaService;
