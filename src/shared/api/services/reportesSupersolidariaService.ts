/**
 * Reportes Supersolidaria Service
 * Reportes integrales para la Superintendencia de la Economía Solidaria
 * Rutas: api/reportes/supersolidaria
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, CreateReporteDto, ReporteSupersolidariaDto } from "../types";

export const reportesSupersolidariaService = {
  /**
   * Genera un reporte integral para Supersolidaria
   * POST /api/reportes/supersolidaria/generar
   */
  async generarReporte(
    data: CreateReporteDto,
  ): Promise<ApiResponse<ReporteSupersolidariaDto>> {
    return apiClient.post<ReporteSupersolidariaDto>(
      API_ENDPOINTS.REPORTES_SUPERSOLIDARIA.GENERAR,
      data,
    );
  },

  /**
   * Obtiene un reporte por período (periodo = 'yyyy-MM-dd')
   * GET /api/reportes/supersolidaria/{organizationId}/{periodo}
   */
  async getReporteByPeriodo(
    organizationId: string,
    periodo: string,
  ): Promise<ApiResponse<ReporteSupersolidariaDto | null>> {
    return apiClient.get<ReporteSupersolidariaDto | null>(
      API_ENDPOINTS.REPORTES_SUPERSOLIDARIA.BY_PERIODO(organizationId, periodo),
    );
  },

  /**
   * Obtiene todos los reportes de una organización
   * GET /api/reportes/supersolidaria/{organizationId}
   */
  async getReportesByOrganizacion(
    organizationId: string,
  ): Promise<ApiResponse<ReporteSupersolidariaDto[]>> {
    return apiClient.get<ReporteSupersolidariaDto[]>(
      API_ENDPOINTS.REPORTES_SUPERSOLIDARIA.BY_ORGANIZACION(organizationId),
    );
  },

  /**
   * Marca un reporte como enviado a Supersolidaria
   * POST /api/reportes/supersolidaria/{reporteId}/enviar
   */
  async marcarEnviado(
    reporteId: string,
  ): Promise<ApiResponse<ReporteSupersolidariaDto>> {
    return apiClient.post<ReporteSupersolidariaDto>(
      API_ENDPOINTS.REPORTES_SUPERSOLIDARIA.ENVIAR(reporteId),
    );
  },
};

export default reportesSupersolidariaService;
