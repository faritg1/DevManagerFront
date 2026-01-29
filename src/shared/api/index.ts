/**
 * API Module
 * Exporta cliente, endpoints, tipos y servicios
 * Basado en: API_GUIDE.md
 */

// Core
export {
  apiClient,
  type ApiResponse,
  type ApiError,
  type ApiConfig,
} from "./client";
export { API_ENDPOINTS, type ApiEndpoints } from "./endpoints";

// Types
export * from "./types";

// Services
export {
  authService,
  usersService,
  profileService,
  skillsService,
  projectsService,
  applicationsService,
  assignmentsService,
  agentService,
} from "./services";