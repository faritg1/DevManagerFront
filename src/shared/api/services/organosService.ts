/**
 * Órganos Service
 * Órganos de administración y control, miembros, actas, asambleas y votos
 * Rutas: api/organos
 *
 * NOTA DE CONTRATO: a diferencia del resto del API, el OrganosController NO envuelve
 * las respuestas en ApiResponse<T> — devuelve los DTOs crudos (Ok(result)). Además
 * NO tiene [Authorize] en el controlador (aunque la mayoría de endpoints filtran
 * por organización). Por eso estos métodos usan rawGet/rawPost que desempaquetan
 * el body tal cual en lugar de leer response.data.
 */

import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ActaDto,
  AsambleaDto,
  AsignarMiembroDto,
  CerrarAsambleaDto,
  ConvocarAsambleaDto,
  CreateActaDto,
  CreateOrganoDto,
  EmitirVotoDto,
  HaVotadoResponse,
  MiembroOrganoDto,
  OrganoDto,
  RegistrarAsistenciaDto,
  ResultadoVotacionDto,
  TipoOrgano,
  UpdateMiembroDto,
  UpdateOrganoDto,
  VotoDto,
} from "../types";

// El backend devuelve el DTO crudo, no la envoltura {success, message, data}.
// apiClient ya hace JSON.parse y lo castea a ApiResponse<T>; aquí lo re-casteamos
// al tipo real de la respuesta.
const rawGet = async <T>(endpoint: string): Promise<T> => {
  const res = await apiClient.get<unknown>(endpoint);
  return res as unknown as T;
};

const rawPost = async <T>(endpoint: string, body?: unknown): Promise<T> => {
  const res = await apiClient.post<unknown>(endpoint, body);
  return res as unknown as T;
};

const rawPut = async <T>(endpoint: string, body?: unknown): Promise<T> => {
  const res = await apiClient.put<unknown>(endpoint, body);
  return res as unknown as T;
};

const rawDelete = async (endpoint: string): Promise<void> => {
  await apiClient.delete<unknown>(endpoint);
};

export const organosService = {
  // ===== Órganos =====

  async createOrgano(data: CreateOrganoDto): Promise<OrganoDto> {
    return rawPost<OrganoDto>(API_ENDPOINTS.ORGANOS.BASE, data);
  },

  async getOrganoById(id: string): Promise<OrganoDto> {
    return rawGet<OrganoDto>(API_ENDPOINTS.ORGANOS.BY_ID(id));
  },

  async getOrganosByOrganization(
    organizationId: string,
  ): Promise<OrganoDto[]> {
    return rawGet<OrganoDto[]>(
      API_ENDPOINTS.ORGANOS.BY_ORGANIZATION(organizationId),
    );
  },

  async getOrganosByType(
    organizationId: string,
    tipo: TipoOrgano | number,
  ): Promise<OrganoDto[]> {
    return rawGet<OrganoDto[]>(
      API_ENDPOINTS.ORGANOS.BY_TYPE(organizationId, tipo),
    );
  },

  async updateOrgano(id: string, data: UpdateOrganoDto): Promise<OrganoDto> {
    return rawPut<OrganoDto>(API_ENDPOINTS.ORGANOS.UPDATE(id), data);
  },

  async deleteOrgano(id: string): Promise<void> {
    return rawDelete(API_ENDPOINTS.ORGANOS.DELETE(id));
  },

  // ===== Miembros =====

  async asignarMiembro(data: AsignarMiembroDto): Promise<MiembroOrganoDto> {
    return rawPost<MiembroOrganoDto>(
      API_ENDPOINTS.ORGANOS.MIEMBROS_CREATE,
      data,
    );
  },

  async getMiembrosByOrgano(organoId: string): Promise<MiembroOrganoDto[]> {
    return rawGet<MiembroOrganoDto[]>(
      API_ENDPOINTS.ORGANOS.MIEMBROS_BY_ORGANO(organoId),
    );
  },

  async updateMiembro(id: string, data: UpdateMiembroDto): Promise<MiembroOrganoDto> {
    return rawPut<MiembroOrganoDto>(API_ENDPOINTS.ORGANOS.MIEMBRO_UPDATE(id), data);
  },

  async removeMiembro(id: string): Promise<void> {
    return rawDelete(API_ENDPOINTS.ORGANOS.MIEMBRO_DELETE(id));
  },

  // ===== Actas =====

  async createActa(data: CreateActaDto): Promise<ActaDto> {
    return rawPost<ActaDto>(API_ENDPOINTS.ORGANOS.ACTAS_CREATE, data);
  },

  async getActaById(id: string): Promise<ActaDto> {
    return rawGet<ActaDto>(API_ENDPOINTS.ORGANOS.ACTA_BY_ID(id));
  },

  async getActasByOrgano(organoId: string): Promise<ActaDto[]> {
    return rawGet<ActaDto[]>(API_ENDPOINTS.ORGANOS.ACTAS_BY_ORGANO(organoId));
  },

  // ===== Asambleas =====

  async convocarAsamblea(data: ConvocarAsambleaDto): Promise<AsambleaDto> {
    return rawPost<AsambleaDto>(API_ENDPOINTS.ORGANOS.ASAMBLEAS_CREATE, data);
  },

  async getAsambleaById(id: string): Promise<AsambleaDto> {
    return rawGet<AsambleaDto>(API_ENDPOINTS.ORGANOS.ASAMBLEA_BY_ID(id));
  },

  async getAsambleasByOrganization(
    organizationId: string,
  ): Promise<AsambleaDto[]> {
    return rawGet<AsambleaDto[]>(
      API_ENDPOINTS.ORGANOS.ASAMBLEAS_BY_ORGANIZATION(organizationId),
    );
  },

  async registrarAsistencia(
    id: string,
    data: RegistrarAsistenciaDto,
  ): Promise<AsambleaDto> {
    return rawPut<AsambleaDto>(
      API_ENDPOINTS.ORGANOS.ASAMBLEA_ASISTENCIA(id),
      data,
    );
  },

  async cerrarAsamblea(id: string, data: CerrarAsambleaDto): Promise<AsambleaDto> {
    return rawPut<AsambleaDto>(API_ENDPOINTS.ORGANOS.ASAMBLEA_CERRAR(id), data);
  },

  // ===== Votos =====

  async emitirVoto(data: EmitirVotoDto): Promise<VotoDto> {
    return rawPost<VotoDto>(API_ENDPOINTS.ORGANOS.VOTOS_CREATE, data);
  },

  async getResultados(asambleaId: string): Promise<ResultadoVotacionDto> {
    return rawGet<ResultadoVotacionDto>(
      API_ENDPOINTS.ORGANOS.VOTOS_RESULTADOS(asambleaId),
    );
  },

  async haVotado(
    asambleaId: string,
    asociadoId: string,
  ): Promise<HaVotadoResponse> {
    return rawGet<HaVotadoResponse>(
      API_ENDPOINTS.ORGANOS.VOTOS_HA_VOTADO(asambleaId, asociadoId),
    );
  },
};

export default organosService;
