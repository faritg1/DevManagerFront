/**
 * Assignments Service
 * Maneja las asignaciones de usuarios a proyectos
 * Basado en: API_GUIDE.md
 *
 * Diferencia con Applications (Postulaciones):
 * - Application: Postulación voluntaria del empleado (bottom-up)
 * - Assignment: Asignación administrativa por manager (top-down)
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentResponse,
  ApiResponse,
} from "../types";

export const assignmentsService = {
  /**
   * Lista asignaciones con filtros opcionales
   * GET /api/assignments?projectId={guid}&userId={guid}
   */
  async getAll(filters?: {
    projectId?: string;
    userId?: string;
  }): Promise<ApiResponse<AssignmentResponse[]>> {
    return apiClient.get<AssignmentResponse[]>(
      API_ENDPOINTS.ASSIGNMENTS.BASE,
      filters,
    );
  },

  /**
   * Asigna un usuario a un proyecto
   * POST /api/assignments
   * Requiere rol Manager o Admin
   */
  async create(data: CreateAssignmentRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.ASSIGNMENTS.BASE, data);
  },

  /**
   * Actualiza una asignación
   * PUT /api/assignments/{id}
   */
  async update(
    id: string,
    data: UpdateAssignmentRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(API_ENDPOINTS.ASSIGNMENTS.BY_ID(id), data);
  },

  /**
   * Elimina una asignación
   * DELETE /api/assignments/{id}
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.ASSIGNMENTS.BY_ID(id));
  },
};

export default assignmentsService;
