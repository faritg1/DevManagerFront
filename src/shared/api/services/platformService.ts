import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, DemoAccess, DemoAccessChange, ImpersonationLogEntry, ImpersonationResponse, OrganizationPlan, OrganizationPlanChange, OrganizationProviders, OrganizationProvidersChange, PlatformOrganization, PlatformUser, RegisterOrganizationRequest, RegisterOrganizationResponse } from "../types";

const E = API_ENDPOINTS.PLATFORM;
const providersUrl = (organizationId: string) => `${E.ORGANIZATIONS}/${organizationId}/providers`;

/** Platform super administration: every organization and its users (403 for anyone else). */
export const platformService = {
  listOrganizations: (search?: string): Promise<ApiResponse<PlatformOrganization[]>> =>
    apiClient.get(E.ORGANIZATIONS, { search: search?.trim() || undefined }),

  /** Created active, with its Admin; the public register leaves it pending instead. */
  createOrganization: (body: RegisterOrganizationRequest): Promise<ApiResponse<RegisterOrganizationResponse>> =>
    apiClient.post(E.ORGANIZATIONS, body),

  approveOrganization: (organizationId: string): Promise<ApiResponse<unknown>> => apiClient.post(E.APPROVE(organizationId)),

  /** Soft-deletes the pending organization and its users. */
  rejectOrganization: (organizationId: string): Promise<ApiResponse<unknown>> => apiClient.post(E.REJECT(organizationId)),

  listUsers: (organizationId: string): Promise<ApiResponse<PlatformUser[]>> => apiClient.get(E.USERS(organizationId)),

  /** Short-lived token of that user (no refresh); the caller swaps sessions with ../impersonation. */
  impersonate: (userId: string): Promise<ApiResponse<ImpersonationResponse>> => apiClient.post(E.IMPERSONATE, { userId }),

  /** Called with the impersonation token itself; logs the end of the session. */
  stopImpersonation: (): Promise<ApiResponse<void>> => apiClient.post(E.IMPERSONATE_STOP),

  listImpersonations: (): Promise<ApiResponse<ImpersonationLogEntry[]>> => apiClient.get(E.IMPERSONATIONS),

  getDemoAccess: (): Promise<ApiResponse<DemoAccess>> => apiClient.get(E.DEMO),

  /** Either way the API closes the sessions of the demo users; it never returns the password. */
  setDemoAccess: (change: DemoAccessChange): Promise<ApiResponse<unknown>> => apiClient.put(E.DEMO, change),

  getPlan: (organizationId: string): Promise<ApiResponse<OrganizationPlan>> => apiClient.get(E.PLAN(organizationId)),

  /** Replaces the disabled modules and both caps; answers the plan as the GET does. */
  setPlan: (organizationId: string, change: OrganizationPlanChange): Promise<ApiResponse<OrganizationPlan>> =>
    apiClient.put(E.PLAN(organizationId), change),

  getProviders: (organizationId: string): Promise<ApiResponse<OrganizationProviders>> => apiClient.get(providersUrl(organizationId)),

  /** Replaces the storage and email profiles; answers as the GET does. */
  setProviders: (organizationId: string, change: OrganizationProvidersChange): Promise<ApiResponse<OrganizationProviders>> =>
    apiClient.put(providersUrl(organizationId), change),
};
