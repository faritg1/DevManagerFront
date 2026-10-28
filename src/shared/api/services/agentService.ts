// Agent endpoints live at /Agent/*, outside the /api prefix.
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
  async query(
    data: AgentQueryRequest,
  ): Promise<ApiResponse<AgentQueryResponse>> {
    return agentClient.post<AgentQueryResponse>(API_ENDPOINTS.AGENT.QUERY, data);
  },

  async validateSkill(
    data: ValidateSkillAIRequest,
  ): Promise<ApiResponse<ValidateSkillAIResponse>> {
    return agentClient.post<ValidateSkillAIResponse>(
      API_ENDPOINTS.AGENT.VALIDATE_SKILL,
      data,
    );
  },

  async matchCandidates(
    data: MatchCandidatesRequest,
  ): Promise<ApiResponse<MatchCandidatesResponse>> {
    return agentClient.post<MatchCandidatesResponse>(
      API_ENDPOINTS.AGENT.MATCH_CANDIDATES,
      data,
    );
  },

  async approveAction(actionId: string): Promise<ApiResponse<void>> {
    return agentClient.post<void>(API_ENDPOINTS.AGENT.APPROVE(actionId));
  },

  async rejectAction(
    actionId: string,
    data: RejectActionRequest,
  ): Promise<ApiResponse<void>> {
    return agentClient.post<void>(API_ENDPOINTS.AGENT.REJECT(actionId), data);
  },
};

