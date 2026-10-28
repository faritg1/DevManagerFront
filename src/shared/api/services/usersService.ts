import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
} from "../types";

/** The API returns firstName/lastName/phone; the UI reads fullName/phoneNumber. */
type RawUser = UserResponse & { firstName?: string; lastName?: string; phone?: string | null };
const normalizeUser = (u: RawUser): UserResponse => ({
  ...u,
  fullName: u.fullName ?? [u.firstName, u.lastName].filter(Boolean).join(" "),
  phoneNumber: u.phoneNumber ?? u.phone ?? null,
});

export const usersService = {
  async getAll(): Promise<ApiResponse<UserResponse[]>> {
    const res = await apiClient.get<RawUser[]>(API_ENDPOINTS.USERS.BASE);
    return { ...res, data: res.data?.map(normalizeUser) };
  },

  async getById(id: string): Promise<ApiResponse<UserResponse>> {
    const res = await apiClient.get<RawUser>(API_ENDPOINTS.USERS.BY_ID(id));
    return { ...res, data: res.data && normalizeUser(res.data) };
  },

  async create(data: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.post<UserResponse>(API_ENDPOINTS.USERS.BASE, data);
  },

  async update(
    id: string,
    data: UpdateUserRequest,
  ): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(API_ENDPOINTS.USERS.BY_ID(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USERS.BY_ID(id));
  },
};

