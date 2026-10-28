// Route paths
export const ROUTES = {
    // Public
    LOGIN: '/',
    REGISTER: '/register',
    
    // Dashboard
    DASHBOARD: '/dashboard',
    
    // Projects
    PROJECTS: '/projects',
    PROJECT_DETAIL: '/projects/:id',
    CREATE_PROJECT: '/create-project',
    EDIT_PROJECT: '/projects/:id/edit',

    // Reports
    REPORTS: '/reports',
    
    // Administration
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
    
    // Agents (AI Agents)
    AGENTS: '/agents',
    
    // Skills Catalog
    SKILLS_CATALOG: '/skills',
    
    // User
    PROFILE: '/profile',
    SETTINGS: '/settings',

    // ===== Gestión Humana Solidaria =====
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

// Navigation sections for sidebar
export const NAV_SECTIONS = {
    PLATFORM: 'Plataforma',
    AGENTS: 'Agentes IA',
    ADMIN: 'Administración',
    SOLIDARIO: 'Gestión Solidaria',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    LANGUAGE: 'language',
} as const;

export const associateDetailPath = (userId: string): string => `/associates/${userId}`;
export const educationProgramPath = (programId: string): string => `/education/${programId}`;
