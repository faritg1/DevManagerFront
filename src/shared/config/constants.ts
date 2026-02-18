/**
 * Application-wide constants
 */

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
    
    // Marketplace
    MARKETPLACE: '/marketplace',
    
    // Reports
    REPORTS: '/reports',
    
    // Administration
    ORGANIZATIONS: '/organizations',
    USERS: '/users',
    ROLES: '/roles',
    PERMISSIONS: '/permissions',
    
    // Agents (AI Agents)
    AGENTS: '/agents',
    AGENT_DETAIL: '/agents/:id',
    CREATE_AGENT: '/agents/create',
    
    // User
    PROFILE: '/profile',
    SETTINGS: '/settings',
} as const;

// Navigation sections for sidebar
export const NAV_SECTIONS = {
    PLATFORM: 'Plataforma',
    AGENTS: 'Agentes IA',
    ADMIN: 'Administración',
} as const;

// Project statuses
export const PROJECT_STATUS = {
    NEW: 'New',
    IN_PROGRESS: 'In Progress',
    BLOCKED: 'Blocked',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
} as const;

// Agent statuses
export const AGENT_STATUS = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    TRAINING: 'Training',
    ERROR: 'Error',
    MAINTENANCE: 'Maintenance',
} as const;

// User roles
export const USER_ROLES = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin Sistema',
    PROJECT_MANAGER: 'Project Manager',
    DEVELOPER: 'Developer',
    VIEWER: 'Viewer',
} as const;

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Date formats
export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
    API: 'yyyy-MM-dd',
    API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    LANGUAGE: 'language',
} as const;

/** @deprecated Use ProjectStatus enum from @shared/api/types instead */
export type ProjectStatusLabel = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];
/** @deprecated Use AgentStatus from @shared/types instead */
export type AgentStatusLabel = typeof AGENT_STATUS[keyof typeof AGENT_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
