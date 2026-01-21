/**
 * Application Type Definitions
 * Centralized types for the entire application
 */

// Re-export types from context
export type { User, AuthState } from './context/AuthContext';
export type { Notification, NotificationType } from './context/NotificationContext';

// Base entity interface
export interface BaseEntity {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

// Project types
export interface Project extends BaseEntity {
    name: string;
    description?: string;
    client: string;
    status: ProjectStatus;
    progress: number;
    initials: string;
    color: string;
    startDate?: string;
    endDate?: string;
    teamSize?: number;
    organizationId?: string;
}

export type ProjectStatus = 'New' | 'In Progress' | 'Blocked' | 'Completed' | 'On Hold';

// Organization types
export interface Organization extends BaseEntity {
    name: string;
    legalName: string;
    taxId: string;
    status: 'active' | 'inactive' | 'suspended';
    logo?: string;
    color?: string;
}

// Agent types (for AI Agent management)
export interface Agent extends BaseEntity {
    name: string;
    description?: string;
    type: AgentType;
    status: AgentStatus;
    configuration: AgentConfiguration;
    metrics?: AgentMetrics;
    organizationId?: string;
}

export type AgentType = 'assistant' | 'analyzer' | 'automator' | 'monitor' | 'custom';
export type AgentStatus = 'Active' | 'Inactive' | 'Training' | 'Error' | 'Maintenance';

export interface AgentConfiguration {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    schedule?: string;
}

export interface AgentMetrics {
    totalExecutions: number;
    successRate: number;
    averageResponseTime: number;
    lastExecutionAt?: string;
}

// Chat/Copilot types
export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'system';
    text: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

// Opportunity/Marketplace types
export interface Opportunity extends BaseEntity {
    title: string;
    department: string;
    type: 'Remote' | 'Hybrid' | 'On-site';
    image?: string;
    isNew?: boolean;
    isHot?: boolean;
    skills?: string[];
    duration?: string;
    commitment?: string;
}

// Role types
export interface Role extends BaseEntity {
    name: string;
    description?: string;
    permissions: Permission[];
    isSystem?: boolean;
}

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// Report/Analytics types
export interface DashboardMetrics {
    activeProjects: number;
    assignedTalent: number;
    atRiskProjects: number;
    utilizationRate: number;
    openRoles: number;
    budgetUsed: number;
    budgetTotal: number;
}

export interface SkillGap {
    skill: string;
    coverage: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

// Pagination types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

// Form state types
export interface FormState<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
}

// API response types
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
    code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
