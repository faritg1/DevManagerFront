/**
 * Organizations Service
 * Organización del usuario autenticado (la del JWT); no hay listado entre organizaciones.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, OrganizationDto, UpdateOrganizationRequest } from "../types";

const E = API_ENDPOINTS.ORGANIZATIONS;

export const organizationsService = {
  /** GET /api/organizations/me — datos y conteos reales */
  getCurrent: (): Promise<ApiResponse<OrganizationDto>> => apiClient.get(E.ME),

  /** PUT /api/organizations/me (Admin) — 400 tipo inválido / nombre vacío, 409 NIT duplicado */
  updateCurrent: (data: UpdateOrganizationRequest): Promise<ApiResponse<OrganizationDto>> => apiClient.put(E.ME, data),
};

