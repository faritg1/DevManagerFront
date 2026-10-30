import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  ConfirmProposalResponse,
  ProposalItemEdit,
  ProposalResponse,
  SprintRequest,
  SprintResponse,
  CreateWorkItemRequest,
  MoveWorkItemRequest,
  MyWorkItemResponse,
  WorkItemCommentResponse,
  WorkItemHistoryEntry,
  UpdateWorkItemRequest,
  WorkItemResponse,
  WorkItemSummaryResponse,
} from "../types";

const { SUMMARY, MINE, BY_PROJECT, BY_ID, MOVE, COMMENTS, COMMENT, HISTORY, PROPOSALS, PROPOSAL, PROPOSAL_CONFIRM, PROPOSAL_REJECT,
  SPRINTS, SPRINT, SPRINT_START, SPRINT_CLOSE } = API_ENDPOINTS.WORK_ITEMS;

/** Actividades de un proyecto: solo las ven sus miembros y los administradores. */
export const workItemsService = {
  list: (projectId: string): Promise<ApiResponse<WorkItemResponse[]>> =>
    apiClient.get<WorkItemResponse[]>(BY_PROJECT(projectId)),

  /** Progress = done / (total - cancelled); progressPercent is null when there is nothing to measure. */
  summary: (projectId: string): Promise<ApiResponse<WorkItemSummaryResponse>> =>
    apiClient.get<WorkItemSummaryResponse>(SUMMARY(projectId)),

  /** Open items assigned to the caller across their projects, due date ascending (no date last). */
  mine: (): Promise<ApiResponse<MyWorkItemResponse[]>> => apiClient.get<MyWorkItemResponse[]>(MINE),

  create: (projectId: string, data: CreateWorkItemRequest): Promise<ApiResponse<WorkItemResponse>> =>
    apiClient.post<WorkItemResponse>(BY_PROJECT(projectId), data),

  update: (id: string, data: UpdateWorkItemRequest): Promise<ApiResponse<WorkItemResponse>> =>
    apiClient.put<WorkItemResponse>(BY_ID(id), data),

  remove: (id: string): Promise<ApiResponse<void>> => apiClient.delete<void>(BY_ID(id)),

  /** Sin referencia (afterId/beforeId) la actividad va al final de la columna. */
  move: (id: string, data: MoveWorkItemRequest): Promise<ApiResponse<WorkItemResponse>> =>
    apiClient.post<WorkItemResponse>(MOVE(id), data),

  comments: (id: string): Promise<ApiResponse<WorkItemCommentResponse[]>> =>
    apiClient.get<WorkItemCommentResponse[]>(COMMENTS(id)),

  addComment: (id: string, body: string): Promise<ApiResponse<WorkItemCommentResponse>> =>
    apiClient.post<WorkItemCommentResponse>(COMMENTS(id), { body }),

  editComment: (commentId: string, body: string): Promise<ApiResponse<WorkItemCommentResponse>> =>
    apiClient.put<WorkItemCommentResponse>(COMMENT(commentId), { body }),

  removeComment: (commentId: string): Promise<ApiResponse<void>> => apiClient.delete<void>(COMMENT(commentId)),

  /** Newest first: the item and its comments. */
  history: (id: string): Promise<ApiResponse<WorkItemHistoryEntry[]>> =>
    apiClient.get<WorkItemHistoryEntry[]>(HISTORY(id)),

  /** Consume cuota de IA y puede tardar: espera hasta 2 minutos. */
  propose: (projectId: string, requirement: string): Promise<ApiResponse<ProposalResponse>> =>
    apiClient.post<ProposalResponse>(PROPOSALS(projectId), { requirement }, 120_000),

  /** Pendientes y vigentes, la más nueva primero. */
  proposals: (projectId: string): Promise<ApiResponse<ProposalResponse[]>> =>
    apiClient.get<ProposalResponse[]>(PROPOSALS(projectId)),

  proposal: (actionId: string): Promise<ApiResponse<ProposalResponse>> => apiClient.get<ProposalResponse>(PROPOSAL(actionId)),

  /** Sin `items` crea todas las propuestas tal cual; con `items` solo las listadas (con sus ediciones). */
  confirmProposal: (actionId: string, items?: ProposalItemEdit[]): Promise<ApiResponse<ConfirmProposalResponse>> =>
    apiClient.post<ConfirmProposalResponse>(PROPOSAL_CONFIRM(actionId), items ? { items } : {}),

  rejectProposal: (actionId: string): Promise<ApiResponse<void>> => apiClient.post<void>(PROPOSAL_REJECT(actionId), {}),

  /** Sprints of the project with their progress (readable even when the organization has them off). */
  sprints: (projectId: string): Promise<ApiResponse<SprintResponse[]>> => apiClient.get<SprintResponse[]>(SPRINTS(projectId)),

  createSprint: (projectId: string, data: SprintRequest): Promise<ApiResponse<SprintResponse>> =>
    apiClient.post<SprintResponse>(SPRINTS(projectId), data),

  updateSprint: (id: string, data: SprintRequest): Promise<ApiResponse<SprintResponse>> => apiClient.put<SprintResponse>(SPRINT(id), data),

  removeSprint: (id: string): Promise<ApiResponse<void>> => apiClient.delete<void>(SPRINT(id)),

  /** Planned to active; only one active sprint per project. */
  startSprint: (id: string): Promise<ApiResponse<SprintResponse>> => apiClient.post<SprintResponse>(SPRINT_START(id), {}),

  /** Its open items go back to "no sprint". */
  closeSprint: (id: string): Promise<ApiResponse<SprintResponse>> => apiClient.post<SprintResponse>(SPRINT_CLOSE(id), {}),
};
