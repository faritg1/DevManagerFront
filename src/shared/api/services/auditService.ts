import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { ApiResponse, ChangeLogFilter, ChangeLogPage } from "../types";

export const auditService = {
  /** Newest first, 20 per page. */
  getChanges: (filter: ChangeLogFilter): Promise<ApiResponse<ChangeLogPage>> =>
    apiClient.get<ChangeLogPage>(API_ENDPOINTS.AUDIT.CHANGES, { ...filter }),
};
