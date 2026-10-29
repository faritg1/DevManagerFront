import { ROUTES, STORAGE_KEYS } from "../config/constants";
import { endImpersonation, reloadAt } from "./impersonation";
import type { ApiResponse } from "./types";

export interface ApiError {
  status: number;
  message: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

const TIMEOUT_MS = 30000;

export const API_URL: string = import.meta.env.VITE_API_URL || "https://devmanagerapi.runasp.net/api";

/** JSON headers plus the bearer token of the signed-in user. */
export const buildHeaders = (): Headers => {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

/** Reads a non-2xx response into an ApiError. A 401 signs out; other errors (but 404) raise the global toast unless `notify` is false. */
export const readApiError = async (response: Response, notify = true): Promise<ApiError> => {
  const error: ApiError = {
    status: response.status,
    message: response.statusText,
  };

  try {
    const errorBody = await response.json();
    error.message = errorBody.message || error.message;
    error.errors = errorBody.errors;
    error.errorCode = errorBody.errorCode;
    error.traceId = errorBody.traceId;
  } catch {
    // Response body is not JSON
  }

  if (response.status === 401 && endImpersonation()) {
    // The short-lived impersonation token expired: back to the super admin's own session, never a refresh
    reloadAt(`#${ROUTES.SUPER_ADMIN}`);
  } else if (response.status === 401) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    // Event instead of window.location: a redirect loops under HashRouter.
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  } else if (notify && response.status !== 404) {
    window.dispatchEvent(new CustomEvent("DevManagerApiError", { detail: error }));
  }

  return error;
};

class ApiClient {
  constructor(private baseUrl: string) {}

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      throw await readApiError(response);
    }

    if (response.status === 204) {
      return {
        success: true,
        message: null,
        data: null as T,
        timestamp: new Date().toISOString(),
      };
    }

    return (await response.json()) as ApiResponse<T>;
  }

  private async request<T>(method: string, url: string, body?: unknown): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    return this.handleResponse<T>(response);
  }

  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return this.request<T>("GET", url.toString());
  }

  post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", `${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", `${this.baseUrl}${endpoint}`, body);
  }

  patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", `${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", `${this.baseUrl}${endpoint}`);
  }
}

export const apiClient = new ApiClient(API_URL);

// Agent endpoints live outside the /api prefix.
export const agentClient = new ApiClient(
  import.meta.env.VITE_AGENT_URL || "https://devmanagerapi.runasp.net",
);
