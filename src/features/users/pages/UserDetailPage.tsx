import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  User,
  ShieldCheck,
  Star,
} from "lucide-react";
import { usersService, skillsService, profileService, certificationService, rbacService } from "../../../shared/api";
import type {
  UserResponse,
  ProfileResponse,
  EmployeeSkillResponse,
  CertificationResponse,
  EffectivePermissionsResponse,
} from "../../../shared/api/types";
import { useConfig } from "../../../shared/context";
import { Card, Badge, Avatar, PageContainer, PageHeader, BackButton, LoadingBlock } from "../../../shared/ui";
import { ROUTES } from "../../../shared/config/constants";
import { formatDate, skillLevelLabel } from "../../../shared/format";

const getLevelColor = (level: number) => {
  if (level >= 5) return "bg-amber-500";
  if (level >= 4) return "bg-purple-500";
  if (level >= 3) return "bg-emerald-500";
  if (level >= 2) return "bg-blue-500";
  return "bg-slate-400";
};

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { catalogs } = useConfig();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [skills, setSkills] = useState<EmployeeSkillResponse[]>([]);
  const [certifications, setCertifications] = useState<CertificationResponse[]>([]);
  const [perms, setPerms] = useState<EffectivePermissionsResponse | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      // Parallel load user + skills + perms
      const [userRes, skillsRes, permsRes] = await Promise.all([
        usersService.getById(id),
        skillsService.getEmployeeSkills(id),
        rbacService.getUserEffectivePermissions(id).catch(() => null),
      ]);

      if (!userRes.success || !userRes.data) {
        setError("Usuario no encontrado");
        return;
      }

      setUser(userRes.data);
      setSkills(skillsRes.success && skillsRes.data ? skillsRes.data : []);
      if (permsRes && permsRes.success && permsRes.data) setPerms(permsRes.data);

      // Profile & certs — these may 404 if the user hasn't created them
      // We load them individually as they're optional
      try {
        // Profile endpoint uses /profile/me which is for current user only
        // We can't fetch another user's profile via API, so we skip it
        // Unless there's a specific endpoint — for now we leave profile null
      } catch {
        // no-op
      }
    } catch (err) {
      console.error("Error loading user detail:", err);
      setError("Error de conexión al cargar datos del usuario");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingBlock label="Cargando perfil..." className="py-20" />
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <BackButton to={ROUTES.USERS} />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            {error || "Usuario no encontrado"}
          </p>
        </div>
      </PageContainer>
    );
  }

  const validatedCount = skills.filter((s) => s.lastValidatedAt).length;

  return (
    <PageContainer>
      <PageHeader
        backTo={ROUTES.USERS}
        icon={<span className="mr-1 shrink-0" aria-hidden="true"><Avatar name={user.fullName} size="lg" /></span>}
        title={user.fullName}
        description={
          <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Badge variant="purple" icon={ShieldCheck}>
              {user.roleName}
            </Badge>
            <Badge variant={user.isActive ? "success" : "danger"} dot>
              {user.isActive ? "Activo" : "Inactivo"}
            </Badge>
            <span className="inline-flex items-center gap-1.5">
              <Mail size={14} aria-hidden="true" />
              {user.email}
            </span>
            {user.phoneNumber && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} aria-hidden="true" />
                {user.phoneNumber}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} aria-hidden="true" />
              Miembro desde {formatDate(user.createdAt)}
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={20} className="text-primary" />
                Habilidades
                <Badge variant="default">{skills.length}</Badge>
              </h2>
              {validatedCount > 0 && (
                <span className="text-xs text-emerald-500">
                  {validatedCount} validadas
                </span>
              )}
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-8">
                <Award size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Sin habilidades declaradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {skills
                  .sort((a, b) => b.level - a.level)
                  .map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-2 rounded-full ${getLevelColor(skill.level)}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {skill.skillName}
                          </p>
                          {skill.experienceDescription && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md truncate">
                              {skill.experienceDescription}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            skill.level >= 4
                              ? "success"
                              : skill.level >= 3
                              ? "info"
                              : "default"
                          }
                        >
                          {skill.level} — {skillLevelLabel(skill.level)}
                        </Badge>
                        {skill.lastValidatedAt ? (
                          <span title={`Validado por ${skill.validatedByName || "manager"}`}>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          </span>
                        ) : (
                          <span title="Pendiente de validación">
                            <Clock size={14} className="text-amber-400" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {perms && (
            <Card>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-indigo-500" />
                Roles y Permisos
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">
                    Roles asignados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {perms.roles.length > 0 ? (
                      perms.roles.map((r) => (
                        <Badge key={r.name} variant="purple">
                          {r.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">Sin roles</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">
                    Permisos ({perms.effectivePermissions.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {perms.effectivePermissions.map((p) => (
                      <div
                        key={p.code}
                        className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded text-slate-600 dark:text-slate-400"
                      >
                        {p.code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Star size={20} className="text-amber-500" />
              Resumen
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Total skills</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {skills.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Validadas</span>
                <span className="text-sm font-bold text-emerald-500">
                  {validatedCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Nivel promedio</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {skills.length > 0
                    ? (
                        skills.reduce((a, s) => a + s.level, 0) / skills.length
                      ).toFixed(1)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Skill más fuerte</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {skills.length > 0
                    ? skills.sort((a, b) => b.level - a.level)[0].skillName
                    : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

