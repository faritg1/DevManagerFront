/**
 * Órganos Service
 * Órganos de administración y control, miembros, actas, asambleas y votos.
 * Rutas: api/organos — la organización sale del JWT; escrituras solo Admin (salvo votar).
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  AssemblyDto,
  AssignMemberRequest,
  CastVoteRequest,
  ConveneAssemblyRequest,
  CreateGoverningBodyRequest,
  CreateMinutesRequest,
  GoverningBodyDto,
  GoverningBodyMemberDto,
  GoverningBodyType,
  MinutesDto,
  UpdateGoverningBodyRequest,
  UpdateMemberRequest,
  VoteResultsDto,
} from "../types";

const E = API_ENDPOINTS.ORGANOS;

export const organosService = {
  // ===== Órganos =====
  getAll: (): Promise<ApiResponse<GoverningBodyDto[]>> => apiClient.get(E.BASE),
  getByType: (type: GoverningBodyType): Promise<ApiResponse<GoverningBodyDto[]>> => apiClient.get(E.BY_TYPE(type)),
  getById: (id: string): Promise<ApiResponse<GoverningBodyDto>> => apiClient.get(E.BY_ID(id)),
  create: (data: CreateGoverningBodyRequest): Promise<ApiResponse<GoverningBodyDto>> => apiClient.post(E.BASE, data),
  update: (id: string, data: UpdateGoverningBodyRequest): Promise<ApiResponse<GoverningBodyDto>> => apiClient.put(E.BY_ID(id), data),
  remove: (id: string): Promise<ApiResponse<null>> => apiClient.delete(E.BY_ID(id)),

  // ===== Miembros =====
  getMembers: (organoId: string): Promise<ApiResponse<GoverningBodyMemberDto[]>> => apiClient.get(E.MIEMBROS_BY_ORGANO(organoId)),
  assignMember: (data: AssignMemberRequest): Promise<ApiResponse<GoverningBodyMemberDto>> => apiClient.post(E.MIEMBROS, data),
  updateMember: (id: string, data: UpdateMemberRequest): Promise<ApiResponse<GoverningBodyMemberDto>> => apiClient.put(E.MIEMBRO_BY_ID(id), data),
  removeMember: (id: string): Promise<ApiResponse<null>> => apiClient.delete(E.MIEMBRO_BY_ID(id)),

  // ===== Actas =====
  getMinutes: (organoId: string): Promise<ApiResponse<MinutesDto[]>> => apiClient.get(E.ACTAS_BY_ORGANO(organoId)),
  getMinutesById: (id: string): Promise<ApiResponse<MinutesDto>> => apiClient.get(E.ACTA_BY_ID(id)),
  createMinutes: (data: CreateMinutesRequest): Promise<ApiResponse<MinutesDto>> => apiClient.post(E.ACTAS, data),

  // ===== Asambleas =====
  getAssemblies: (): Promise<ApiResponse<AssemblyDto[]>> => apiClient.get(E.ASAMBLEAS),
  getAssembly: (id: string): Promise<ApiResponse<AssemblyDto>> => apiClient.get(E.ASAMBLEA_BY_ID(id)),
  conveneAssembly: (data: ConveneAssemblyRequest): Promise<ApiResponse<AssemblyDto>> => apiClient.post(E.ASAMBLEAS, data),
  registerAttendance: (id: string, attendees: number): Promise<ApiResponse<AssemblyDto>> => apiClient.put(E.ASAMBLEA_ASISTENCIA(id), { attendees }),
  closeAssembly: (id: string, results?: string): Promise<ApiResponse<AssemblyDto>> => apiClient.put(E.ASAMBLEA_CERRAR(id), results ? { results } : {}),

  // ===== Votos =====
  castVote: (data: CastVoteRequest): Promise<ApiResponse<unknown>> => apiClient.post(E.VOTOS, data),
  getResults: (asambleaId: string): Promise<ApiResponse<VoteResultsDto>> => apiClient.get(E.VOTOS_RESULTADOS(asambleaId)),
  hasVoted: (asambleaId: string, userId: string): Promise<ApiResponse<boolean>> => apiClient.get(E.VOTOS_HA_VOTADO(asambleaId, userId)),
};

