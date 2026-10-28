export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER_ORGANIZATION: "/auth/register-organization",
  },

  // Organización del usuario (la del token)
  ORGANIZATIONS: {
    ME: "/organizations/me",
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

    // ============ GESTIÓN HUMANA SOLIDARIA ============

    // Nómina — compensación de asociados (CTA) y PILA
    NOMINA: {
      COMPENSACION: "/nomina/compensacion",
      COMPENSACION_BY_USER: (userId: string, anio: number) => `/nomina/compensacion/${userId}/${anio}`,
      PILA_PLANILLA: (anio: number, mes: number) => `/nomina/pila/${anio}/${mes}`,
      PILA_CALCULAR: "/nomina/pila/calcular",
    },

    // Bienestar — programas, solicitudes, auxilios y fondo de solidaridad
    BIENESTAR: {
      PROGRAMAS: "/bienestar/programas",
      SOLICITUDES: "/bienestar/solicitudes",
      SOLICITUDES_PENDIENTES: "/bienestar/solicitudes/pendientes",
      SOLICITUDES_BY_USER: (userId: string) => `/bienestar/solicitudes/${userId}`,
      SOLICITUD_APROBAR: (id: string) => `/bienestar/solicitudes/${id}/aprobar`,
      SOLICITUD_RECHAZAR: (id: string) => `/bienestar/solicitudes/${id}/rechazar`,
      SOLICITUD_ENTREGAR: (id: string) => `/bienestar/solicitudes/${id}/entregar`,
      FONDO: "/bienestar/fondo",
      FONDO_CALCULAR: "/bienestar/fondo/calcular",
      AUXILIOS_BY_USER: (userId: string) => `/bienestar/auxilios/${userId}`,
    },

    // Gestión Humana — Competencias
    GESTION_HUMANA: {
      COMPETENCIAS: "/gestion-humana/competencias",
      COMPETENCIAS_BY_USER: (userId: string) => `/gestion-humana/competencias/${userId}`,
      COMPETENCIAS_BUSCAR: "/gestion-humana/competencias/buscar",
      COMPETENCIA_DISPONIBILIDAD: (id: string) => `/gestion-humana/competencias/${id}/disponibilidad`,
    },

    // Balance Social (derivado de datos reales)
    BALANCE_SOCIAL: {
      INDICADOR: (userId: string, anio: number) => `/balance-social/indicador/${userId}/${anio}`,
      ORGANIZACION: (anio: number) => `/balance-social/organizacion/${anio}`,
      NO_CUMPLEN: (anio: number) => `/balance-social/no-cumplen/${anio}`,
      REPORTE: (anio: number) => `/balance-social/reporte/${anio}`,
    },

    // SST — exámenes médicos, accidentes de trabajo y matriz de riesgos
    SST: {
      EXAMENES: "/sst/examenes",
      EXAMEN_REGISTRAR: (id: string) => `/sst/examenes/${id}/registrar`,
      EXAMENES_BY_USER: (userId: string) => `/sst/examenes/asociado/${userId}`,
      EXAMENES_PENDIENTES: "/sst/examenes/pendientes",
      ACCIDENTES: "/sst/accidentes",
      ACCIDENTES_PENDIENTES_INVESTIGACION: "/sst/accidentes/pendientes-investigacion",
      ACCIDENTE_INVESTIGAR: (id: string) => `/sst/accidentes/${id}/investigar`,
      RIESGOS: "/sst/riesgos",
    },

    // Excedentes
    EXCEDENTES: {
      BASE: "/excedentes",
      BY_PERIODO: (period: string) => `/excedentes/${period}`,
      CALCULAR: "/excedentes/calcular",
      APROBAR: (id: string) => `/excedentes/${id}/aprobar`,
    },

    // Habeas Data — ARCO (consent lives in DATA_POLICIES / USERS.CONSENTS)
    HABEAS_DATA: {
      ARCO: "/habeas-data/arco",
      ARCO_ATENDER: (id: string) => `/habeas-data/arco/${id}/atender`,
      ARCO_RECHAZAR: (id: string) => `/habeas-data/arco/${id}/rechazar`,
      ARCO_BY_USER: (userId: string) => `/habeas-data/arco/asociado/${userId}`,
      ARCO_PENDIENTES: "/habeas-data/arco/pendientes",
    },

    // Órganos de administración y control
    ORGANOS: {
      BASE: "/organos",
      BY_ID: (id: string) => `/organos/${id}`,
      BY_TYPE: (tipo: number) => `/organos/tipo/${tipo}`,
      MIEMBROS: "/organos/miembros",
      MIEMBROS_BY_ORGANO: (organoId: string) => `/organos/${organoId}/miembros`,
      MIEMBRO_BY_ID: (id: string) => `/organos/miembros/${id}`,
      ACTAS: "/organos/actas",
      ACTA_BY_ID: (id: string) => `/organos/actas/${id}`,
      ACTAS_BY_ORGANO: (organoId: string) => `/organos/${organoId}/actas`,
      ASAMBLEAS: "/organos/asambleas",
      ASAMBLEA_BY_ID: (id: string) => `/organos/asambleas/${id}`,
      ASAMBLEA_ASISTENCIA: (id: string) => `/organos/asambleas/${id}/asistencia`,
      ASAMBLEA_CERRAR: (id: string) => `/organos/asambleas/${id}/cerrar`,
      VOTOS: "/organos/votos",
      VOTOS_RESULTADOS: (asambleaId: string) => `/organos/votos/resultados/${asambleaId}`,
      VOTOS_HA_VOTADO: (asambleaId: string, userId: string) =>
        `/organos/votos/ha-votado/${asambleaId}/${userId}`,
    },

    // Reportes Supersolidaria
    REPORTES_SUPERSOLIDARIA: {
      BASE: "/reportes/supersolidaria",
      BY_PERIODO: (period: string) => `/reportes/supersolidaria/${period}`,
      GENERAR: "/reportes/supersolidaria/generar",
      ENVIAR: (id: string) => `/reportes/supersolidaria/${id}/enviar`,
    },

    // Asistente Cooperativo
    ASISTENTE: {
      CONSULTAR: "/asistente/consultar",
      GENERAR_REPORTE: "/asistente/generar-reporte",
      VERIFICAR_CUMPLIMIENTO: "/asistente/verificar-cumplimiento",
      RESPONDER: "/asistente/responder",
    },
  } as const;
