/**
 * SST Service — Seguridad y Salud en el Trabajo (Decreto 1072/2015)
 * Exámenes médicos, accidentes de trabajo (FURAT) y matriz de riesgos.
 * Rutas: api/sst — la organización sale del JWT.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CreateRiskRequest,
  ExamResult,
  ExamType,
  InvestigateAccidentRequest,
  MedicalExamDto,
  ReportAccidentRequest,
  RiskDto,
  WorkAccidentDto,
} from "../types";

const E = API_ENDPOINTS.SST;

export const sstService = {
  /** POST /api/sst/examenes (Admin) */
  scheduleExam: (userId: string, examType: ExamType, scheduledDate: string): Promise<ApiResponse<MedicalExamDto>> =>
    apiClient.post(E.EXAMENES, { userId, examType, scheduledDate }),

  /** POST /api/sst/examenes/{id}/registrar (Admin) */
  recordExam: (id: string, result: ExamResult, notes?: string, fileUrl?: string): Promise<ApiResponse<MedicalExamDto>> =>
    apiClient.post(E.EXAMEN_REGISTRAR(id), { result, ...(notes ? { notes } : {}), ...(fileUrl ? { fileUrl } : {}) }),

  /** GET /api/sst/examenes/asociado/{userId} (propio o Admin) */
  getExamsByUser: (userId: string): Promise<ApiResponse<MedicalExamDto[]>> => apiClient.get(E.EXAMENES_BY_USER(userId)),

  /** GET /api/sst/examenes/pendientes (Admin) */
  getPendingExams: (): Promise<ApiResponse<MedicalExamDto[]>> => apiClient.get(E.EXAMENES_PENDIENTES),

  /** POST /api/sst/accidentes (Admin) */
  reportAccident: (data: ReportAccidentRequest): Promise<ApiResponse<WorkAccidentDto>> => apiClient.post(E.ACCIDENTES, data),

  /** GET /api/sst/accidentes (Admin) */
  getAccidents: (): Promise<ApiResponse<WorkAccidentDto[]>> => apiClient.get(E.ACCIDENTES),

  /** GET /api/sst/accidentes/pendientes-investigacion (Admin) */
  getAccidentsPendingInvestigation: (): Promise<ApiResponse<WorkAccidentDto[]>> =>
    apiClient.get(E.ACCIDENTES_PENDIENTES_INVESTIGACION),

  /** POST /api/sst/accidentes/{id}/investigar (Admin) */
  investigateAccident: (id: string, data: InvestigateAccidentRequest): Promise<ApiResponse<WorkAccidentDto>> =>
    apiClient.post(E.ACCIDENTE_INVESTIGAR(id), data),

  /** GET /api/sst/riesgos */
  getRisks: (): Promise<ApiResponse<RiskDto[]>> => apiClient.get(E.RIESGOS),

  /** POST /api/sst/riesgos (Admin) */
  createRisk: (data: CreateRiskRequest): Promise<ApiResponse<RiskDto>> => apiClient.post(E.RIESGOS, data),
};

