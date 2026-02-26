/**
 * API Module
 * Exporta cliente, endpoints, tipos y servicios
 * Basado en: API_GUIDE.md
 */

// Core client
export { apiClient, type ApiConfig, type ApiError } from "./client";

// Endpoints
export { API_ENDPOINTS, type ApiEndpoints } from "./endpoints";

// Types (use types from types.ts as the canonical source)
export * from "./types";

// Services
export {
  authService,
  usersService,
  profileService,
  certificationService,
  skillsService,
  projectsService,
  applicationsService,
  assignmentsService,
  agentService,
  configService,
  rbacService,
} from "./services";