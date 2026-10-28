/**
 * Nómina Service
 * Compensación de asociados (CTA) y aportes PILA.
 * Rutas: api/nomina/compensacion, api/nomina/pila (Admin) — la organización sale del JWT.
 */

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
  /** GET /api/nomina/compensacion/{userId}/{anio} (propio o Admin) */
  getCompensations: (userId: string, year: number): Promise<ApiResponse<CompensationDto[]>> =>
    apiClient.get(E.COMPENSACION_BY_USER(userId, year)),

  /** POST /api/nomina/compensacion (Admin) */
  createCompensation: (data: CreateCompensationRequest): Promise<ApiResponse<CompensationDto>> =>
    apiClient.post(E.COMPENSACION, data),

  /** GET /api/nomina/pila/{anio}/{mes} (Admin) */
  getPilaSheet: (year: number, month: number): Promise<ApiResponse<PilaContributionDto[]>> =>
    apiClient.get(E.PILA_PLANILLA(year, month)),

  /** POST /api/nomina/pila/calcular (Admin) — 422 MINIMUM_WAGE_NOT_CONFIGURED sin SMMLV del año */
  calculatePila: (data: CalculatePilaRequest): Promise<ApiResponse<PilaContributionDto>> =>
    apiClient.post(E.PILA_CALCULAR, data),
};

export default nominaService;
