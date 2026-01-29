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
import type { CreateAssignmentRequest, ApiResponse } from "../types";

export const assignmentsService = {
  /**
   * Asigna un usuario a un proyecto
   * POST /api/assignments
   * Requiere rol Manager o Admin
   */
  async create(data: CreateAssignmentRequest): Promise<ApiResponse<string>> {
    return apiClient.post<string>(API_ENDPOINTS.ASSIGNMENTS.BASE, data);
  },
};

export default assignmentsService;