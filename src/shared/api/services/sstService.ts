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
  scheduleExam: (userId: string, examType: ExamType, scheduledDate: string): Promise<ApiResponse<MedicalExamDto>> =>
    apiClient.post(E.EXAMENES, { userId, examType, scheduledDate }),

  recordExam: (id: string, result: ExamResult, notes?: string, fileUrl?: string): Promise<ApiResponse<MedicalExamDto>> =>
    apiClient.post(E.EXAMEN_REGISTRAR(id), { result, ...(notes ? { notes } : {}), ...(fileUrl ? { fileUrl } : {}) }),

  getExamsByUser: (userId: string): Promise<ApiResponse<MedicalExamDto[]>> => apiClient.get(E.EXAMENES_BY_USER(userId)),

  getPendingExams: (): Promise<ApiResponse<MedicalExamDto[]>> => apiClient.get(E.EXAMENES_PENDIENTES),

  reportAccident: (data: ReportAccidentRequest): Promise<ApiResponse<WorkAccidentDto>> => apiClient.post(E.ACCIDENTES, data),

  getAccidents: (): Promise<ApiResponse<WorkAccidentDto[]>> => apiClient.get(E.ACCIDENTES),

  getAccidentsPendingInvestigation: (): Promise<ApiResponse<WorkAccidentDto[]>> =>
    apiClient.get(E.ACCIDENTES_PENDIENTES_INVESTIGACION),

  investigateAccident: (id: string, data: InvestigateAccidentRequest): Promise<ApiResponse<WorkAccidentDto>> =>
    apiClient.post(E.ACCIDENTE_INVESTIGAR(id), data),

  getRisks: (): Promise<ApiResponse<RiskDto[]>> => apiClient.get(E.RIESGOS),

  createRisk: (data: CreateRiskRequest): Promise<ApiResponse<RiskDto>> => apiClient.post(E.RIESGOS, data),
};

