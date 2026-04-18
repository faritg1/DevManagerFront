/**
 * Reports Service
 * Maneja endpoints de reportes y análisis
 * Basado en: API_GUIDE.md
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AiSummaryResponse,
  ApiResponse,
} from "../types";

export const reportsService = {
  /**
   * Obtiene un resumen ejecutivo automático generado por IA
   * GET /api/reports/ai-summary
   *
   * Integra con Google Gemini para procesar datos de la organización
   * y devolver un resumen ejecutivo para presentarse en reportes.
   *
   * @example
   * const response = await reportsService.getAiSummary();
   * // Response contiene markdown con análisis automático
   *
   * @returns Resumen ejecutivo en formato markdown
   */
  async getAiSummary(): Promise<ApiResponse<AiSummaryResponse>> {
    return apiClient.get<AiSummaryResponse>(API_ENDPOINTS.REPORTS.AI_SUMMARY);
  },
};

export default reportsService;
