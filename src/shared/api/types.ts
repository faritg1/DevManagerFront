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
}

export interface RegisterOrganizationResponse {
  organizationId: string;
  organizationName: string;
  adminUserId: string;
  adminEmail: string;
  token: string;
}

// ============ USERS ============
/**
 * Nota de contrato: el backend actual (UserResponse DTO) NO expone los campos de
 * persona (PersonType, DocumentType, DocumentNumber, BirthDate) aunque la entidad
 * User los tiene. Estos campos se declaran opcionales para forward-compatibility:
 * si el backend empieza a devolverlos, el frontend ya los tipa. Ver reporte de apply.
 */
export type PersonType = "Asociado" | "Empleado" | "Both";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  // ===== Persona (sector solidario) — no expuestos por /api/users hoy =====
  personType?: PersonType | null;
  documentType?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
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

export interface AgentToolExecuted {
  tool_name: string;
  input: string;
  output: string;
  success: boolean;
}

export interface AgentMetadata {
  reasoning: string;
  tools_executed: AgentToolExecuted[];
  requires_human_approval: boolean;
  action_id: string | null;
}

export interface AgentSuggestedAction {
  label: string;
  query: string;
}

export interface AgentQueryResponse {
  response_type: 'text' | 'mixed' | 'table';
  summary: string;
  markdown: string;
  payload: {
    text: string;
  };
  metadata: AgentMetadata;
  suggested_actions: AgentSuggestedAction[];
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

export interface RejectActionRequest {
  reason: string;
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
  code: string; // e.g., "users.read"
  name: string;
  module: string;
  description?: string | null;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  module: string;
  description?: string | null;
}

export interface UpdatePermissionRequest {
  code?: string;
  name?: string;
  module?: string;
  description?: string | null;
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

export interface ValidatePermissionRequest {
  userId: string;
  permissionCode: string;
}

export interface ValidatePermissionResponse {
  hasPermission: boolean;
}

// ============ REPORTS ============
export interface AiSummaryResponse {
  markdown: string;
}

// ============================================================================
// GESTIÓN HUMANA SOLIDARIA — Módulos de cooperativas/fondos/mutuales
// Contratos leídos desde los controllers del backend (branch main, Fases 1-5)
// ============================================================================

// ============ ENUMS (sector solidario) ============
export enum CompensacionModelo {
  DiasPorTarifa = 1,
  FijoMensual = 2,
  PorProyecto = 3,
}

export enum PilaTipoAportante {
  Independiente = 51, // CTA tipo 51 para asociados cooperativos
}

export enum TipoAuxilio {
  AuxilioEconomico = 1,
  BecaEducativa = 2,
  CreditoBlando = 3,
  AuxilioFunerario = 4,
  ApoyoVivienda = 5,
  Otro = 99,
}

export enum EstadoSolicitudBienestar {
  Pendiente = 1,
  EnEvaluacion = 2,
  Aprobada = 3,
  Rechazada = 4,
  Entregada = 5,
}

export enum TipoEducacion {
  Basica = 1,
  Avanzada = 2,
  Especializada = 3,
}

export enum TipoSolicitudARCO {
  Acceso = 1,
  Rectificacion = 2,
  Cancelacion = 3,
  Oposicion = 4,
}

export enum EstadoSolicitudARCO {
  Pendiente = 1,
  Atendida = 2,
  Rechazada = 3,
}

export enum TipoOrgano {
  AsambleaGeneral = 1,
  ConsejoAdministracion = 2,
  JuntaVigilancia = 3,
  RevisorFiscal = 4,
  Comite = 5,
  Otros = 99,
}

export enum TipoAsamblea {
  Ordinaria = 1,
  Extraordinaria = 2,
}

export enum TipoVoto {
  Aprobado = 1,
  Rechazado = 2,
  Abstencion = 3,
  Blanco = 4,
}

export enum GravedadAccidente {
  Leve = 1,
  Grave = 2,
  Mortal = 3,
}

export enum TipoExamenMedico {
  Ingreso = 1,
  Periodico = 2,
  Retiro = 3,
}

// ============ NOMINA ============
export interface CompensacionDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  periodo: string;
  modelo: CompensacionModelo;
  valorBase: number;
  valorCalculado: number;
  observaciones: string | null;
  createdAt: string;
}

export interface CreateCompensacionDto {
  asociadoId: string;
  organizationId: string;
  periodo: string; // DateTime ISO
  modelo: CompensacionModelo;
  valorBase: number;
  observaciones?: string | null;
}

export interface PilaAporteDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  periodo: string;
  tipoAportante: PilaTipoAportante;
  ingresoBase: number;
  aporteEPS: number;
  aportePension: number;
  aporteARL: number;
  total: number;
}

// ============ BIENESTAR ============
export interface ProgramaBienestarDto {
  id: string;
  organizationId: string;
  nombre: string;
  descripcion: string | null;
  presupuesto: number;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  maxBeneficiarios: number | null;
  createdAt: string;
}

export interface CreateProgramaBienestarDto {
  organizationId: string;
  nombre: string;
  descripcion?: string | null;
  presupuesto: number;
  fechaInicio: string;
  fechaFin?: string | null;
  maxBeneficiarios?: number | null;
}

export interface SolicitudBienestarDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  programaBienestarId: string | null;
  programaNombre: string | null;
  tipoAuxilio: TipoAuxilio;
  tipoAuxilioNombre: string;
  montoSolicitado: number;
  montoAprobado: number | null;
  estado: EstadoSolicitudBienestar;
  estadoNombre: string;
  motivo: string;
  fechaRequerida: string;
  fechaResolucion: string | null;
  observacionesResolucion: string | null;
  createdAt: string;
}

export interface CreateSolicitudBienestarDto {
  asociadoId: string;
  organizationId: string;
  programaBienestarId?: string | null;
  tipoAuxilio: TipoAuxilio;
  montoSolicitado: number;
  motivo: string;
  fechaRequerida: string;
}

export interface FondoSolidaridadDto {
  id: string;
  organizationId: string;
  periodo: string;
  totalExcedentes: number;
  aporteFondo: number;
  saldoDisponible: number;
  totalDesembolsado: number;
  vigente: boolean;
  observaciones: string | null;
  createdAt: string;
}

export interface AuxilioDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  solicitudBienestarId: string | null;
  tipo: TipoAuxilio;
  tipoNombre: string;
  monto: number;
  fechaEntrega: string;
  concepto: string;
  requiereReintegro: boolean;
  fechaLimiteReintegro: string | null;
}

// ============ GESTIÓN HUMANA — COMPETENCIAS ============
export interface CompetenciaAsociadoDto {
  id: string;
  asociadoId: string;
  competencia: string;
  nivel: number;
  disponible: boolean;
  fechaActualizacion: string;
  observaciones: string | null;
}

// ============ GESTIÓN HUMANA — EDUCACIÓN ============
export interface ProgramaEducacionDto {
  id: string;
  organizationId: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoEducacion;
  horas: number;
  esObligatorio: boolean;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  createdAt: string;
}

export interface CreateProgramaEducacionDto {
  organizationId: string;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoEducacion;
  horas: number;
  esObligatorio: boolean;
  fechaInicio: string;
  fechaFin?: string | null;
}

export interface AsociadoEducacionDto {
  id: string;
  asociadoId: string;
  programaEducacionId: string;
  programaNombre: string | null;
  tipoEducacion: string | null;
  horasPrograma: number;
  horasCursadas: number;
  progreso: number;
  fechaInscripcion: string;
  fechaCompletado: string | null;
  completado: boolean;
  resultado: string | null;
}

export interface CreateAsociadoEducacionDto {
  asociadoId: string;
  programaEducacionId: string;
  organizationId: string;
}

// ============ BALANCE SOCIAL ============
export interface IndicadorBalanceSocialDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  anio: number;
  horasEducacion: number;
  participacionAsambleas: number;
  participacionComites: number;
  aportesSociales: number;
  beneficiosRecibidos: number;
  cumpleEducacion: boolean;
  indiceBalanceSocial: number;
  observaciones: string | null;
}

// ============ EXCEDENTES ============
export interface ExcedenteDto {
  id: string;
  organizationId: string;
  periodo: string;
  totalExcedentes: number;
  reservaProteccionAportes: number;
  fondoEducacion: number;
  fondoSolidaridad: number;
  revalorizacion: number | null;
  retornoCooperativo: number | null;
  aprobadoPorAsamblea: boolean;
  observaciones: string | null;
  createdAt: string;
}

export interface CreateExcedenteDto {
  organizationId: string;
  periodo: string;
  totalExcedentes: number;
  observaciones?: string | null;
}

// ============ HABEAS DATA ============
export interface AutorizacionDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  fechaAutorizacion: string;
  vigencia: string | null;
  revocada: boolean;
  fechaRevocacion: string | null;
  finalidad: string;
  medioAutorizacion: string;
  direccionIp: string | null;
  vigente: boolean; // computed on backend: !revocada && (!vigencia || vigencia >= now)
  createdAt: string;
}

export interface CreateAutorizacionDto {
  asociadoId: string;
  organizationId: string;
  finalidad: string;
  medioAutorizacion?: string; // default "Digital"
  direccionIp?: string | null;
}

export interface SolicitudARCODto {
  id: string;
  asociadoId: string;
  organizationId: string;
  tipo: TipoSolicitudARCO;
  tipoNombre: string;
  fecha: string;
  estado: EstadoSolicitudARCO;
  estadoNombre: string;
  descripcion: string;
  respuesta: string | null;
  fechaRespuesta: string | null;
  radicado: string | null;
  createdAt: string;
}

export interface CreateSolicitudARCODto {
  asociadoId: string;
  organizationId: string;
  tipo: TipoSolicitudARCO;
  descripcion: string;
}

// ============ SST ============
export interface ExamenMedicoDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  tipoExamen: TipoExamenMedico;
  tipoExamenNombre: string;
  fechaProgramado: string;
  fechaRealizado: string | null;
  resultado: string | null;
  archivoUrl: string | null;
  observaciones: string | null;
  realizado: boolean; // computed: fechaRealizado.HasValue
  createdAt: string;
}

export interface CreateExamenMedicoDto {
  asociadoId: string;
  organizationId: string;
  tipoExamen: TipoExamenMedico;
  fechaProgramado: string;
}

export interface ArlVigenciaResponse {
  vigente: boolean;
  diasRestantes: number;
  alerta: string | null;
}

export interface AccidenteDto {
  id: string;
  asociadoId: string;
  organizationId: string;
  fecha: string;
  tipo: string;
  gravedad: GravedadAccidente;
  gravedadNombre: string;
  arl: string;
  descripcion: string;
  furat: string | null;
  fechaInvestigacion: string | null;
  investigacionCompletada: boolean;
  conclusiones: string | null;
  causas: string | null;
  medidasCorrectivas: string | null;
  createdAt: string;
}

export interface CreateAccidenteDto {
  asociadoId: string;
  organizationId: string;
  fecha: string;
  tipo: string;
  gravedad: GravedadAccidente;
  arl: string;
  descripcion: string;
  furat?: string | null;
}

export interface RiesgoDto {
  id: string;
  organizationId: string;
  nivelRiesgo: number;
  nivelRiesgoNombre: string;
  factor: string;
  descripcion: string;
  activo: boolean;
  controles: string | null;
  createdAt: string;
}

export interface CreateRiesgoDto {
  organizationId: string;
  nivelRiesgo: number;
  factor: string;
  descripcion: string;
  controles?: string | null;
}

// ============ ÓRGANOS ============
export interface OrganoDto {
  id: string;
  tipo: TipoOrgano;
  tipoNombre: string;
  nombre: string;
  organizationId: string;
  fechaConstitucion: string;
  descripcion: string | null;
  activo: boolean;
  miembrosCount: number;
  actasCount: number;
}

export interface CreateOrganoDto {
  tipo: TipoOrgano;
  nombre: string;
  organizationId: string;
  fechaConstitucion: string;
  descripcion?: string | null;
}

export interface UpdateOrganoDto {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface MiembroOrganoDto {
  id: string;
  organoId: string;
  asociadoId: string;
  cargo: string;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
}

export interface AsignarMiembroDto {
  organoId: string;
  asociadoId: string;
  cargo: string;
  fechaInicio: string;
}

export interface UpdateMiembroDto {
  cargo?: string;
  fechaFin?: string | null;
  activo?: boolean;
}

export interface ActaDto {
  id: string;
  organoId: string;
  asambleaId: string | null;
  fecha: string;
  tipoSesion: string;
  quorum: number;
  decisiones: string;
  convocatoriaUrl: string | null;
  actaUrl: string | null;
  observaciones: string | null;
}

export interface CreateActaDto {
  organoId: string;
  asambleaId?: string | null;
  fecha: string;
  tipoSesion?: string; // default "Ordinaria"
  quorum: number;
  decisiones: string;
  convocatoriaUrl?: string | null;
  actaUrl?: string | null;
  observaciones?: string | null;
}

export interface AsambleaDto {
  id: string;
  organizationId: string;
  organoId: string | null;
  fecha: string;
  tipo: TipoAsamblea;
  tipoNombre: string;
  convocatoria: string;
  quorumMinimo: number;
  asistentes: number | null;
  cerrada: boolean;
  fechaCierre: string | null;
  resultados: string | null;
  votosCount: number;
}

export interface ConvocarAsambleaDto {
  organizationId: string;
  organoId?: string | null;
  fecha: string;
  tipo: TipoAsamblea;
  convocatoria: string;
  quorumMinimo: number;
}

export interface RegistrarAsistenciaDto {
  asistentes: number;
}

export interface CerrarAsambleaDto {
  resultados?: string | null;
}

export interface VotoDto {
  id: string;
  asambleaId: string;
  asociadoId: string;
  votoEmitido: TipoVoto;
  votoNombre: string;
  fecha: string;
  observaciones: string | null;
}

export interface EmitirVotoDto {
  asambleaId: string;
  asociadoId: string;
  votoEmitido: TipoVoto;
  observaciones?: string | null;
}

export interface ResultadoVotacionDto {
  asambleaId: string;
  totalVotos: number;
  aprobados: number;
  rechazados: number;
  abstenciones: number;
  blancos: number;
}

export interface HaVotadoResponse {
  haVotado: boolean;
}

// ============ REPORTES SUPERSOLIDARIA ============
export interface ReporteSupersolidariaDto {
  id: string;
  organizationId: string;
  periodo: string;
  balanceSocialJson: string | null;
  asociadosJson: string | null;
  cumplimientoJson: string | null;
  tipoReporte: string;
  enviado: boolean;
  fechaEnvio: string | null;
  observaciones: string | null;
  createdAt: string;
}

export interface CreateReporteDto {
  organizationId: string;
  periodo: string;
  tipoReporte?: string; // default "Trimestral"
}

// ============ ASISTENTE COOPERATIVO ============
export interface CooperativaQueryRequest {
  consulta: string;
  contexto?: string | null;
  requerirAprobacion?: boolean;
}

export interface CitacionNormativa {
  norma: string;
  articulo: string;
  descripcion?: string | null;
  urlReferencia?: string | null;
}

export interface CooperativaQueryResponse {
  respuesta: string;
  markdown?: string | null;
  citations: CitacionNormativa[];
  accionesSugeridas: string[];
  actionId?: string | null;
  requiereAprobacion: boolean;
}

export interface GenerarBalanceSocialRequest {
  organizationId: string;
  anio?: number;
  incluirRecomendaciones?: boolean;
}

export interface IndicadorSocialDto {
  nombre: string;
  valorActual: number;
  valorMeta: number;
  unidad?: string | null;
  cobertura: number;
}

export interface DimensionSocialDto {
  nombre: string;
  descripcion?: string | null;
  cobertura: number;
  meta: number;
  indicadores: IndicadorSocialDto[];
  estado?: string | null;
}

export interface BalanceSocialReportDto {
  organizationId: string;
  organizationName: string;
  anio: number;
  generadoEn: string;
  dimensiones: DimensionSocialDto[];
  resumenEjecutivo?: string | null;
  fortalezas: string[];
  oportunidadesMejora: string[];
  narrativa?: string | null;
}

export interface VerificarCumplimientoRequest {
  organizationId: string;
  verificarEducacion?: boolean;
  verificarSST?: boolean;
  verificarHabeasData?: boolean;
  verificarAportes?: boolean;
}

export interface AreaCumplimientoDto {
  nombre: string;
  normaAplicable: string;
  cumple: boolean;
  cobertura: number;
  detalle?: string | null;
  hallazgos: string[];
}

export interface CumplimientoDto {
  organizationId: string;
  organizationName: string;
  verificadoEn: string;
  areas: AreaCumplimientoDto[];
  // C# computed (no setter) — NOT serialized por el backend; se calculan en el front
  areasCumplen?: number;
  areasNoCumplen?: number;
  coberturaGeneral?: number;
  estadoGeneral?: string;
  alertas: string[];
}

export interface ResponderDudaRequest {
  organizationId: string;
  pregunta: string;
  tipoAsociado?: string | null;
}