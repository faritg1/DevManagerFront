import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CalculatePilaRequest,
  CompensationDto,
  CreateCompensationRequest,
  PilaContributionDto,
} from "../types";

const E = API_ENDPOINTS.NOMINA;

export const nominaService = {
  getCompensations: (userId: string, year: number): Promise<ApiResponse<CompensationDto[]>> =>
    apiClient.get(E.COMPENSACION_BY_USER(userId, year)),

  createCompensation: (data: CreateCompensationRequest): Promise<ApiResponse<CompensationDto>> =>
    apiClient.post(E.COMPENSACION, data),

  getPilaSheet: (year: number, month: number): Promise<ApiResponse<PilaContributionDto[]>> =>
    apiClient.get(E.PILA_PLANILLA(year, month)),

  calculatePila: (data: CalculatePilaRequest): Promise<ApiResponse<PilaContributionDto>> =>
    apiClient.post(E.PILA_CALCULAR, data),
};

