import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, OrganizationDto, UpdateOrganizationRequest } from "../types";

const E = API_ENDPOINTS.ORGANIZATIONS;

export const organizationsService = {
  getCurrent: (): Promise<ApiResponse<OrganizationDto>> => apiClient.get(E.ME),

  updateCurrent: (data: UpdateOrganizationRequest): Promise<ApiResponse<OrganizationDto>> => apiClient.put(E.ME, data),
};

