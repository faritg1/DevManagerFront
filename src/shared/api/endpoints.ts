/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for the DevManager .NET Backend
 * Basado en: API_GUIDE.md
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER_ORGANIZATION: "/auth/register-organization",
  },

  // Users
  USERS: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
  },

  // Profile (Current User)
  PROFILE: {
    ME: "/profile/me",
  },

  // Skills (Catalog)
  SKILLS: {
    BASE: "/skills",
  },

  // Employee Skills
  EMPLOYEE_SKILLS: {
    BY_EMPLOYEE: (id: string) => `/employees/${id}/skills`,
    UPSERT: "/employees/skills",
    VALIDATE: (id: string) => `/employees/skills/${id}/validate`,
  },

  // Projects
  PROJECTS: {
    BASE: "/projects",
    BY_ID: (id: string) => `/projects/${id}`,
    REQUIREMENTS: (id: string) => `/projects/${id}/reqs`,
    APPLICATIONS: (id: string) => `/projects/${id}/applications`,
    APPLY: (id: string) => `/projects/${id}/apply`,
  },

  // Applications (Postulaciones)
  APPLICATIONS: {
    REVIEW: (id: string) => `/applications/${id}/review`,
  },

  // Assignments
  ASSIGNMENTS: {
    BASE: "/assignments",
  },

  // Agent IA (sin /api prefix - usa agentClient)
  AGENT: {
    QUERY: "/Agent/query",
    VALIDATE_SKILL: "/Agent/validate-skill",
    MATCH_CANDIDATES: "/Agent/match-candidates",
    APPROVE: (actionId: string) => `/Agent/approve/${actionId}`,
    REJECT: (actionId: string) => `/Agent/reject/${actionId}`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;