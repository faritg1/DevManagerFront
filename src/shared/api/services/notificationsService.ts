import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, UserNotification } from "../types";

export const notificationsService = {
  list(take = 20, unreadOnly = false): Promise<ApiResponse<UserNotification[]>> {
    return apiClient.get<UserNotification[]>(API_ENDPOINTS.NOTIFICATIONS.BASE, { take, unreadOnly });
  },

  unreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },

  /** 204: the client maps the empty body to `data: null`. */
  markRead(id: string): Promise<ApiResponse<null>> {
    return apiClient.put<null>(API_ENDPOINTS.NOTIFICATIONS.READ(id));
  },

  markAllRead(): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.put<{ updated: number }>(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },

  remove(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  },
};
