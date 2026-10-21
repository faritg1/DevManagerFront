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
    DOCUMENT: (id: string) => `/users/${id}/document`,
    CONSENTS: (id: string) => `/users/${id}/consents`,
  },

  // Associates (Solidarity)
  ASSOCIATES: {
    BASE: "/associates",
    BY_ID: (userId: string) => `/associates/${userId}`,
    TRANSITIONS: (userId: string) => `/associates/${userId}/transitions`,
  },

  // Cooperative education
  EDUCATION: {
    PROGRAMS: "/education/programs",
    PROGRAM: (id: string) => `/education/programs/${id}`,
    ENROLLMENTS: (programId: string) => `/education/programs/${programId}/enrollments`,
    ENROLLMENT: (id: string) => `/education/enrollments/${id}`,
  },

  // Habeas Data
  DATA_POLICIES: {
    BASE: "/data-policies",
    CURRENT: "/data-policies/current",
  },
  CONSENTS: {
    REVOKE: (id: string) => `/consents/${id}/revoke`,
  },

  // Profile (Current User)
  PROFILE: {
    ME: "/profile/me",
  },

  // Certifications
  CERTIFICATIONS: {
    ME: "/certifications/me",
    BY_ID: (id: string) => `/certifications/me/${id}`,
  },

  // Skills (Catalog)
  SKILLS: {
    BASE: "/skills",
    BY_ID: (id: string) => `/skills/${id}`,
  },

  // Employee Skills
  EMPLOYEE_SKILLS: {
    BY_EMPLOYEE: (id: string) => `/employees/${id}/skills`,
    UPSERT: "/employees/skills",
    VALIDATE: (id: string) => `/employees/skills/${id}/validate`,
    BY_ID: (id: string) => `/employees/skills/${id}`,
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
    BY_ID: (id: string) => `/assignments/${id}`,
  },

  // Agent IA (sin /api prefix - usa agentClient)
  AGENT: {
    QUERY: "/Agent/query",
    VALIDATE_SKILL: "/Agent/validate-skill",
    MATCH_CANDIDATES: "/Agent/match-candidates",
    APPROVE: (actionId: string) => `/Agent/approve/${actionId}`,
    REJECT: (actionId: string) => `/Agent/reject/${actionId}`,
  },

  // Roles & Permissions (RBAC)
  ROLES: {
    BASE: "/roles",
    BY_ID: (id: string) => `/roles/${id}`,
    PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    PERMISSION_REVOKE: (roleId: string, permissionId: string) =>
      `/roles/${roleId}/permissions/${permissionId}`,
    ASSIGN_TO_USER: "/roles/assign-to-user",
    REVOKE_FROM_USER: "/roles/revoke-from-user",
  },

  PERMISSIONS: {
    BASE: "/permissions",
    BY_ID: (id: string) => `/permissions/${id}`,
    GROUPED: "/permissions/grouped",
    ASSIGN_TO_USER: "/permissions/assign-to-user",
    USER_EFFECTIVE: (userId: string) => `/permissions/user/${userId}/effective`,
    VALIDATE: "/permissions/validate",
  },

  // Reports
  REPORTS: {
    AI_SUMMARY: "/reports/ai-summary",
    SKILLS_DISTRIBUTION: "/reports/skills-distribution",
    PROJECT_METRICS: "/reports/project-metrics",
    EMPLOYEE_UTILIZATION: "/reports/employee-utilization",
    DEPARTMENT_METRICS: "/reports/department-metrics",
    EDUCATION_COVERAGE: "/reports/education-coverage",
  },

  // Configuration (Catalogs)
  CONFIG: {
    BASE: "/Config",
    PROJECT_STATUSES: "/Config/project-statuses",
    COMPLEXITY_LEVELS: "/Config/complexity-levels",
    APPLICATION_STATUSES: "/Config/application-statuses",
    ASSIGNMENT_STATUSES: "/Config/assignment-statuses",
    SKILL_LEVELS: "/Config/skill-levels",
    CONTRIBUTION_SCORES: "/Config/contribution-scores",
    EVALUATION_SOURCES: "/Config/evaluation-sources",
    SKILL_TYPES: "/Config/skill-types",
    SKILL_CATEGORIES: "/Config/skill-categories",
    AGENT_ACTION_TYPES: "/Config/agent-action-types",
    AGENT_ACTION_STATUSES: "/Config/agent-action-statuses",
    SENIORITY_LEVELS: "/Config/seniority-levels",
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
