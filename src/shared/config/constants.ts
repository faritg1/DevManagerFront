export const ROUTES = {
    LOGIN: '/',
    REGISTER: '/register',
    
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
} as const;

export const NAV_SECTIONS = {
    PLATFORM: 'Plataforma',
    AGENTS: 'Agentes IA',
    ADMIN: 'Administración',
    SOLIDARIO: 'Gestión Solidaria',
} as const;

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    SIDEBAR_SECTIONS: 'sidebar_collapsed_sections',
    LANGUAGE: 'language',
} as const;

export const associateDetailPath = (userId: string): string => `/associates/${userId}`;
export const educationProgramPath = (programId: string): string => `/education/${programId}`;
