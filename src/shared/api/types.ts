// ============ BASE API RESPONSE ============
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
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
  firstName: string;
  lastName: string;
  organizationId?: string;
  expiresAt?: string;
}

export interface RegisterOrganizationRequest {
  organizationName: string;
  legalName?: string | null;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  entityType?: number | null;
}

export interface RegisterOrganizationResponse {
  organizationId: string;
  organizationName: string;
  adminUserId: string;
  adminEmail: string;
  token: string;
}

// ============ ORGANIZATIONS ============
/** 1 CTA, 2 Ahorro y crédito, 3 Multiactiva, 4 Mutual, 5 Fondo de empleados, 6 Otra */
export type OrganizationEntityType = 1 | 2 | 3 | 4 | 5 | 6;

export interface OrganizationStatsDto {
  users: number;
  activeUsers: number;
  associatesByStatus: { applicant: number; active: number; suspended: number; withdrawn: number };
  employees: number;
  projects: number;
  activeProjects: number;
  governingBodies: number;
  educationPrograms: number;
}

export interface OrganizationDto {
  id: string;
  name: string;
  legalName: string | null;
  nit: string | null;
  entityType: OrganizationEntityType | null;
  isActive: boolean;
  createdAt: string;
  stats: OrganizationStatsDto;
}

export interface UpdateOrganizationRequest {
  name: string;
  legalName?: string | null;
  nit?: string | null;
  entityType?: OrganizationEntityType | null;
}

// ============ USERS ============
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** UI field derived from firstName/lastName by usersService. */
  fullName: string;
  roleName: string;
  /** UI field mapped from the API's `phone` by usersService. */
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  documentType?: number;
  documentNumber?: string;
  isEmployee?: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  isEmployee?: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  isEmployee?: boolean;
}

// ============ PROFILE ============
export type AvailabilityStatus = "Available" | "OpenToOffers" | "NotAvailable";

export interface ProfileResponse {
  userId: string;
  bio: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  seniorityLevelId?: number | null;
  location?: string | null;
  timezone?: string | null;
  availability?: AvailabilityStatus | null;
  preferredTitle?: string | null;
  hourlyRate?: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateProfileRequest {
  bio?: string | null;
  yearsExperience?: number | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  seniorityLevelId?: number | null;
  location?: string | null;
  timezone?: string | null;
  availability?: AvailabilityStatus | null;
  preferredTitle?: string | null;
  hourlyRate?: number | null;
}

// ============ CERTIFICATIONS ============
export interface CertificationResponse {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate: string | null;
  evidenceUrl: string | null;
}

export interface CreateCertificationRequest {
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string | null;
  evidenceUrl?: string | null;
}

export interface UpdateCertificationRequest {
  name?: string;
  issuer?: string;
  issueDate?: string;
  expirationDate?: string | null;
  evidenceUrl?: string | null;
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
  experienceDescription: string | null;
  lastValidatedAt: string | null;
  validatedByUserId: string | null;
  validatedByName: string | null;
}

export interface UpsertEmployeeSkillRequest {
  id?: string; // optional when updating existing employee skill
  skillId: string;
  level: number;
  evidenceUrl?: string | null;
  experienceDescription?: string | null;
}

export interface ValidateSkillRequest {
  newLevel?: number | null;
}

// ============ PROJECTS ============
// Mirrors Domain.Enums.ProjectStatus / ProjectComplexity (backend, serialized as numbers).
export enum ProjectStatus {
  Draft = 1,
  Open = 2,
  InProgress = 3,
  Closed = 4,
  Cancelled = 5,
}

export enum ProjectComplexity {
  Low = 1,
  Medium = 2,
  High = 3,
}

// Fallback labels; `satisfies` makes a missing enum value fail typecheck.
export const PROJECT_STATUS_LABELS = {
  [ProjectStatus.Draft]: 'Borrador',
  [ProjectStatus.Open]: 'Abierto',
  [ProjectStatus.InProgress]: 'En progreso',
  [ProjectStatus.Closed]: 'Cerrado',
  [ProjectStatus.Cancelled]: 'Cancelado',
} satisfies Record<ProjectStatus, string>;

export const PROJECT_COMPLEXITY_LABELS = {
  [ProjectComplexity.Low]: 'Baja',
  [ProjectComplexity.Medium]: 'Media',
  [ProjectComplexity.High]: 'Alta',
} satisfies Record<ProjectComplexity, string>;

export interface ProjectResponse {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  complexityLevel: ProjectComplexity;
  status: ProjectStatus;
  createdAt: string;
}

export interface CreateProjectRequest {
  code?: string | null;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  complexityLevel: ProjectComplexity;
}

export interface UpdateProjectRequest {
  code?: string | null;
  name?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  complexityLevel?: ProjectComplexity;
  status?: ProjectStatus;
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
// Mirrors Domain.Enums.ApplicationStatus (backend, serialized as numbers). "Pending" is the backend "Applied".
export enum ApplicationStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Withdrawn = 4,
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
  projectRoleId?: string | null;
  applicationId?: string | null;
}

export interface UpdateAssignmentRequest {
  projectRoleId?: string | null;
}

/** status: 1=Active, 2=Removed, 3=Completed */
export interface AssignmentResponse {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  roleName?: string | null;
  status: number;
  assignedAt: string;
  endedAt?: string | null;
}

// ============ AGENT IA ============
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

// ============ CONFIGURATION (CATALOGS) ============

export interface ConfigItemDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ProjectStatusDto extends ConfigItemDto {
  allowsApplications: boolean;
}

export interface ProjectComplexityLevelDto extends ConfigItemDto {
  experienceMultiplier: number;
}

export interface ApplicationStatusDto extends ConfigItemDto {
  requiresReviewNotes: boolean;
  isFinalState: boolean;
}

export interface AssignmentStatusDto extends ConfigItemDto {}

export interface SkillLevelDto extends ConfigItemDto {}

export interface ContributionScoreDto extends ConfigItemDto {}

export interface EvaluationSourceDto extends ConfigItemDto {}

export interface SkillTypeDto extends ConfigItemDto {}

export interface SkillCategoryDto extends ConfigItemDto {
  parentCategoryId: number | null;
  parentCategoryName: string | null;
}

export interface AgentActionTypeDto extends ConfigItemDto {}

export interface AgentActionStatusDto extends ConfigItemDto {}

export interface SeniorityLevelDto extends ConfigItemDto {
  minYearsExperience: number;
  maxYearsExperience: number | null;
}

export interface AllConfigCatalogsDto {
  projectStatuses: ProjectStatusDto[];
  complexityLevels: ProjectComplexityLevelDto[];
  applicationStatuses: ApplicationStatusDto[];
  assignmentStatuses: AssignmentStatusDto[];
  skillLevels: SkillLevelDto[];
  contributionScores: ContributionScoreDto[];
  evaluationSources: EvaluationSourceDto[];
  skillTypes: SkillTypeDto[];
  skillCategories: SkillCategoryDto[];
  agentActionTypes: AgentActionTypeDto[];
  agentActionStatuses: AgentActionStatusDto[];
  seniorityLevels: SeniorityLevelDto[];
}

export interface MatchCandidatesRequest {
  projectId: string;
  requireApproval?: boolean;
  minScore?: number;
}

export interface SkillAlignment {
  skillName: string;
  requiredLevel: number;
  currentLevel: number;
  isMandatory: boolean;
  meets: boolean;
}

export interface CandidateMatch {
  userId: string;
  fullName: string;
  email: string;
  matchScore: number;
  skillAlignments: SkillAlignment[];
  recommendationReason: string;
}

export interface MatchCandidatesResponse {
  projectId: string;
  projectName: string;
  candidates: CandidateMatch[];
  analysisNarrative: string;
}

// ============ RBAC (ROLES & PERMISSIONS) ============
export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  permissionCount: number;
  userCount: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permissionIds?: string[] | null;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string | null;
}

export interface PermissionDto {
  id: string;
  code: string; // e.g., "menu.platform.dashboard"
  name: string;
  module: string;
  description?: string | null;
  sortOrder?: number;
}

/** Node of GET /permissions/tree: roots are menu sections, children their options. */
export interface PermissionTreeNode extends PermissionDto {
  parentCode?: string;
  /** Only present when the tree is requested for a role. */
  isGranted?: boolean;
  children: PermissionTreeNode[];
}

/** GET /permissions/me: ancestor pruning and admin-all already applied server-side. */
export interface MyPermissionsResponse {
  userId: string;
  userName: string;
  isAdmin: boolean;
  roles: RoleDto[];
  effectivePermissions: PermissionDto[];
  directOverrides: { permissionId: string; permissionCode: string; permissionName: string; isGranted: boolean }[];
}

export interface PermissionGroupDto {
  module: string;
  permissions: PermissionDto[];
}

export interface RolePermissionsResponse {
  id: string;
  name: string;
  permissions: PermissionDto[];
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

export interface RevokeRoleRequest {
  userId: string;
  roleId: string;
}

export interface AssignPermissionOverrideRequest {
  userId: string;
  permissionId: string;
  isGranted: boolean;
}

export interface EffectivePermissionsResponse {
  userId: string;
  roles: { name: string }[];
  effectivePermissions: { code: string }[];
  directOverrides: { permissionCode: string; isGranted: boolean }[];
}

// ============ NOTIFICATIONS ============
/** 1 Info, 2 Success, 3 Warning, 4 Error. */
export type NotificationKind = 1 | 2 | 3 | 4;

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationKind;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

// ============ REPORTS ============
export interface AiSummaryResponse {
  markdown: string;
}

export interface SkillDistributionResponse {
  skillName: string;
  averageLevel: number;
  totalEmployees: number;
  /** key: level "1".."5", value: employee count */
  levelDistribution: Record<string, number>;
}

export interface ProjectMetricsResponse {
  totalActiveProjects: number;
  projectsAtRisk: number;
  mostDemandedSkills: { skillName: string; requiredInProjects: number }[];
}

export interface EmployeeUtilizationDetail {
  employeeId: string;
  fullName: string;
  email: string;
  activeProjectCount: number;
  assignedProjects: string[];
  utilizationPercentage: number;
  allocationStatus: string;
  skillsCount: number;
  yearsExperience?: number | null;
}

export interface EmployeeUtilizationResponse {
  totalEmployees: number;
  allocatedEmployees: number;
  unallocatedEmployees: number;
  averageProjectsPerEmployee: number;
  /** percentage 0-100 */
  utilizationRate: number;
  employees: EmployeeUtilizationDetail[];
}

export interface DepartmentMetricsResponse {
  totalEmployees: number;
  activeEmployees: number;
  averageSkillsPerEmployee: number;
  totalUniqueSkills: number;
  employeesWithCertifications: number;
  averageYearsExperience: number;
  totalRoles: number;
  experienceDistribution: {
    junior: number;
    midLevel: number;
    senior: number;
    lead: number;
  };
}

// ============ SOLIDARITY: ASSOCIATES ============
export type AssociateStatus = 1 | 2 | 3 | 4; // Applicant, Active, Suspended, Withdrawn
export type AssociateRole = "Associate" | "Employee" | "Both" | "None";

export interface AssociateDto {
  userId: string;
  fullName: string;
  documentType?: number;
  documentNumber?: string;
  status: AssociateStatus;
  isEmployee: boolean;
  role: AssociateRole;
  currentAdmissionDate?: string;
}

export interface MembershipPeriodDto {
  id: string;
  applicationDate: string;
  admissionDate?: string;
  withdrawalDate?: string;
  withdrawalReason?: string;
}

export interface AssociateDetailDto extends AssociateDto {
  email: string;
  hasActiveConsent: boolean;
  periods: MembershipPeriodDto[];
}

export interface CreateAssociateRequest {
  userId: string;
  applicationDate?: string;
}

export interface TransitionRequest {
  toStatus: AssociateStatus;
  effectiveDate?: string;
  reason?: string;
}

export interface TransitionResult {
  status: AssociateStatus;
  warnings: string[];
}

export interface SetDocumentRequest {
  documentType: number;
  documentNumber: string;
}

// ============ SOLIDARITY: HABEAS DATA ============
export interface DataPolicyDto {
  id: string;
  version: string;
  purpose: string;
  text: string;
  effectiveFrom: string;
  createdAt: string;
}

export interface CreateDataPolicyRequest {
  version: string;
  purpose: string;
  text: string;
  effectiveFrom?: string;
}

export interface ConsentDto {
  id: string;
  userId: string;
  policyVersionId: string;
  policyVersion: string;
  purpose: string;
  grantedAt: string;
  grantedByUserId: string;
  revokedAt?: string;
  revokedByUserId?: string;
  revocationReason?: string;
  isActive: boolean;
}

// ============ SOLIDARITY: COOPERATIVE EDUCATION ============
export type ProgramType = 1 | 2 | 3 | 4;
export type EnrollmentStatus = 1 | 2 | 3;

export interface EducationProgramDto {
  id: string;
  name: string;
  type: ProgramType;
  requiredHours: number;
  startDate?: string;
  endDate?: string;
}

export interface SaveProgramRequest {
  name: string;
  type: ProgramType;
  requiredHours: number;
  startDate?: string;
  endDate?: string;
}

export interface EnrollmentDto {
  id: string;
  programId: string;
  userId: string;
  fullName: string;
  status: EnrollmentStatus;
  hoursCompleted: number;
  completionDate?: string;
}

export interface EnrollRequest {
  userId: string;
  status?: EnrollmentStatus;
  hoursCompleted: number;
  completionDate?: string;
}

export interface UpdateEnrollmentRequest {
  status: EnrollmentStatus;
  hoursCompleted: number;
  completionDate?: string;
}

export interface EducationCoverageResponse {
  year: number;
  eligibleAssociates: number;
  coveredAssociates: number;
  coverageRatio: number;
  avgHours: number;
  basicCompliant: boolean;
  hoursByType: { Basic?: number; Permanent?: number; Governance?: number; Informal?: number };
}
// ============================================================================
// SOLIDARITY (consolidated contracts) — org comes from the JWT; enums are numbers
// ============================================================================

// ============ HABEAS DATA: ARCO ============
export type ArcoType = 1 | 2 | 3 | 4; // Access, Rectification, Cancellation, Opposition
export type ArcoStatus = 1 | 2 | 3; // Pending, Attended, Rejected

export interface ArcoRequestDto {
  id: string;
  userId: string;
  type: ArcoType;
  status: ArcoStatus;
  filingNumber: string;
  requestedAt: string;
  description: string;
  response?: string;
  respondedAt?: string;
}

export interface CreateArcoRequest {
  userId?: string;
  type: ArcoType;
  description: string;
}

// ============ COMPETENCIES ============
export interface CompetencyDto {
  id: string;
  userId: string;
  fullName: string;
  name: string;
  level: number; // 1-5
  isAvailable: boolean;
  notes?: string;
  updatedAt: string;
}

export interface CreateCompetencyRequest {
  userId: string;
  name: string;
  level: number;
  notes?: string;
}

// ============ GOVERNING BODIES ============
export type GoverningBodyType = 1 | 2 | 3 | 4 | 5 | 99;
export type SessionType = 1 | 2; // Ordinary, Extraordinary
export type VoteOption = 1 | 2 | 3 | 4; // Approve, Reject, Abstain, Blank

export interface GoverningBodyDto {
  id: string;
  type: GoverningBodyType;
  name: string;
  constitutionDate: string;
  description?: string;
  isActive: boolean;
  membersCount: number;
  minutesCount: number;
}

export interface CreateGoverningBodyRequest {
  type: GoverningBodyType;
  name: string;
  constitutionDate: string;
  description?: string;
}

export interface UpdateGoverningBodyRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface GoverningBodyMemberDto {
  id: string;
  governingBodyId: string;
  userId: string;
  fullName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface AssignMemberRequest {
  governingBodyId: string;
  userId: string;
  position: string;
  startDate: string;
}

export interface UpdateMemberRequest {
  position?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface MinutesDto {
  id: string;
  governingBodyId: string;
  assemblyId?: string;
  sessionDate: string;
  sessionType: SessionType;
  quorum: number;
  decisions: string;
  noticeUrl?: string;
  minutesUrl?: string;
  notes?: string;
}

export interface CreateMinutesRequest {
  governingBodyId: string;
  assemblyId?: string;
  sessionDate: string;
  sessionType: SessionType;
  quorum: number;
  decisions: string;
  noticeUrl?: string;
  minutesUrl?: string;
  notes?: string;
}

export interface AssemblyDto {
  id: string;
  governingBodyId?: string;
  scheduledAt: string;
  type: SessionType;
  notice: string;
  minimumQuorum: number;
  attendees?: number;
  hasQuorum: boolean;
  isClosed: boolean;
  closedAt?: string;
  results?: string;
  votesCount: number;
}

export interface ConveneAssemblyRequest {
  governingBodyId?: string;
  scheduledAt: string;
  type: SessionType;
  notice: string;
  minimumQuorum: number;
}

export interface CastVoteRequest {
  assemblyId: string;
  userId?: string;
  option: VoteOption;
  notes?: string;
}

export interface VoteResultsDto {
  assemblyId: string;
  totalVotes: number;
  approve: number;
  reject: number;
  abstain: number;
  blank: number;
}

// ============ SURPLUS ============
export interface SurplusDistributionDto {
  id: string;
  period: string;
  totalSurplus: number;
  protectionReserve: number;
  educationFund: number;
  solidarityFund: number;
  remainder: number;
  revaluation?: number;
  cooperativeReturn?: number;
  approvedByAssembly: boolean;
  notes?: string;
  createdAt: string;
}

export interface CalculateSurplusRequest {
  period: string;
  totalSurplus: number;
  notes?: string;
}

export interface ApproveSurplusRequest {
  revaluation?: number;
  cooperativeReturn?: number;
}

// ============ PAYROLL ============
export type CompensationModel = 1 | 2 | 3; // DaysByRate, FixedMonthly, PerProject

export interface CompensationDto {
  id: string;
  userId: string;
  period: string;
  model: CompensationModel;
  baseValue: number;
  dailyRate?: number;
  calculatedValue: number;
  notes?: string;
  createdAt: string;
}

export interface CreateCompensationRequest {
  userId: string;
  period: string;
  model: CompensationModel;
  baseValue: number;
  dailyRate?: number;
  notes?: string;
}

export interface PilaContributionDto {
  id: string;
  userId: string;
  period: string;
  contributorType: number;
  arlRiskLevel: number;
  contributionBase: number;
  healthContribution: number;
  pensionContribution: number;
  arlContribution: number;
  total: number;
  createdAt: string;
}

export interface CalculatePilaRequest {
  userId: string;
  period: string;
  income: number;
  arlRiskLevel?: number;
}

// ============ WELFARE ============
export type AidType = 1 | 2 | 3 | 4 | 5 | 99;
export type WelfareRequestStatus = 1 | 2 | 3 | 4; // Pending, Approved, Rejected, Delivered

export interface WelfareProgramDto {
  id: string;
  name: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  maxBeneficiaries?: number;
  createdAt: string;
}

export interface CreateWelfareProgramRequest {
  name: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate?: string;
  maxBeneficiaries?: number;
}

export interface WelfareRequestDto {
  id: string;
  userId: string;
  programId?: string;
  programName?: string;
  aidType: AidType;
  requestedAmount: number;
  approvedAmount?: number;
  status: WelfareRequestStatus;
  reason: string;
  requiredDate: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface CreateWelfareRequestRequest {
  userId?: string;
  programId?: string;
  aidType: AidType;
  requestedAmount: number;
  reason: string;
  requiredDate: string;
}

export interface WelfareAidDto {
  id: string;
  userId: string;
  welfareRequestId: string;
  solidarityFundId?: string;
  aidType: AidType;
  amount: number;
  deliveredAt: string;
  concept: string;
  requiresRepayment: boolean;
  repaymentDueDate?: string;
}

export interface SolidarityFundDto {
  id: string;
  period: string;
  surplusDistributionId: string;
  totalSurplus: number;
  contribution: number;
  carriedOver: number;
  availableBalance: number;
  totalDisbursed: number;
  isCurrent: boolean;
  notes?: string;
  createdAt: string;
}

// ============ OCCUPATIONAL HEALTH (SST) ============
export type ExamType = 1 | 2 | 3; // PreEmployment, Periodic, Exit
export type ExamResult = 1 | 2 | 3; // Fit, FitWithRestrictions, Unfit
export type AccidentSeverity = 1 | 2 | 3; // Minor, Serious, Fatal

export interface MedicalExamDto {
  id: string;
  userId: string;
  examType: ExamType;
  scheduledDate: string;
  performedAt?: string;
  result?: ExamResult;
  fileUrl?: string;
  notes?: string;
  performed: boolean;
  createdAt: string;
}

export interface WorkAccidentDto {
  id: string;
  userId: string;
  occurredAt: string;
  accidentType: string;
  severity: AccidentSeverity;
  arl: string;
  description: string;
  furatNumber?: string;
  investigationDate?: string;
  investigationCompleted: boolean;
  conclusions?: string;
  causes?: string;
  correctiveMeasures?: string;
  createdAt: string;
}

export interface ReportAccidentRequest {
  userId: string;
  occurredAt: string;
  accidentType: string;
  severity: AccidentSeverity;
  arl: string;
  description: string;
  furatNumber?: string;
}

export interface InvestigateAccidentRequest {
  investigationDate: string;
  conclusions: string;
  causes: string;
  correctiveMeasures: string;
}

export interface RiskDto {
  id: string;
  level: number; // 1 Low .. 5 Critical
  factor: string;
  description: string;
  isActive: boolean;
  controls?: string;
  createdAt: string;
}

export interface CreateRiskRequest {
  level: number;
  factor: string;
  description: string;
  controls?: string;
}

// ============ SOCIAL BALANCE ============
export interface SocialBalanceIndicatorDto {
  userId: string;
  fullName?: string;
  year: number;
  educationHours: number;
  basicEducationHours: number;
  assemblyParticipations: number;
  committeeParticipations: number;
  benefitsReceived: number;
  meetsEducation: boolean;
  index: number;
}

export interface SocialIndicatorDto {
  name: string;
  currentValue: number;
  targetValue: number;
  unit?: string;
  coverage?: number;
}

export interface SocialDimensionDto {
  name: string;
  description?: string;
  coverage: number;
  target: number;
  status: string;
  indicators: SocialIndicatorDto[];
}

export interface SocialBalanceReportDto {
  year: number;
  generatedAt: string;
  activeAssociates: number;
  dimensions: SocialDimensionDto[];
  executiveSummary?: string;
  strengths: string[];
  improvementAreas: string[];
  narrative?: string;
}

// ============ SUPERSOLIDARIA ============
export type SupersolidariaReportType = 1 | 2; // Quarterly, Annual

export interface SupersolidariaReportDto {
  id: string;
  period: string;
  periodEnd: string;
  reportType: SupersolidariaReportType;
  socialBalanceJson: string;
  associatesJson: string;
  complianceJson: string;
  isSent: boolean;
  sentAt?: string;
  notes?: string;
  createdAt: string;
}

export interface GenerateSupersolidariaReportRequest {
  period: string;
  reportType: SupersolidariaReportType;
  notes?: string;
}

// ============ COOPERATIVE ASSISTANT ============
export interface ComplianceAreaDto {
  name: string;
  applicableRule: string;
  compliant: boolean;
  coverage: number;
  detail?: string;
  findings: string[];
}

export interface ComplianceDto {
  year: number;
  checkedAt: string;
  areas: ComplianceAreaDto[];
  compliantAreas: number;
  nonCompliantAreas: number;
  overallCoverage: number;
  overallStatus: string;
  alerts: string[];
}

export interface VerifyComplianceRequest {
  year?: number;
  verifyEducation: boolean;
  verifyOccupationalHealth: boolean;
  verifyHabeasData: boolean;
}

// ============ AI ASSISTANT ============
export interface AiChatRequest {
  conversationId?: string;
  message: string;
  moduleKey?: string;
}

export interface AiSource {
  tool: string;
  module: string;
  label: string;
}

export type AiToolStatus = 'started' | 'done' | 'denied' | 'error';

/** Server-sent events of POST /ai/chat, in stream order. Every stream ends with `done` or `error`. */
export type AiStreamEvent =
  | { type: 'meta'; data: { conversationId: string; messageId: string; modules: string[] } }
  | { type: 'tool'; data: { name: string; module: string; status: AiToolStatus; rows?: number } }
  | { type: 'delta'; data: { text: string } }
  | { type: 'refusal'; data: { deniedModules: string[]; message: string } }
  | { type: 'done'; data: { messageId: string; sources: AiSource[]; usage: { in: number; out: number } } }
  | { type: 'error'; data: { code: string; message: string } };

export interface AiCapability {
  key: string;
  name: string;
  suggestions: string[];
}

export interface AiCapabilities {
  allowed: AiCapability[];
  denied: string[];
}

export interface AiConversation {
  id: string;
  title: string;
  moduleKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiStoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'refusal';
  content: string;
  toolName?: string | null;
  moduleKey?: string | null;
  toolStatus?: 'ok' | 'denied' | 'error' | 'truncated' | null;
  resultRows?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  createdAt: string;
}

/** GET /ai/usage: the organization's AI quota for the current UTC month */
export interface AiUsageSummary {
  period: string;
  periodStart: string;
  periodEnd: string;
  quota: number;
  isDefaultQuota: boolean;
  used: number;
  remaining: number;
  percent: number;
  dailyBudget: number;
  usedToday: number;
  byUseCase: { useCase: string; tokens: number }[];
  daily: { date: string; tokens: number }[];
}

/** GET /ai/quotas (platform operators only; empty for everyone else) */
export interface AiOrganizationQuota {
  organizationId: string;
  name: string;
  /** Own quota; null uses the platform default */
  monthlyTokenQuota: number | null;
  effectiveQuota: number;
  used: number;
  percent: number;
}

/** One row of GET /permissions/audit: who changed whose permissions, with the granted/revoked diff */
export interface PermissionAuditEntry {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorName: string;
  targetType: 'Role' | 'User';
  targetId: string;
  targetName: string;
  /** Role assigned or removed when the target is a user */
  roleId: string | null;
  roleName: string | null;
  action: string;
  granted: { code: string; name: string }[];
  revoked: { code: string; name: string }[];
}

export interface PermissionAuditPage {
  items: PermissionAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PermissionAuditFilter {
  targetType?: 'Role' | 'User';
  targetId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
}
