// Agent endpoints live at /Agent/*, outside the /api prefix.
import { agentClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ValidateSkillAIRequest,
  ValidateSkillAIResponse,
  MatchCandidatesRequest,
  MatchCandidatesResponse,
  ApiResponse,
} from "../types";

export const agentService = {
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
};

