import { API_URL, apiClient, buildHeaders, readApiError, type ApiError } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AiCapabilities,
  AiChatRequest,
  AiConversation,
  AiOrganizationQuota,
  AiStoredMessage,
  AiStreamEvent,
  AiUsageSummary,
  ApiResponse,
} from "../types";

const E = API_ENDPOINTS.AI;

const PRE_STREAM_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "Has hecho muchas consultas, intenta en un minuto.",
  AI_BUDGET_EXCEEDED: "Se agotó el cupo diario del asistente para tu organización. Intenta de nuevo mañana.",
  AI_MONTHLY_QUOTA_EXCEEDED: "Se agotó la cuota mensual de IA de tu organización. Se renueva el día 1 del próximo mes o cuando el operador de la plataforma la amplíe.",
};

/** Parses one SSE frame ("event: x\ndata: {...}"). Multi-line data is joined with "\n"; comments and unknown frames return null. */
export const parseSseFrame = (frame: string): AiStreamEvent | null => {
  let type = "message";
  const data: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith(":")) continue;
    const sep = line.indexOf(":");
    const field = sep < 0 ? line : line.slice(0, sep);
    const value = sep < 0 ? "" : line.slice(sep + 1).replace(/^ /, "");
    if (field === "event") type = value;
    else if (field === "data") data.push(value);
  }
  if (data.length === 0) return null;
  try {
    return { type, data: JSON.parse(data.join("\n")) } as AiStreamEvent;
  } catch {
    return null;
  }
};

export const aiService = {
  /**
   * POST /ai/chat as a server-sent event stream (EventSource cannot POST or send the bearer token).
   * Pre-stream failures (400/404/429) throw an ApiError whose message is ready to show.
   */
  async streamChat(req: AiChatRequest, onEvent: (e: AiStreamEvent) => void, signal?: AbortSignal): Promise<void> {
    const headers = buildHeaders();
    headers.set("Accept", "text/event-stream");
    const response = await fetch(`${API_URL}${E.CHAT}`, {
      method: "POST",
      headers,
      body: JSON.stringify(req),
      signal,
    });

    if (!response.ok || !response.body) {
      const error: ApiError = await readApiError(response, false);
      error.message = PRE_STREAM_MESSAGES[error.errorCode ?? ""] ?? error.message;
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      // Normalized on the whole buffer so a "\r\n" split across two chunks still collapses.
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, "\n");
      // A frame ends at a blank line; the last piece may be a partial frame still arriving.
      const frames = buffer.split("\n\n");
      buffer = done ? "" : frames.pop()!;
      for (const frame of frames) {
        const event = parseSseFrame(frame);
        if (event) onEvent(event);
      }
      if (done) return;
    }
  },

  getCapabilities: (): Promise<ApiResponse<AiCapabilities>> => apiClient.get(E.CAPABILITIES),

  listConversations: (): Promise<ApiResponse<AiConversation[]>> => apiClient.get(E.CONVERSATIONS),

  getMessages: (id: string): Promise<ApiResponse<AiStoredMessage[]>> => apiClient.get(E.MESSAGES(id)),

  deleteConversation: (id: string): Promise<ApiResponse<void>> => apiClient.delete(E.CONVERSATION(id)),

  getUsage: (): Promise<ApiResponse<AiUsageSummary>> => apiClient.get(E.USAGE),

  listQuotas: (): Promise<ApiResponse<AiOrganizationQuota[]>> => apiClient.get(E.QUOTAS),

  setQuota: (organizationId: string, monthlyTokenQuota: number | null): Promise<ApiResponse<void>> =>
    apiClient.put(E.QUOTA(organizationId), { monthlyTokenQuota }),
};
