/**
 * Applications Service
 * Maneja las postulaciones a proyectos
 * Basado en: API_GUIDE.md
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { 
    ReviewApplicationRequest,
    ApiResponse 
} from '../types';

export const applicationsService = {
  /**
   * Revisa una postulación (aprobar/rechazar)
   * PUT /api/applications/{id}/review
   * Requiere rol Manager o Admin
   *
   * Estados: 1=Approved, 2=Rejected
   *
   * @example
   * // Aprobar
   * await applicationsService.review(id, { status: 1, reviewNotes: 'Perfil excelente' });
   *
   * // Rechazar
   * await applicationsService.review(id, { status: 2, reviewNotes: 'No cumple requisitos' });
   */
  async review(
    applicationId: string,
    data: ReviewApplicationRequest,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(
      API_ENDPOINTS.APPLICATIONS.REVIEW(applicationId),
      data,
    );
  },
};

export default applicationsService;