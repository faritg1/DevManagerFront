import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { ApiResponse, AllConfigCatalogsDto } from '../types';

export const configService = {
  getAll: async (): Promise<ApiResponse<AllConfigCatalogsDto>> => {
    return apiClient.get<AllConfigCatalogsDto>(API_ENDPOINTS.CONFIG.BASE);
  },

  getProjectStatuses: async () => {
    return apiClient.get(API_ENDPOINTS.CONFIG.PROJECT_STATUSES);
  },
};