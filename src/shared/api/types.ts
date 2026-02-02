/**
 * API Types
 * Tipos para el API DevManager
 * Basado en: API_GUIDE.md
 */

// ============ BASE API RESPONSE ============
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  errors: Record<string, string[]> | null;
  timestamp: string;
  traceId: string | null;
}

// ============ AUTH ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  role: string;
}

export interface RegisterOrganizationRequest {
  organizationName: string;
  legalName?: string | null;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}

export interface RegisterOrganizationResponse {
  organizationId: string;
  organizationName: string;
  adminUserId: string;
  adminEmail: string;
  token: string;
}

// ============ USERS ============
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
  phoneNumber?: string | null;
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string | null;
  roleId?: string;
  isActive?: boolean;
}

// ============ PROFILE ============
export interface ProfileResponse {
  userId: string;
  bio: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateProfileRequest {
  bio?: string | null;
  yearsExperience?: number | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

// ============ SKILLS (CATALOG) ============
export enum SkillType {
  Global = 0,
  Organizational = 1,
}

export interface SkillDto {
  id: string;
  name: string;
  category: string | null;
  skillType: SkillType;
  organizationId: string | null;
}

export interface CreateSkillRequest {
  name: string;
  category?: string | null;
  skillType: SkillType;
}

// ============ EMPLOYEE SKILLS ============
/**
 * Niveles de Proficiencia:
 * 1 = Básico - Conocimiento teórico
 * 2 = Intermedio - Puede trabajar con supervisión
 * 3 = Competente - Trabajo autónomo
 * 4 = Avanzado - Puede enseñar a otros
 * 5 = Experto - Referente técnico
 */
export interface EmployeeSkillResponse {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  level: number;
  evidenceUrl: string | null;
  lastValidatedAt: string | null;
  validatedByUserId: string | null;
  validatedByName: string | null;
}

export interface UpsertEmployeeSkillRequest {
  skillId: string;
  level: number;
  evidenceUrl?: string | null;
}

export interface ValidateSkillRequest {
  newLevel?: number | null;
}

// ============ PROJECTS ============
export enum ProjectStatus {
  Draft = 0,
  Active = 1,
  OnHold = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum ProjectComplexity {
  Low = 0,
  Medium = 1,
  High = 2,
}

export interface ProjectResponse {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  statusName: string;
  startDate: string | null;
  endDate: string | null;
  complexity: ProjectComplexity;
  complexityName: string;
  budgetEstimate?: number | null;
  createdAt: string;
}

export interface CreateProjectRequest {
  code?: string | null;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  complexity: ProjectComplexity;
  budgetEstimate?: number | null;
}

/**
 * Partial update - Solo se actualizan los campos enviados
 * Los campos omitidos mantienen su valor actual
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  complexity?: ProjectComplexity;
  budgetEstimate?: number | null;
}

// ============ PROJECT REQUIREMENTS ============
export interface SkillRequirementResponse {
  id: string;
  projectId: string;
  skillId: string;
  skillName: string;
  requiredLevel: number;
  isMandatory: boolean;
}

export interface AddSkillRequirementRequest {
  skillId: string;
  requiredLevel: number;
  isMandatory: boolean;
}

// ============ APPLICATIONS (POSTULACIONES) ============
export enum ApplicationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface ApplicationResponse {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userFullName: string;
  message: string | null;
  status: ApplicationStatus;
  statusName: string;
  appliedAt: string;
  reviewedByUserId: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export interface ApplyToProjectRequest {
  message?: string | null;
}

export interface ReviewApplicationRequest {
  status: ApplicationStatus;
  reviewNotes?: string | null;
}

// ============ ASSIGNMENTS ============
export interface CreateAssignmentRequest {
  projectId: string;
  userId: string;
  role: string;
  hoursPerWeek?: number;
  startDate?: string | null;
  endDate?: string | null;
}

// ============ AGENT IA ============
export interface AgentQueryRequest {
  query: string;
  requireApproval?: boolean;
}

export interface AgentQueryResponse {
  response: string;           // Backend retorna 'response' (JSON string)
  reasoningSteps: string;     // Backend retorna 'reasoningSteps'
  toolsExecuted: Array<{
    toolName: string;
    input: string;
    output: string;
    success: boolean;
  }>;
  requiresHumanApproval: boolean; // Backend retorna 'requiresHumanApproval'
  actionId: string | null;
}

export interface ValidateSkillAIRequest {
  userId: string;
  skillId: string;
  level: number;
  evidenceUrl?: string | null;
  yearsExperience?: number;
}

export interface ValidateSkillAIResponse {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  recommendations: string[];
}

export interface MatchCandidatesRequest {
  projectId: string;
  requireApproval?: boolean;
  minScore?: number;
}

export interface CandidateMatch {
  userId: string;
  fullName: string;
  matchScore: number;
  matchDetails: {
    mandatorySkillsMatch: string;
    optionalSkillsMatch: string;
    averageSkillLevel: number;
    yearsExperience: number;
  };
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface MatchCandidatesResponse {
  projectId: string;
  projectName: string;
  totalCandidates: number;
  requiresApproval: boolean;
  actionId: string | null;
  candidates: CandidateMatch[];
  summary: {
    bestMatch: string;
    averageScore: number;
    candidatesAbove90: number;
  };
}

export interface RejectActionRequest {
  reason: string;
}