import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, AllConfigCatalogsDto } from '../types';

export const configService = {
  /**
   * Carga todos los catálogos activos del sistema
   */
  getAll: async (): Promise<ApiResponse<AllConfigCatalogsDto>> => {
    return apiClient.get<AllConfigCatalogsDto>(API_ENDPOINTS.CONFIG.BASE);
  },

  /**
   * Métodos individuales por si se requieren refrescar catálogos específicos
   * (Opcional, usage example)
   */
  getProjectStatuses: async () => {
    return apiClient.get(API_ENDPOINTS.CONFIG.PROJECT_STATUSES);
  },
};