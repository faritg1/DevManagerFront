/**
 * SST Service
 * Salud Ocupacional y Seguridad en el Trabajo (SG-SST Decreto 1072/2015)
 * Exámenes médicos, ARL, accidentes (FURAT) y matriz de riesgos
 * Rutas: api/sst
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AccidenteDto,
  ApiResponse,
  ArlVigenciaResponse,
  CreateAccidenteDto,
  CreateExamenMedicoDto,
  CreateRiesgoDto,
  ExamenMedicoDto,
  RiesgoDto,
} from "../types";

const withQuery = (
  endpoint: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string => {
  const search = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return search ? `${endpoint}?${search}` : endpoint;
};

export const sstService = {
  // ===== Exámenes médicos =====

  /**
   * Programa un examen médico ocupacional
   * POST /api/sst/examenes
   */
  async programarExamen(
    data: CreateExamenMedicoDto,
  ): Promise<ApiResponse<ExamenMedicoDto>> {
    return apiClient.post<ExamenMedicoDto>(
      API_ENDPOINTS.SST.EXAMENES_CREATE,
      data,
    );
  },

  /**
   * Registra el resultado de un examen realizado (query params)
   * POST /api/sst/examenes/{examenId}/registrar?resultado=&archivoUrl=&observaciones=
   */
  async registrarExamen(
    examenId: string,
    resultado: string,
    archivoUrl?: string | null,
    observaciones?: string | null,
  ): Promise<ApiResponse<ExamenMedicoDto>> {
    const endpoint = withQuery(
      API_ENDPOINTS.SST.EXAMEN_REGISTRAR(examenId),
      { resultado, archivoUrl, observaciones },
    );
    return apiClient.post<ExamenMedicoDto>(endpoint);
  },

  /**
   * Obtiene los exámenes de un asociado
   * GET /api/sst/examenes/asociado/{asociadoId}
   */
  async getExamenesByAsociado(
    asociadoId: string,
  ): Promise<ApiResponse<ExamenMedicoDto[]>> {
    return apiClient.get<ExamenMedicoDto[]>(
      API_ENDPOINTS.SST.EXAMENES_BY_ASOCIADO(asociadoId),
    );
  },

  /**
   * Obtiene exámenes pendientes de una organización
   * GET /api/sst/examenes/pendientes/{organizationId}
   */
  async getExamenesPendientes(
    organizationId: string,
  ): Promise<ApiResponse<ExamenMedicoDto[]>> {
    return apiClient.get<ExamenMedicoDto[]>(
      API_ENDPOINTS.SST.EXAMENES_PENDIENTES(organizationId),
    );
  },

  // ===== ARL =====

  /**
   * Verifica la vigencia de la ARL (alerta 30 días antes de expiry)
   * GET /api/sst/arl/vigencia/{organizationId}
   */
  async verificarVigenciaArl(
    organizationId: string,
  ): Promise<ApiResponse<ArlVigenciaResponse>> {
    return apiClient.get<ArlVigenciaResponse>(
      API_ENDPOINTS.SST.ARL_VIGENCIA(organizationId),
    );
  },

  // ===== Accidentes =====

  /**
   * Reporta un accidente de trabajo (FURAT)
   * POST /api/sst/accidentes
   */
  async reportarAccidente(
    data: CreateAccidenteDto,
  ): Promise<ApiResponse<AccidenteDto>> {
    return apiClient.post<AccidenteDto>(
      API_ENDPOINTS.SST.ACCIDENTES_CREATE,
      data,
    );
  },

  /**
   * Obtiene accidentes pendientes de investigación
   * GET /api/sst/accidentes/pendientes-investigacion/{organizationId}
   */
  async getAccidentesPendientesInvestigacion(
    organizationId: string,
  ): Promise<ApiResponse<AccidenteDto[]>> {
    return apiClient.get<AccidenteDto[]>(
      API_ENDPOINTS.SST.ACCIDENTES_PENDIENTES_INVESTIGACION(organizationId),
    );
  },

  /**
   * Registra la investigación de un accidente (query params)
   * POST /api/sst/accidentes/{accidenteId}/investigar?fechaInvestigacion=&conclusiones=&causas=&medidasCorrectivas=
   */
  async registrarInvestigacion(
    accidenteId: string,
    fechaInvestigacion: string,
    conclusiones: string,
    causas: string,
    medidasCorrectivas: string,
  ): Promise<ApiResponse<AccidenteDto>> {
    const endpoint = withQuery(
      API_ENDPOINTS.SST.ACCIDENTE_INVESTIGAR(accidenteId),
      { fechaInvestigacion, conclusiones, causas, medidasCorrectivas },
    );
    return apiClient.post<AccidenteDto>(endpoint);
  },

  /**
   * Obtiene todos los accidentes de una organización
   * GET /api/sst/accidentes/{organizationId}
   */
  async getAccidentesByOrganizacion(
    organizationId: string,
  ): Promise<ApiResponse<AccidenteDto[]>> {
    return apiClient.get<AccidenteDto[]>(
      API_ENDPOINTS.SST.ACCIDENTES_BY_ORGANIZACION(organizationId),
    );
  },

  // ===== Riesgos =====

  /**
   * Obtiene la matriz de riesgos de una organización
   * GET /api/sst/riesgos/{organizationId}
   */
  async getRiesgos(
    organizationId: string,
  ): Promise<ApiResponse<RiesgoDto[]>> {
    return apiClient.get<RiesgoDto[]>(
      API_ENDPOINTS.SST.RIESGOS(organizationId),
    );
  },

  /**
   * Agrega un riesgo a la matriz
   * POST /api/sst/riesgos
   */
  async crearRiesgo(data: CreateRiesgoDto): Promise<ApiResponse<RiesgoDto>> {
    return apiClient.post<RiesgoDto>(API_ENDPOINTS.SST.RIESGOS_CREATE, data);
  },
};

export default sstService;
