/**
 * Shared module - barrel export
 * Centralized exports for all shared utilities, components, and services
 */

// UI Components
export * from './ui';

// Hooks
export * from './hooks';

// API (contains ProjectStatus, ProjectComplexity, etc. enums)
export * from './api';

// Services
export * from './services';

// Context/State
export * from './context';

// Configuration
export * from './config';

// Utilities
export * from './utils';

// Types - only export non-conflicting types
export type {
    BaseEntity,
    Project,
    FrontendProjectStatus,
    Organization,
    Agent,
    AgentType,
    AgentStatus,
    AgentConfiguration,
    AgentMetrics,
    ChatMessage,
    Opportunity,
    Role,
    Permission,
    DashboardMetrics,
    SkillGap,
    PaginatedResponse,
    PaginationParams,
    FormState,
} from './types';
