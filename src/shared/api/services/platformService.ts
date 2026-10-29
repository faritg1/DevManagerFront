import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, ImpersonationLogEntry, ImpersonationResponse, PlatformOrganization, PlatformUser } from "../types";

const E = API_ENDPOINTS.PLATFORM;

/** Platform super administration: every organization and its users (403 for anyone else). */
export const platformService = {
  listOrganizations: (search?: string): Promise<ApiResponse<PlatformOrganization[]>> =>
    apiClient.get(E.ORGANIZATIONS, { search: search?.trim() || undefined }),

  listUsers: (organizationId: string): Promise<ApiResponse<PlatformUser[]>> => apiClient.get(E.USERS(organizationId)),

  /** Short-lived token of that user (no refresh); the caller swaps sessions with ../impersonation. */
  impersonate: (userId: string): Promise<ApiResponse<ImpersonationResponse>> => apiClient.post(E.IMPERSONATE, { userId }),

  /** Called with the impersonation token itself; logs the end of the session. */
  stopImpersonation: (): Promise<ApiResponse<void>> => apiClient.post(E.IMPERSONATE_STOP),

  listImpersonations: (): Promise<ApiResponse<ImpersonationLogEntry[]>> => apiClient.get(E.IMPERSONATIONS),
};
