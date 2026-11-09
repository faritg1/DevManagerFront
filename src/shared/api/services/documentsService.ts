import { API_URL, apiClient, buildHeaders, readApiError } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse, CreateDocumentRequest, DocumentDetail, DocumentFilter, DocumentListItem, DocumentRead, DocumentVersion,
  PendingRead, UpdateDocumentRequest,
} from "../types";

const { BASE, BY_ID, PENDING_READS, READS, DISTRIBUTION, VERSIONS, VERSION } = API_ENDPOINTS.DOCUMENTS;

const versionForm = (changeSummary: string, file?: File | null): FormData => {
  const form = new FormData();
  form.append("changeSummary", changeSummary);
  if (file) form.append("file", file);
  return form;
};

export const documentsService = {
  list: (filter: DocumentFilter): Promise<ApiResponse<DocumentListItem[]>> => apiClient.get<DocumentListItem[]>(BASE, { ...filter }),

  get: (id: string): Promise<ApiResponse<DocumentDetail>> => apiClient.get<DocumentDetail>(BY_ID(id)),

  create: (data: CreateDocumentRequest): Promise<ApiResponse<DocumentDetail>> => apiClient.post<DocumentDetail>(BASE, data),

  update: (id: string, data: UpdateDocumentRequest): Promise<ApiResponse<DocumentDetail>> => apiClient.put<DocumentDetail>(BY_ID(id), data),

  addVersion: (id: string, changeSummary: string, file: File): Promise<ApiResponse<DocumentVersion>> =>
    apiClient.sendForm<DocumentVersion>("POST", VERSIONS(id), versionForm(changeSummary, file)),

  /** Without `file` the draft keeps the one it has. */
  updateVersion: (id: string, versionId: string, changeSummary: string, file?: File | null): Promise<ApiResponse<DocumentVersion>> =>
    apiClient.sendForm<DocumentVersion>("PUT", VERSION(id, versionId), versionForm(changeSummary, file)),

  submit: (id: string, versionId: string): Promise<ApiResponse<DocumentVersion>> =>
    apiClient.post<DocumentVersion>(`${VERSION(id, versionId)}/submit`),

  approve: (id: string, versionId: string): Promise<ApiResponse<DocumentVersion>> =>
    apiClient.post<DocumentVersion>(`${VERSION(id, versionId)}/approve`),

  reject: (id: string, versionId: string, comment: string): Promise<ApiResponse<DocumentVersion>> =>
    apiClient.post<DocumentVersion>(`${VERSION(id, versionId)}/reject`, { comment }),

  /** The token travels in the header, so the file comes as a blob. Throws the ApiError on failure. */
  async download(id: string, versionId: string): Promise<Blob> {
    const response = await fetch(`${API_URL}${VERSION(id, versionId)}/file`, { headers: buildHeaders() });
    if (!response.ok) throw await readApiError(response);
    return response.blob();
  },

  distribute: (id: string, userIds: string[], roleIds: string[]): Promise<ApiResponse<{ newRecipients: number }>> =>
    apiClient.post<{ newRecipients: number }>(DISTRIBUTION(id), { userIds, roleIds }),

  reads: (id: string): Promise<ApiResponse<DocumentRead[]>> => apiClient.get<DocumentRead[]>(READS(id)),

  pendingReads: (): Promise<ApiResponse<PendingRead[]>> => apiClient.get<PendingRead[]>(PENDING_READS),

  confirmRead: (id: string, versionId: string): Promise<ApiResponse<{ confirmedAt: string }>> =>
    apiClient.post<{ confirmedAt: string }>(`${VERSION(id, versionId)}/read-confirmation`),
};
