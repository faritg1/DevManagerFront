import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, ArcoRequestDto, CreateArcoRequest } from "../types";

export const habeasDataService = {
  async createArco(data: CreateArcoRequest): Promise<ApiResponse<ArcoRequestDto>> {
    return apiClient.post<ArcoRequestDto>(API_ENDPOINTS.HABEAS_DATA.ARCO, data);
  },

  async attendArco(id: string, response: string): Promise<ApiResponse<ArcoRequestDto>> {
    return apiClient.post<ArcoRequestDto>(API_ENDPOINTS.HABEAS_DATA.ARCO_ATENDER(id), { response });
  },

  async rejectArco(id: string, response: string): Promise<ApiResponse<ArcoRequestDto>> {
    return apiClient.post<ArcoRequestDto>(API_ENDPOINTS.HABEAS_DATA.ARCO_RECHAZAR(id), { response });
  },

  async getArcoByUser(userId: string): Promise<ApiResponse<ArcoRequestDto[]>> {
    return apiClient.get<ArcoRequestDto[]>(API_ENDPOINTS.HABEAS_DATA.ARCO_BY_USER(userId));
  },

  async getPendingArco(): Promise<ApiResponse<ArcoRequestDto[]>> {
    return apiClient.get<ArcoRequestDto[]>(API_ENDPOINTS.HABEAS_DATA.ARCO_PENDIENTES);
  },
};

