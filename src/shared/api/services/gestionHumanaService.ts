import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, CompetencyDto, CreateCompetencyRequest } from "../types";

const E = API_ENDPOINTS.GESTION_HUMANA;

export const gestionHumanaService = {
  getByUser: (userId: string): Promise<ApiResponse<CompetencyDto[]>> => apiClient.get(E.COMPETENCIAS_BY_USER(userId)),

  search: (name: string, onlyAvailable = true): Promise<ApiResponse<CompetencyDto[]>> =>
    apiClient.get(E.COMPETENCIAS_BUSCAR, { name, onlyAvailable }),

  create: (data: CreateCompetencyRequest): Promise<ApiResponse<CompetencyDto>> => apiClient.post(E.COMPETENCIAS, data),

  setAvailability: (id: string, isAvailable: boolean): Promise<ApiResponse<CompetencyDto>> =>
    apiClient.patch(E.COMPETENCIA_DISPONIBILIDAD(id), { isAvailable }),
};

