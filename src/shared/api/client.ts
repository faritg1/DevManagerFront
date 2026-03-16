/**
 * API Client Configuration
 * Handles all HTTP requests to the DevManager Backend (.NET API)
 * Base URL: https://devmanagerapi.runasp.net/api
 */

import { STORAGE_KEYS } from "../config/constants";

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

export interface ApiError {
  status: number;
  message: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

// Tipo para interceptors
type RequestInterceptor = (config: RequestInit) => RequestInit;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<never>;

const defaultConfig: ApiConfig = {
  baseUrl:
    import.meta.env.VITE_API_URL || "https://devmanagerapi.runasp.net/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

class ApiClient {
  private config: ApiConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Agrega un interceptor de request
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Agrega un interceptor de response
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Agrega un interceptor de error
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Obtiene el token de autenticación
   */
  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Construye los headers para la petición
   */
  private buildHeaders(): Headers {
    const headers = new Headers(this.config.headers);
    const token = this.getAuthToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Aplica los interceptors de request
   */
  private applyRequestInterceptors(config: RequestInit): RequestInit {
    return this.requestInterceptors.reduce(
      (cfg, interceptor) => interceptor(cfg),
      config,
    );
  }

  /**
   * Aplica los interceptors de response
   */
  private async applyResponseInterceptors(
    response: Response,
  ): Promise<Response> {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Aplica los interceptors de error
   */
  private async applyErrorInterceptors(error: ApiError): Promise<never> {
    let result = error;
    for (const interceptor of this.errorInterceptors) {
      const interceptorResult = await interceptor(result);
      if (interceptorResult) {
        result = interceptorResult;
      }
    }
    throw result;
  }

  /**
   * Maneja la respuesta del servidor
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Aplicar interceptors de response
    const interceptedResponse = await this.applyResponseInterceptors(response);

    if (!interceptedResponse.ok) {
      const error: ApiError = {
        status: interceptedResponse.status,
        message: interceptedResponse.statusText,
      };

      try {
        const errorBody = await interceptedResponse.json();
        error.message = errorBody.message || error.message;
        error.errors = errorBody.errors;
        error.errorCode = errorBody.errorCode;
        error.traceId = errorBody.traceId;
      } catch {
        // Response body is not JSON
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (interceptedResponse.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        // Disparar evento global para que AuthContext resetee el estado de React
        // sin usar window.location (que causaría bucles con HashRouter)
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      // Dispatch global api error event except for 401 and 404
      if (
        typeof window !== "undefined" &&
        error.status !== 401 &&
        error.status !== 404
      ) {
        const event = new CustomEvent("DevManagerApiError", { detail: error });
        window.dispatchEvent(event);
      }

      return this.applyErrorInterceptors(error);
    }

    // Handle 204 No Content
    if (interceptedResponse.status === 204) {
      return {
        success: true,
        message: null,
        data: null as T,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await interceptedResponse.json();
    return data as ApiResponse<T>;
  }

  /**
   * Realiza una petición HTTP con timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    let requestConfig: RequestInit = {
      method: "GET",
      headers: this.buildHeaders(),
    };

    requestConfig = this.applyRequestInterceptors(requestConfig);

    const response = await this.fetchWithTimeout(url.toString(), requestConfig);
    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    let requestConfig: RequestInit = {
      method: "POST",
      headers: this.buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    };

    requestConfig = this.applyRequestInterceptors(requestConfig);

    const response = await this.fetchWithTimeout(
      `${this.config.baseUrl}${endpoint}`,
      requestConfig,
    );

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    let requestConfig: RequestInit = {
      method: "PUT",
      headers: this.buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    };

    requestConfig = this.applyRequestInterceptors(requestConfig);

    const response = await this.fetchWithTimeout(
      `${this.config.baseUrl}${endpoint}`,
      requestConfig,
    );

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    let requestConfig: RequestInit = {
      method: "PATCH",
      headers: this.buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    };

    requestConfig = this.applyRequestInterceptors(requestConfig);

    const response = await this.fetchWithTimeout(
      `${this.config.baseUrl}${endpoint}`,
      requestConfig,
    );

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    let requestConfig: RequestInit = {
      method: "DELETE",
      headers: this.buildHeaders(),
    };

    requestConfig = this.applyRequestInterceptors(requestConfig);

    const response = await this.fetchWithTimeout(
      `${this.config.baseUrl}${endpoint}`,
      requestConfig,
    );

    return this.handleResponse<T>(response);
  }
}

// Singleton instance para endpoints /api
export const apiClient = new ApiClient();

// Cliente separado para Agent (sin /api prefix)
export const agentClient = new ApiClient({
  baseUrl: import.meta.env.VITE_AGENT_URL || "https://devmanagerapi.runasp.net",
});

// Agregar interceptor de logging en desarrollo
if (import.meta.env.MODE === "development") {
  apiClient.addRequestInterceptor((config) => {
    console.log("[API Request]", config);
    return config;
  });

  apiClient.addErrorInterceptor((error) => {
    console.error("[API Error]", error);
    return error;
  });

  agentClient.addRequestInterceptor((config) => {
    console.log("[Agent Request]", config);
    return config;
  });

  agentClient.addErrorInterceptor((error) => {
    console.error("[Agent Error]", error);
    return error;
  });
}

export default ApiClient;
