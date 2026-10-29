import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, PlatformOrganization, PlatformUser } from "../types";

const E = API_ENDPOINTS.PLATFORM;

/** Platform super administration: every organization and its users (403 for anyone else). */
export const platformService = {
  listOrganizations: (search?: string): Promise<ApiResponse<PlatformOrganization[]>> =>
    apiClient.get(E.ORGANIZATIONS, { search: search?.trim() || undefined }),

  listUsers: (organizationId: string): Promise<ApiResponse<PlatformUser[]>> => apiClient.get(E.USERS(organizationId)),
};
