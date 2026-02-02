/**
 * Agent IA Service
 * Maneja endpoints de inteligencia artificial usando Google Gemini
 * Basado en: API_GUIDE.md
 * 
 * IMPORTANTE: Usa agentClient (sin /api prefix) porque el backend
 * tiene los endpoints del agente en https://devmanagerapi.runasp.net/Agent/*
 */

import { agentClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AgentQueryRequest,
  AgentQueryResponse,
  ValidateSkillAIRequest,
  ValidateSkillAIResponse,
  MatchCandidatesRequest,
  MatchCandidatesResponse,
  RejectActionRequest,
  ApiResponse,
} from "../types";

export const agentService = {
  /**
   * Consulta en lenguaje natural al agente de IA
   * POST /agent/query
   *
   * @example
   * const response = await agentService.query({
   *   query: "¿Cuántos desarrolladores tenemos con Java nivel 4 o superior?",
   *   requireApproval: false
   * });
   *
   * Ejemplos de consultas:
   * - "¿Cuántos desarrolladores tenemos con Java nivel 4 o superior?"
   * - "Analiza las brechas de capacitación en el equipo de frontend"
   * - "¿Qué skills están más demandadas en los proyectos activos?"
   */
  async query(
    data: AgentQueryRequest,
  ): Promise<ApiResponse<AgentQueryResponse>> {
    return agentClient.post<AgentQueryResponse>(API_ENDPOINTS.AGENT.QUERY, data);
  },

  /**
   * Validación semántica de habilidades usando IA
   * POST /agent/validate-skill
   *
   * Analiza si el nivel declarado de una habilidad es coherente con:
   * - Años de experiencia
   * - Evidencia proporcionada (repositorios, proyectos)
   * - Patrones de código analizados
   */
  async validateSkill(
    data: ValidateSkillAIRequest,
  ): Promise<ApiResponse<ValidateSkillAIResponse>> {
    return agentClient.post<ValidateSkillAIResponse>(
      API_ENDPOINTS.AGENT.VALIDATE_SKILL,
      data,
    );
  },

  /**
   * Matching inteligente de candidatos para un proyecto
   * POST /agent/match-candidates
   *
   * Algoritmo de Matching:
   * - Mandatory Skills: 60% - Debe tener TODAS las skills obligatorias
   * - Optional Skills: 20% - Bonus por skills deseables
   * - Experience: 10% - Años de experiencia
   * - Skill Surplus: 10% - Bonus si nivel supera el requerido
   *
   * @param data.projectId - ID del proyecto
   * @param data.requireApproval - Si true, requiere aprobación HITL
   * @param data.minScore - Score mínimo para incluir candidato (default 70)
   */
  async matchCandidates(
    data: MatchCandidatesRequest,
  ): Promise<ApiResponse<MatchCandidatesResponse>> {
    return agentClient.post<MatchCandidatesResponse>(
      API_ENDPOINTS.AGENT.MATCH_CANDIDATES,
      data,
    );
  },

  /**
   * Aprueba una acción del agente (flujo HITL - Human In The Loop)
   * POST /Agent/approve/{actionId}
   */
  async approveAction(actionId: string): Promise<ApiResponse<void>> {
    return agentClient.post<void>(API_ENDPOINTS.AGENT.APPROVE(actionId));
  },

  /**
   * Rechaza una acción del agente con motivo
   * POST /Agent/reject/{actionId}
   */
  async rejectAction(
    actionId: string,
    data: RejectActionRequest,
  ): Promise<ApiResponse<void>> {
    return agentClient.post<void>(API_ENDPOINTS.AGENT.REJECT(actionId), data);
  },
};

export default agentService;