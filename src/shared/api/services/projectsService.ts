/**
 * Projects Service
 * Maneja operaciones de proyectos y sus requisitos
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ProjectResponse,
  CreateProjectRequest,
  SkillRequirementResponse,
  AddSkillRequirementRequest,
  ApplicationResponse,
  ApplyToProjectRequest,
  ProjectStatus,
  ApiResponse,
} from "../types";

export const projectsService = {
  /**
   * Obtiene todos los proyectos con filtro opcional por estado
   * GET /api/projects?status={status}
   *
   * Estados: 0=Draft, 1=Active, 2=OnHold, 3=Completed, 4=Cancelled
   */
  async getAll(
    status?: ProjectStatus,
  ): Promise<ApiResponse<ProjectResponse[]>> {
    const params = status !== undefined ? { status } : undefined;
    return apiClient.get<ProjectResponse[]>(
      API_ENDPOINTS.PROJECTS.BASE,
      params,
    );
  },

  /**
   * Obtiene los detalles de un proyecto específico
   * GET /api/projects/{id}
   */
  async getById(id: string): Promise<ApiResponse<ProjectResponse>> {
    return apiClient.get<ProjectResponse>(API_ENDPOINTS.PROJECTS.BY_ID(id));
  },

  /**
   * Crea un nuevo proyecto
   * POST /api/projects
   * Requiere rol Manager o Admin
   *
   * Complejidad: 0=Low, 1=Medium, 2=High
   */
  async create(data: CreateProjectRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.PROJECTS.BASE, data);
  },

  // ============ REQUISITOS DE SKILLS ============

  /**
   * Obtiene todos los requisitos de habilidades de un proyecto
   * GET /api/projects/{id}/reqs
   */
  async getRequirements(
    projectId: string,
  ): Promise<ApiResponse<SkillRequirementResponse[]>> {
    return apiClient.get<SkillRequirementResponse[]>(
      API_ENDPOINTS.PROJECTS.REQUIREMENTS(projectId),
    );
  },

  /**
   * Agrega un requisito de habilidad al proyecto
   * POST /api/projects/{id}/reqs
   */
  async addRequirement(
    projectId: string,
    data: AddSkillRequirementRequest,
  ): Promise<ApiResponse<string>> {
    return apiClient.post<string>(
      API_ENDPOINTS.PROJECTS.REQUIREMENTS(projectId),
      data,
    );
  },

  // ============ APLICACIONES/POSTULACIONES ============

  /**
   * Obtiene todas las postulaciones de un proyecto
   * GET /api/projects/{id}/applications
   */
  async getApplications(
    projectId: string,
  ): Promise<ApiResponse<ApplicationResponse[]>> {
    return apiClient.get<ApplicationResponse[]>(
      API_ENDPOINTS.PROJECTS.APPLICATIONS(projectId),
    );
  },

  /**
   * Permite a un empleado postularse a un proyecto
   * POST /api/projects/{id}/apply
   */
  async apply(
    projectId: string,
    data?: ApplyToProjectRequest,
  ): Promise<ApiResponse<string>> {
    return apiClient.post<string>(
      API_ENDPOINTS.PROJECTS.APPLY(projectId),
      data,
    );
  },
};

export default projectsService;