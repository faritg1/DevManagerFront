/**
 * Habeas Data Service — solicitudes ARCO (Ley 1581/2012)
 * El consentimiento vive en consentsService (políticas de datos versionadas).
 * Rutas: api/habeas-data/arco
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, ArcoRequestDto, CreateArcoRequest } from "../types";

export const habeasDataService = {
  /** POST /api/habeas-data/arco — userId omitido = el usuario autenticado */
  async createArco(data: CreateArcoRequest): Promise<ApiResponse<ArcoRequestDto>> {
    return apiClient.post<ArcoRequestDto>(API_ENDPOINTS.HABEAS_DATA.ARCO, data);
  },

  /** POST /api/habeas-data/arco/{id}/atender (Admin) — 409 si ya fue respondida */
  async attendArco(id: string, response: string): Promise<ApiResponse<ArcoRequestDto>> {
    return apiClient.post<ArcoRequestDto>(API_ENDPOINTS.HABEAS_DATA.ARCO_ATENDER(id), { response });
  },

  /** POST /api/habeas-data/arco/{id}/rechazar (Admin) — 409 si ya fue respondida */
  async rejectArco(id: string, response: string): Promise<ApiResponse<ArcoRequestDto>> {
    return apiClient.post<ArcoRequestDto>(API_ENDPOINTS.HABEAS_DATA.ARCO_RECHAZAR(id), { response });
  },

  /** GET /api/habeas-data/arco/asociado/{userId} (propio o Admin) */
  async getArcoByUser(userId: string): Promise<ApiResponse<ArcoRequestDto[]>> {
    return apiClient.get<ArcoRequestDto[]>(API_ENDPOINTS.HABEAS_DATA.ARCO_BY_USER(userId));
  },

  /** GET /api/habeas-data/arco/pendientes (Admin) */
  async getPendingArco(): Promise<ApiResponse<ArcoRequestDto[]>> {
    return apiClient.get<ArcoRequestDto[]>(API_ENDPOINTS.HABEAS_DATA.ARCO_PENDIENTES);
  },
};

