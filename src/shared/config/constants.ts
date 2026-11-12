export const ROUTES = {
    LOGIN: '/',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/recuperar-contrasena',
    RESET_PASSWORD: '/restablecer-contrasena',
    
    DASHBOARD: '/dashboard',
    
    PROJECTS: '/projects',
    PROJECT_DETAIL: '/projects/:id',
    CREATE_PROJECT: '/create-project',
    EDIT_PROJECT: '/projects/:id/edit',

    REPORTS: '/reports',
    AI_USAGE: '/ai-usage',
    
    ORGANIZATIONS: '/organizations',
    USERS: '/users',
    USER_DETAIL: '/users/:id',
    ROLES: '/roles',
    PERMISSIONS: '/permissions',
    ASSOCIATES: '/associates',
    ASSOCIATE_DETAIL: '/associates/:userId',
    DATA_POLICIES: '/data-policies',
    EDUCATION: '/education',
    EDUCATION_PROGRAM: '/education/:programId',
    
    AGENTS: '/agents',
    
    SKILLS_CATALOG: '/skills',
    
    PROFILE: '/profile',
    SETTINGS: '/settings',

    NOMINA: '/nomina',
    BIENESTAR: '/bienestar',
    BALANCE_SOCIAL: '/balance-social',
    SST: '/sst',
    EXCEDENTES: '/excedentes',
    HABEAS_DATA: '/habeas-data',
    ORGANOS: '/organos',
    COMPETENCIAS: '/competencias',
    REPORTES_SUPERSOLIDARIA: '/reportes-supersolidaria',
    ASISTENTE: '/asistente',
    SUPER_ADMIN: '/superadmin',
    AUDIT: '/audit',
    DOCUMENTS: '/documentos',
    DOCUMENT_DETAIL: '/documentos/:id',
    // Flat routes: the menu matches an entry by the prefix 'route/', so these must not hang from /documentos.
    DOCUMENTS_HOME: '/gestion-documental',
    DOCUMENT_READS: '/documentos-lecturas',
    DOCUMENT_APPROVALS: '/documentos-por-aprobar',
    DOCUMENT_CLASSIFICATION: '/cuadro-clasificacion',
    DOSSIERS: '/expedientes',
    DOSSIER_DETAIL: '/expedientes/:id',
    ACTIVITIES: '/activities',
    ACTIVITIES_PROJECT: '/activities/:projectId',
    MY_ACTIVITIES: '/my-activities',
    TIME_REPORT: '/activities/time-report',
} as const;

export const NAV_SECTIONS = {
    PLATFORM: 'Plataforma',
    AGENTS: 'Agentes IA',
    ADMIN: 'Administración',
    SOLIDARIO: 'Gestión Solidaria',
    DOCUMENTS: 'Gestión documental',
    SUPER_ADMIN: 'Superadministración',
} as const;

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    SIDEBAR_SECTIONS: 'sidebar_collapsed_sections',
    LANGUAGE: 'language',
    /** While impersonating: the super admin's own session, restored on exit or when the short-lived token expires */
    IMPERSONATOR_TOKEN: 'impersonator_token',
    IMPERSONATOR_USER: 'impersonator_user',
    IMPERSONATION: 'impersonation',
} as const;

export const associateDetailPath = (userId: string): string => `/associates/${userId}`;
export const documentDetailPath = (id: string): string => `/documentos/${id}`;
export const dossierDetailPath = (id: string): string => `/expedientes/${id}`;
export const educationProgramPath = (programId: string): string => `/education/${programId}`;
