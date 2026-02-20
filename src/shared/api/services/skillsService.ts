/**
 * Skills Service
 * Maneja el catálogo de habilidades y skills de empleados
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  SkillDto,
  CreateSkillRequest,
  EmployeeSkillResponse,
  UpsertEmployeeSkillRequest,
  ValidateSkillRequest,
  ApiResponse,
} from "../types";

export const skillsService = {
  // ============ CATÁLOGO DE SKILLS ============

  /**
   * Obtiene el catálogo de habilidades (globales + organizacionales)
   * GET /api/skills
   */
  async getAll(): Promise<ApiResponse<SkillDto[]>> {
    return apiClient.get<SkillDto[]>(API_ENDPOINTS.SKILLS.BASE);
  },

  /**
   * Crea una nueva habilidad organizacional
   * POST /api/skills
   * Requiere rol Admin o Manager
   */
  async create(data: CreateSkillRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.SKILLS.BASE, data);
  },

  // ============ SKILLS DE EMPLEADOS ============

  /**
   * Obtiene todas las habilidades de un empleado específico
   * GET /api/employees/{id}/skills
   */
  async getEmployeeSkills(
    employeeId: string,
  ): Promise<ApiResponse<EmployeeSkillResponse[]>> {
    return apiClient.get<EmployeeSkillResponse[]>(
      API_ENDPOINTS.EMPLOYEE_SKILLS.BY_EMPLOYEE(employeeId),
    );
  },

  /**
   * Crea o actualiza una habilidad del usuario autenticado (auto-declaración, upsert)
   * POST /api/employees/skills
   */
  async upsertEmployeeSkill(
    data: UpsertEmployeeSkillRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.EMPLOYEE_SKILLS.UPSERT, data);
  },

  // TODO: backend should support deleting employee skill
  async deleteEmployeeSkill(
    skillId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/employees/skills/${skillId}`);
  },

  /**
   * Valida una habilidad de un empleado
   * PUT /api/employees/skills/{id}/validate
   * Requiere rol Manager o Admin
   *
   * @param skillId - ID del skill del empleado a validar
   * @param data - newLevel: null para solo validar, número para ajustar nivel
   */
  async validateSkill(
    skillId: string,
    data: ValidateSkillRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(
      API_ENDPOINTS.EMPLOYEE_SKILLS.VALIDATE(skillId),
      data,
    );
  },

};

export default skillsService;