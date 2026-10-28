import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AiSummaryResponse,
  SkillDistributionResponse,
  ProjectMetricsResponse,
  EmployeeUtilizationResponse,
  DepartmentMetricsResponse,
  EducationCoverageResponse,
  ApiResponse,
} from "../types";

export const reportsService = {
  async getAiSummary(): Promise<ApiResponse<AiSummaryResponse>> {
    return apiClient.get<AiSummaryResponse>(API_ENDPOINTS.REPORTS.AI_SUMMARY);
  },

  async getSkillsDistribution(): Promise<ApiResponse<SkillDistributionResponse[]>> {
    return apiClient.get<SkillDistributionResponse[]>(
      API_ENDPOINTS.REPORTS.SKILLS_DISTRIBUTION,
    );
  },

  async getProjectMetrics(): Promise<ApiResponse<ProjectMetricsResponse>> {
    return apiClient.get<ProjectMetricsResponse>(
      API_ENDPOINTS.REPORTS.PROJECT_METRICS,
    );
  },

  async getEmployeeUtilization(): Promise<ApiResponse<EmployeeUtilizationResponse>> {
    return apiClient.get<EmployeeUtilizationResponse>(
      API_ENDPOINTS.REPORTS.EMPLOYEE_UTILIZATION,
    );
  },

  async getDepartmentMetrics(): Promise<ApiResponse<DepartmentMetricsResponse>> {
    return apiClient.get<DepartmentMetricsResponse>(
      API_ENDPOINTS.REPORTS.DEPARTMENT_METRICS,
    );
  },

  async getEducationCoverage(year: number): Promise<ApiResponse<EducationCoverageResponse>> {
    return apiClient.get<EducationCoverageResponse>(
      `${API_ENDPOINTS.REPORTS.EDUCATION_COVERAGE}?year=${year}`,
    );
  },
};

