import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  SkillRequirementResponse,
  AddSkillRequirementRequest,
  ApplicationResponse,
  ApplyToProjectRequest,
  ProjectStatus,
  ApiResponse,
} from "../types";

export const projectsService = {
  async getAll(
    status?: ProjectStatus,
  ): Promise<ApiResponse<ProjectResponse[]>> {
    const params = status !== undefined ? { status } : undefined;
    return apiClient.get<ProjectResponse[]>(
      API_ENDPOINTS.PROJECTS.BASE,
      params,
    );
  },

  async getById(id: string): Promise<ApiResponse<ProjectResponse>> {
    return apiClient.get<ProjectResponse>(API_ENDPOINTS.PROJECTS.BY_ID(id));
  },

  async create(data: CreateProjectRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.PROJECTS.BASE, data);
  },

  async update(
    id: string,
    data: UpdateProjectRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.PROJECTS.BY_ID(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.PROJECTS.BY_ID(id));
  },

  async getRequirements(
    projectId: string,
  ): Promise<ApiResponse<SkillRequirementResponse[]>> {
    return apiClient.get<SkillRequirementResponse[]>(
      API_ENDPOINTS.PROJECTS.REQUIREMENTS(projectId),
    );
  },

  async addRequirement(
    projectId: string,
    data: AddSkillRequirementRequest,
  ): Promise<ApiResponse<string>> {
    return apiClient.post<string>(
      API_ENDPOINTS.PROJECTS.REQUIREMENTS(projectId),
      data,
    );
  },

  async getApplications(
    projectId: string,
  ): Promise<ApiResponse<ApplicationResponse[]>> {
    return apiClient.get<ApplicationResponse[]>(
      API_ENDPOINTS.PROJECTS.APPLICATIONS(projectId),
    );
  },

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

