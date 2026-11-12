import { API_URL, apiClient, buildHeaders, readApiError } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  ApiResponse, ClassificationNode, CreateClassificationNodeRequest, CreateDocumentRequest, DocumentDetail, DocumentFilter, DocumentListItem,
  DocumentRead, DocumentVersion, DocumentaryType, PendingRead, UpdateClassificationNodeRequest, UpdateDocumentRequest,
  CreateDossierRequest, DossierDetail, DossierFilter, DossierItem, DossierListItem, UpdateDossierItemRequest, UpdateDossierRequest,
} from "../types";

const {
  BASE, BY_ID, PENDING_READS, READS, DISTRIBUTION, VERSIONS, VERSION,
  CLASSIFICATION, CLASSIFICATION_NODES, CLASSIFICATION_NODE, CLASSIFICATION_TYPES,
  DOSSIERS, DOSSIER, DOSSIER_ITEMS, DOSSIER_ITEM,
} = API_ENDPOINTS.DOCUMENTS;

const versionForm = (changeSummary: string, file?: File | null): FormData => {
  const form = new FormData();
  form.append("changeSummary", changeSummary);
  if (file) form.append("file", file);
  return form;
};

/** The token travels in the header, so the file comes as a blob. Throws the ApiError on failure. */
const fetchFile = async (endpoint: string): Promise<Blob> => {
  const response = await fetch(`${API_URL}${endpoint}/file`, { headers: buildHeaders() });
  if (!response.ok) throw await readApiError(response);
  return response.blob();
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

  download: (id: string, versionId: string): Promise<Blob> => fetchFile(VERSION(id, versionId)),

  distribute: (id: string, userIds: string[], roleIds: string[]): Promise<ApiResponse<{ newRecipients: number }>> =>
    apiClient.post<{ newRecipients: number }>(DISTRIBUTION(id), { userIds, roleIds }),

  reads: (id: string): Promise<ApiResponse<DocumentRead[]>> => apiClient.get<DocumentRead[]>(READS(id)),

  pendingReads: (): Promise<ApiResponse<PendingRead[]>> => apiClient.get<PendingRead[]>(PENDING_READS),

  confirmRead: (id: string, versionId: string): Promise<ApiResponse<{ confirmedAt: string }>> =>
    apiClient.post<{ confirmedAt: string }>(`${VERSION(id, versionId)}/read-confirmation`),

  /** Sections with their series and subseries, inactive ones included. */
  classification: (): Promise<ApiResponse<ClassificationNode[]>> => apiClient.get<ClassificationNode[]>(CLASSIFICATION),

  createNode: (data: CreateClassificationNodeRequest): Promise<ApiResponse<ClassificationNode>> =>
    apiClient.post<ClassificationNode>(CLASSIFICATION_NODES, data),

  /** Replaces the whole node: a field left out is cleared. */
  updateNode: (id: string, data: UpdateClassificationNodeRequest): Promise<ApiResponse<ClassificationNode>> =>
    apiClient.put<ClassificationNode>(CLASSIFICATION_NODE(id), data),

  addType: (nodeId: string, name: string): Promise<ApiResponse<DocumentaryType>> =>
    apiClient.post<DocumentaryType>(CLASSIFICATION_TYPES(nodeId), { name }),

  removeType: (nodeId: string, typeId: string): Promise<ApiResponse<unknown>> =>
    apiClient.delete<unknown>(`${CLASSIFICATION_TYPES(nodeId)}/${typeId}`),

  dossiers: (filter: DossierFilter): Promise<ApiResponse<DossierListItem[]>> => apiClient.get<DossierListItem[]>(DOSSIERS, { ...filter }),

  dossier: (id: string): Promise<ApiResponse<DossierDetail>> => apiClient.get<DossierDetail>(DOSSIER(id)),

  createDossier: (data: CreateDossierRequest): Promise<ApiResponse<DossierDetail>> => apiClient.post<DossierDetail>(DOSSIERS, data),

  updateDossier: (id: string, data: UpdateDossierRequest): Promise<ApiResponse<DossierDetail>> => apiClient.put<DossierDetail>(DOSSIER(id), data),

  /** Without a body the API closes it today (Colombia). There is no reopening. */
  closeDossier: (id: string): Promise<ApiResponse<DossierDetail>> => apiClient.post<DossierDetail>(`${DOSSIER(id)}/close`),

  /** Appends the document at the next position; the type is optional. */
  addDossierItem: (id: string, data: UpdateDossierItemRequest, file: File): Promise<ApiResponse<DossierItem>> => {
    const form = new FormData();
    form.append("title", data.title);
    form.append("documentDate", data.documentDate);
    if (data.documentaryTypeId) form.append("documentaryTypeId", data.documentaryTypeId);
    form.append("file", file);
    return apiClient.sendForm<DossierItem>("POST", DOSSIER_ITEMS(id), form);
  },

  updateDossierItem: (id: string, itemId: string, data: UpdateDossierItemRequest): Promise<ApiResponse<DossierItem>> =>
    apiClient.put<DossierItem>(DOSSIER_ITEM(id, itemId), data),

  downloadDossierItem: (id: string, itemId: string): Promise<Blob> => fetchFile(DOSSIER_ITEM(id, itemId)),
};
