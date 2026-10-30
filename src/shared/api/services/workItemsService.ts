import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CreateWorkItemRequest,
  MoveWorkItemRequest,
  WorkItemCommentResponse,
  WorkItemHistoryEntry,
  UpdateWorkItemRequest,
  WorkItemResponse,
} from "../types";

const { BY_PROJECT, BY_ID, MOVE, COMMENTS, COMMENT, HISTORY } = API_ENDPOINTS.WORK_ITEMS;

/** Actividades de un proyecto: solo las ven sus miembros y los administradores. */
export const workItemsService = {
  list: (projectId: string): Promise<ApiResponse<WorkItemResponse[]>> =>
    apiClient.get<WorkItemResponse[]>(BY_PROJECT(projectId)),

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
};
