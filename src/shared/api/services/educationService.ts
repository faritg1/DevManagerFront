import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  EducationProgramDto,
  SaveProgramRequest,
  EnrollmentDto,
  EnrollRequest,
  UpdateEnrollmentRequest,
  ApiResponse,
} from "../types";

export const educationService = {
  getPrograms(): Promise<ApiResponse<EducationProgramDto[]>> {
    return apiClient.get<EducationProgramDto[]>(API_ENDPOINTS.EDUCATION.PROGRAMS);
  },
  getProgram(id: string): Promise<ApiResponse<EducationProgramDto>> {
    return apiClient.get<EducationProgramDto>(API_ENDPOINTS.EDUCATION.PROGRAM(id));
  },
  createProgram(data: SaveProgramRequest): Promise<ApiResponse<EducationProgramDto>> {
    return apiClient.post<EducationProgramDto>(API_ENDPOINTS.EDUCATION.PROGRAMS, data);
  },
  updateProgram(id: string, data: SaveProgramRequest): Promise<ApiResponse<EducationProgramDto>> {
    return apiClient.put<EducationProgramDto>(API_ENDPOINTS.EDUCATION.PROGRAM(id), data);
  },
  deleteProgram(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.EDUCATION.PROGRAM(id));
  },
  getEnrollments(programId: string): Promise<ApiResponse<EnrollmentDto[]>> {
    return apiClient.get<EnrollmentDto[]>(API_ENDPOINTS.EDUCATION.ENROLLMENTS(programId));
  },
  enroll(programId: string, data: EnrollRequest): Promise<ApiResponse<EnrollmentDto>> {
    return apiClient.post<EnrollmentDto>(API_ENDPOINTS.EDUCATION.ENROLLMENTS(programId), data);
  },
  updateEnrollment(id: string, data: UpdateEnrollmentRequest): Promise<ApiResponse<EnrollmentDto>> {
    return apiClient.put<EnrollmentDto>(API_ENDPOINTS.EDUCATION.ENROLLMENT(id), data);
  },
};

