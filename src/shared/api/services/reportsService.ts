/**
 * Reports Service
 * Maneja endpoints de reportes y análisis
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AiSummaryResponse,
  SkillDistributionResponse,
  ProjectMetricsResponse,
  EmployeeUtilizationResponse,
  DepartmentMetricsResponse,
  ApiResponse,
} from "../types";

export const reportsService = {
  /**
   * Obtiene un resumen ejecutivo automático generado por IA
   * GET /api/reports/ai-summary
   *
   * Integra con Google Gemini para procesar datos de la organización
   * y devolver un resumen ejecutivo para presentarse en reportes.
   *
   * @example
   * const response = await reportsService.getAiSummary();
   * // Response contiene markdown con análisis automático
   *
   * @returns Resumen ejecutivo en formato markdown
   */
  async getAiSummary(): Promise<ApiResponse<AiSummaryResponse>> {
    return apiClient.get<AiSummaryResponse>(API_ENDPOINTS.REPORTS.AI_SUMMARY);
  },

  /** GET /api/reports/skills-distribution */
  async getSkillsDistribution(): Promise<ApiResponse<SkillDistributionResponse[]>> {
    return apiClient.get<SkillDistributionResponse[]>(
      API_ENDPOINTS.REPORTS.SKILLS_DISTRIBUTION,
    );
  },

  /** GET /api/reports/project-metrics */
  async getProjectMetrics(): Promise<ApiResponse<ProjectMetricsResponse>> {
    return apiClient.get<ProjectMetricsResponse>(
      API_ENDPOINTS.REPORTS.PROJECT_METRICS,
    );
  },

  /** GET /api/reports/employee-utilization */
  async getEmployeeUtilization(): Promise<ApiResponse<EmployeeUtilizationResponse>> {
    return apiClient.get<EmployeeUtilizationResponse>(
      API_ENDPOINTS.REPORTS.EMPLOYEE_UTILIZATION,
    );
  },

  /** GET /api/reports/department-metrics */
  async getDepartmentMetrics(): Promise<ApiResponse<DepartmentMetricsResponse>> {
    return apiClient.get<DepartmentMetricsResponse>(
      API_ENDPOINTS.REPORTS.DEPARTMENT_METRICS,
    );
  },
};

export default reportsService;
