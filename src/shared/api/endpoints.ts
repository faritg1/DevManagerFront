/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for the .NET backend
 */

export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
    },

    // Users
    USERS: {
        BASE: '/users',
        BY_ID: (id: string) => `/users/${id}`,
        ROLES: (id: string) => `/users/${id}/roles`,
    },

    // Organizations
    ORGANIZATIONS: {
        BASE: '/organizations',
        BY_ID: (id: string) => `/organizations/${id}`,
        MEMBERS: (id: string) => `/organizations/${id}/members`,
    },

    // Projects
    PROJECTS: {
        BASE: '/projects',
        BY_ID: (id: string) => `/projects/${id}`,
        TEAM: (id: string) => `/projects/${id}/team`,
        STATUS: (id: string) => `/projects/${id}/status`,
    },

    // Agents (AI Agents management)
    AGENTS: {
        BASE: '/agents',
        BY_ID: (id: string) => `/agents/${id}`,
        EXECUTE: (id: string) => `/agents/${id}/execute`,
        LOGS: (id: string) => `/agents/${id}/logs`,
        METRICS: (id: string) => `/agents/${id}/metrics`,
    },

    // Reports
    REPORTS: {
        DASHBOARD: '/reports/dashboard',
        UTILIZATION: '/reports/utilization',
        SKILLS: '/reports/skills',
        EXPORT: '/reports/export',
    },

    // Roles & Permissions
    ROLES: {
        BASE: '/roles',
        BY_ID: (id: string) => `/roles/${id}`,
        PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    },

    // AI Copilot
    COPILOT: {
        CHAT: '/copilot/chat',
        ANALYZE: '/copilot/analyze',
        SUGGEST: '/copilot/suggest',
    },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
