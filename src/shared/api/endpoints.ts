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
    AI_SUMMARY: "/Reports/ai-summary",
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

    // ============ GESTIÓN HUMANA SOLIDARIA ============

    // Nomina
    NOMINA: {
      COMPENSACION_BY_ASOCIADO: (asociadoId: string, anio: number) =>
        `/nomina/compensacion/${asociadoId}/${anio}`,
      COMPENSACION_CREATE: "/nomina/compensacion",
      PILA_PLANILLA: (organizationId: string, anio: number, mes: number) =>
        `/nomina/pila/${organizationId}/${anio}/${mes}`,
      PILA_CALCULAR: "/nomina/pila/calcular",
    },

    // Bienestar
    BIENESTAR: {
      PROGRAMAS: (organizationId: string) =>
        `/bienestar/programas/${organizationId}`,
      PROGRAMAS_CREATE: "/bienestar/programas",
      SOLICITUDES_CREATE: "/bienestar/solicitudes",
      SOLICITUDES_BY_ASOCIADO: (asociadoId: string) =>
        `/bienestar/solicitudes/${asociadoId}`,
      SOLICITUD_APROBAR: (solicitudId: string) =>
        `/bienestar/solicitudes/${solicitudId}/aprobar`,
      SOLICITUD_RECHAZAR: (solicitudId: string) =>
        `/bienestar/solicitudes/${solicitudId}/rechazar`,
      FONDO_CALCULAR: "/bienestar/fondo/calcular",
      FONDO_ACTUAL: (organizationId: string) =>
        `/bienestar/fondo/${organizationId}`,
      AUXILIOS_BY_ASOCIADO: (asociadoId: string) =>
        `/bienestar/auxilios/${asociadoId}`,
    },

    // Gestion Humana — Competencias
    GESTION_HUMANA: {
      COMPETENCIAS_BY_ASOCIADO: (asociadoId: string) =>
        `/gestion-humana/competencias/${asociadoId}`,
      COMPETENCIAS_CREATE: "/gestion-humana/competencias",
      COMPETENCIA_DISPONIBILIDAD: (competenciaId: string) =>
        `/gestion-humana/competencias/${competenciaId}/disponibilidad`,
    },

    // Gestion Humana — Educación
    EDUCACION: {
      PROGRAMAS: (organizationId: string) =>
        `/gestion-humana/educacion/programas/${organizationId}`,
      PROGRAMAS_CREATE: "/gestion-humana/educacion/programas",
      INSCRIBIR: "/gestion-humana/educacion/inscribir",
      HISTORIAL: (asociadoId: string) =>
        `/gestion-humana/educacion/historial/${asociadoId}`,
      CUMPLIMIENTO: (asociadoId: string, anio: number) =>
        `/gestion-humana/educacion/cumplimiento/${asociadoId}/${anio}`,
    },

    // Balance Social
    BALANCE_SOCIAL: {
      INDICADOR: (asociadoId: string, anio: number) =>
        `/balance-social/indicador/${asociadoId}/${anio}`,
      INDICADOR_CALCULAR: "/balance-social/indicador/calcular",
      ORGANIZACION: (organizationId: string, anio: number) =>
        `/balance-social/organizacion/${organizationId}/${anio}`,
      NO_CUMPLEN: (organizationId: string, anio: number) =>
        `/balance-social/no-cumplen/${organizationId}/${anio}`,
    },

    // SST
    SST: {
      EXAMENES_CREATE: "/sst/examenes",
      EXAMEN_REGISTRAR: (examenId: string) =>
        `/sst/examenes/${examenId}/registrar`,
      EXAMENES_BY_ASOCIADO: (asociadoId: string) =>
        `/sst/examenes/asociado/${asociadoId}`,
      EXAMENES_PENDIENTES: (organizationId: string) =>
        `/sst/examenes/pendientes/${organizationId}`,
      ARL_VIGENCIA: (organizationId: string) =>
        `/sst/arl/vigencia/${organizationId}`,
      ACCIDENTES_CREATE: "/sst/accidentes",
      ACCIDENTES_PENDIENTES_INVESTIGACION: (organizationId: string) =>
        `/sst/accidentes/pendientes-investigacion/${organizationId}`,
      ACCIDENTE_INVESTIGAR: (accidenteId: string) =>
        `/sst/accidentes/${accidenteId}/investigar`,
      ACCIDENTES_BY_ORGANIZACION: (organizationId: string) =>
        `/sst/accidentes/${organizationId}`,
      RIESGOS: (organizationId: string) => `/sst/riesgos/${organizationId}`,
      RIESGOS_CREATE: "/sst/riesgos",
    },

    // Excedentes
    EXCEDENTES: {
      CALCULAR: "/excedentes/calcular",
      BY_PERIODO: (organizationId: string, periodo: string) =>
        `/excedentes/${organizationId}/${periodo}`,
      BY_ORGANIZACION: (organizationId: string) =>
        `/excedentes/${organizationId}`,
      APROBAR: (excedenteId: string) =>
        `/excedentes/${excedenteId}/aprobar`,
    },

    // Habeas Data
    HABEAS_DATA: {
      AUTORIZACIONES_CREATE: "/habeas-data/autorizaciones",
      AUTORIZACION_REVOCAR: (autorizacionId: string) =>
        `/habeas-data/autorizaciones/${autorizacionId}/revocar`,
      AUTORIZACION_VIGENTE: (asociadoId: string) =>
        `/habeas-data/autorizaciones/${asociadoId}/vigente`,
      AUTORIZACION_TIENE_VIGENTE: (asociadoId: string) =>
        `/habeas-data/autorizaciones/${asociadoId}/tiene-vigente`,
      ARCO_CREATE: "/habeas-data/arco",
      ARCO_ATENDER: (solicitudId: string) =>
        `/habeas-data/arco/${solicitudId}/atender`,
      ARCO_RECHAZAR: (solicitudId: string) =>
        `/habeas-data/arco/${solicitudId}/rechazar`,
      ARCO_BY_ASOCIADO: (asociadoId: string) =>
        `/habeas-data/arco/asociado/${asociadoId}`,
      ARCO_PENDIENTES: (organizationId: string) =>
        `/habeas-data/arco/pendientes/${organizationId}`,
    },

    // Órganos (NO usa envelope ApiResponse — retorna DTOs crudos)
    ORGANOS: {
      BASE: "/organos",
      BY_ID: (id: string) => `/organos/${id}`,
      BY_ORGANIZATION: (organizationId: string) =>
        `/organos/organization/${organizationId}`,
      BY_TYPE: (organizationId: string, tipo: string | number) =>
        `/organos/organization/${organizationId}/tipo/${tipo}`,
      UPDATE: (id: string) => `/organos/${id}`,
      DELETE: (id: string) => `/organos/${id}`,
      MIEMBROS_CREATE: "/organos/miembros",
      MIEMBROS_BY_ORGANO: (organoId: string) => `/organos/${organoId}/miembros`,
      MIEMBRO_UPDATE: (id: string) => `/organos/miembros/${id}`,
      MIEMBRO_DELETE: (id: string) => `/organos/miembros/${id}`,
      ACTAS_CREATE: "/organos/actas",
      ACTA_BY_ID: (id: string) => `/organos/actas/${id}`,
      ACTAS_BY_ORGANO: (organoId: string) => `/organos/${organoId}/actas`,
      ASAMBLEAS_CREATE: "/organos/asambleas",
      ASAMBLEA_BY_ID: (id: string) => `/organos/asambleas/${id}`,
      ASAMBLEAS_BY_ORGANIZATION: (organizationId: string) =>
        `/organos/asambleas/organization/${organizationId}`,
      ASAMBLEA_ASISTENCIA: (id: string) => `/organos/asambleas/${id}/asistencia`,
      ASAMBLEA_CERRAR: (id: string) => `/organos/asambleas/${id}/cerrar`,
      VOTOS_CREATE: "/organos/votos",
      VOTOS_RESULTADOS: (asambleaId: string) =>
        `/organos/votos/resultados/${asambleaId}`,
      VOTOS_HA_VOTADO: (asambleaId: string, asociadoId: string) =>
        `/organos/votos/ha-votado/${asambleaId}/${asociadoId}`,
    },

    // Reportes Supersolidaria
    REPORTES_SUPERSOLIDARIA: {
      GENERAR: "/reportes/supersolidaria/generar",
      BY_PERIODO: (organizationId: string, periodo: string) =>
        `/reportes/supersolidaria/${organizationId}/${periodo}`,
      BY_ORGANIZACION: (organizationId: string) =>
        `/reportes/supersolidaria/${organizationId}`,
      ENVIAR: (reporteId: string) =>
        `/reportes/supersolidaria/${reporteId}/enviar`,
    },

    // Asistente Cooperativo
    ASISTENTE: {
      CONSULTAR: "/asistente/consultar",
      GENERAR_REPORTE: "/asistente/generar-reporte",
      VERIFICAR_CUMPLIMIENTO: "/asistente/verificar-cumplimiento",
      RESPONDER: "/asistente/responder",
    },
  } as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
