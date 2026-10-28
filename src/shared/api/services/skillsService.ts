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
  async getAll(): Promise<ApiResponse<SkillDto[]>> {
    return apiClient.get<SkillDto[]>(API_ENDPOINTS.SKILLS.BASE);
  },

  async create(data: CreateSkillRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.SKILLS.BASE, data);
  },

  async update(id: string, data: SkillDto): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.SKILLS.BY_ID(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.SKILLS.BY_ID(id));
  },

  async getEmployeeSkills(
    employeeId: string,
  ): Promise<ApiResponse<EmployeeSkillResponse[]>> {
    return apiClient.get<EmployeeSkillResponse[]>(
      API_ENDPOINTS.EMPLOYEE_SKILLS.BY_EMPLOYEE(employeeId),
    );
  },

  async upsertEmployeeSkill(
    data: UpsertEmployeeSkillRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.EMPLOYEE_SKILLS.UPSERT, data);
  },

  async deleteEmployeeSkill(
    skillId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.EMPLOYEE_SKILLS.BY_ID(skillId));
  },

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

