import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { 
    ReviewApplicationRequest,
    ApiResponse 
} from '../types';

export const applicationsService = {
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

