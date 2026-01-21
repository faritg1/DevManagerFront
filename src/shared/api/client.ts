/**
 * API Client Configuration
 * Handles all HTTP requests to the backend (.NET API)
 */

export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    headers: Record<string, string>;
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
}

const defaultConfig: ApiConfig = {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
};

class ApiClient {
    private config: ApiConfig;

    constructor(config: Partial<ApiConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    private getAuthToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    private buildHeaders(): Headers {
        const headers = new Headers(this.config.headers);
        const token = this.getAuthToken();
        
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        if (!response.ok) {
            const error: ApiError = {
                status: response.status,
                message: response.statusText,
            };

            try {
                const errorBody = await response.json();
                error.message = errorBody.message || error.message;
                error.errors = errorBody.errors;
            } catch {
                // Response body is not JSON
            }

            throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return { data: null as T, status: response.status };
        }

        const data = await response.json();
        return { data, status: response.status };
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(`${this.config.baseUrl}${endpoint}`);
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.buildHeaders(),
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.buildHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: this.buildHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.buildHeaders(),
        });

        return this.handleResponse<T>(response);
    }
}

// Singleton instance
export const apiClient = new ApiClient();

export default ApiClient;
