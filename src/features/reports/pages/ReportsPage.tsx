import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart2,
  Users,
  Briefcase,
  Code2,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  Loader2,
  Globe,
  Building2,
  Sparkles,
  Bot,
  Send,
  RefreshCw,
} from "lucide-react";
import {
  projectsService,
  usersService,
  skillsService,
} from "../../../shared/api";
import type {
  ProjectResponse,
  UserResponse,
  SkillDto,
  EmployeeSkillResponse,
  SkillRequirementResponse,
  ProjectStatus,
} from "../../../shared/api/types";
import { useConfig } from "../../../shared/context";
import { Card, Badge, Button, StatCard } from "../../../shared/ui";

// ─── Types ────────────────────────────────────────────────
interface SkillDistribution {
  name: string;
  category: string | null;
  count: number;
  avgLevel: number;
  maxLevel: number;
}

interface SkillGap {
  projectName: string;
  projectId: string;
  skillName: string;
  requiredLevel: number;
  bestAvailableLevel: number;
  isMandatory: boolean;
  deficit: number;
}

interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

// ─── Component ────────────────────────────────────────────
export const ReportsPage: React.FC = () => {
  const { catalogs } = useConfig();

  // Loading + data states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [allSkills, setAllSkills] = useState<SkillDto[]>([]);
  const [employeeSkillsMap, setEmployeeSkillsMap] = useState<
    Record<string, EmployeeSkillResponse[]>
  >({});
  const [projectReqsMap, setProjectReqsMap] = useState<
    Record<string, SkillRequirementResponse[]>
  >({});

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    distribution: true,
    gaps: true,
    categories: true,
    team: true,
  });

  const toggleSection = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // ─── Data fetching ──────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Phase 1: Load base data in parallel
      const [usersRes, projectsRes, skillsRes] = await Promise.all([
        usersService.getAll(),
        projectsService.getAll(),
        skillsService.getAll(),
      ]);

      if (!usersRes.success || !projectsRes.success || !skillsRes.success) {
        setError("Error al cargar datos base");
        return;
      }

      const usersData = usersRes.data || [];
      const projectsData = projectsRes.data || [];
      const skillsData = skillsRes.data || [];

      setUsers(usersData);
      setProjects(projectsData);
      setAllSkills(skillsData);

      // Phase 2: Load employee skills for all users + project requirements
      const activeProjects = projectsData.filter((p) => p.status === 1); // Active

      const [empSkillResults, reqResults] = await Promise.all([
        // Skills of each user
        Promise.all(
          usersData.map((u) =>
            skillsService
              .getEmployeeSkills(u.id)
              .then((res) => ({
                userId: u.id,
                skills: res.success && res.data ? res.data : [],
              }))
              .catch(() => ({ userId: u.id, skills: [] as EmployeeSkillResponse[] }))
          )
        ),
        // Requirements of active projects
        Promise.all(
          activeProjects.map((p) =>
            projectsService
              .getRequirements(p.id)
              .then((res) => ({
                projectId: p.id,
                reqs: res.success && res.data ? res.data : [],
              }))
              .catch(() => ({ projectId: p.id, reqs: [] as SkillRequirementResponse[] }))
          )
        ),
      ]);

      const empMap: Record<string, EmployeeSkillResponse[]> = {};
      empSkillResults.forEach(({ userId, skills }) => {
        empMap[userId] = skills;
      });
      setEmployeeSkillsMap(empMap);

      const reqMap: Record<string, SkillRequirementResponse[]> = {};
      reqResults.forEach(({ projectId, reqs }) => {
        reqMap[projectId] = reqs;
      });
      setProjectReqsMap(reqMap);
    } catch (err) {
      console.error("Reports data load error:", err);
      setError("Error de conexión al cargar reportes");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Computed: Skill Distribution ───────────────────────
  const skillDistribution = useMemo<SkillDistribution[]>(() => {
    const map = new Map<
      string,
      { name: string; category: string | null; levels: number[] }
    >();

    (Object.values(employeeSkillsMap) as EmployeeSkillResponse[][]).forEach((skills) => {
      skills.forEach((s) => {
        const existing = map.get(s.skillName);
        if (existing) {
          existing.levels.push(s.level);
        } else {
          // Find category from catalog
          const catalogSkill = allSkills.find((cs) => cs.id === s.skillId);
          map.set(s.skillName, {
            name: s.skillName,
            category: catalogSkill?.category || null,
            levels: [s.level],
          });
        }
      });
    });

    return Array.from(map.values())
      .map((item) => ({
        name: item.name,
        category: item.category,
        count: item.levels.length,
        avgLevel: +(item.levels.reduce((a, b) => a + b, 0) / item.levels.length).toFixed(1),
        maxLevel: Math.max(...item.levels),
      }))
      .sort((a, b) => b.count - a.count);
  }, [employeeSkillsMap, allSkills]);

  // ─── Computed: Skill Gaps ───────────────────────────────
  const skillGaps = useMemo<SkillGap[]>(() => {
    const gaps: SkillGap[] = [];
    const activeProjects = projects.filter((p) => p.status === 1);

    // Build a map: skillId -> best level among all employees
    const bestLevelBySkill = new Map<string, number>();
    (Object.values(employeeSkillsMap) as EmployeeSkillResponse[][]).forEach((skills) => {
      skills.forEach((s) => {
        const current = bestLevelBySkill.get(s.skillId) || 0;
        if (s.level > current) bestLevelBySkill.set(s.skillId, s.level);
      });
    });

    activeProjects.forEach((project) => {
      const reqs = projectReqsMap[project.id] || [];
      reqs.forEach((req) => {
        const bestAvailable = bestLevelBySkill.get(req.skillId) || 0;
        if (bestAvailable < req.requiredLevel) {
          gaps.push({
            projectName: project.name,
            projectId: project.id,
            skillName: req.skillName,
            requiredLevel: req.requiredLevel,
            bestAvailableLevel: bestAvailable,
            isMandatory: req.isMandatory,
            deficit: req.requiredLevel - bestAvailable,
          });
        }
      });
    });

    return gaps.sort((a, b) => {
      // Mandatory first, then by deficit desc
      if (a.isMandatory !== b.isMandatory) return a.isMandatory ? -1 : 1;
      return b.deficit - a.deficit;
    });
  }, [projects, projectReqsMap, employeeSkillsMap]);

  // ─── Computed: Category stats ───────────────────────────
  const categoryStats = useMemo<CategoryStat[]>(() => {
    const catMap = new Map<string, number>();
    skillDistribution.forEach((s) => {
      const cat = s.category || "Sin categoría";
      catMap.set(cat, (catMap.get(cat) || 0) + s.count);
    });
    const total = Array.from(catMap.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(catMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [skillDistribution]);

  // ─── Computed: Team stats ───────────────────────────────
  const teamStats = useMemo(() => {
    const totalEmployees = users.length;
    const allEmployeeSkills = Object.values(employeeSkillsMap) as EmployeeSkillResponse[][];
    const employeesWithSkills = allEmployeeSkills.filter(
      (s) => s.length > 0
    ).length;
    const totalDeclarations: number = allEmployeeSkills.reduce(
      (acc, s) => acc + s.length,
      0
    );
    const validated: number = allEmployeeSkills.reduce(
      (acc, skills) => acc + skills.filter((s) => s.lastValidatedAt).length,
      0
    );
    const avgSkillsPerEmployee = totalEmployees
      ? +(totalDeclarations / totalEmployees).toFixed(1)
      : 0;
    const validationRate = totalDeclarations
      ? Math.round((validated / totalDeclarations) * 100)
      : 0;

    return {
      totalEmployees,
      employeesWithSkills,
      employeesWithout: totalEmployees - employeesWithSkills,
      totalDeclarations,
      validated,
      avgSkillsPerEmployee,
      validationRate,
    };
  }, [users, employeeSkillsMap]);

  // ─── Summary stats ─────────────────────────────────────
  const summaryStats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 1).length;
    const totalReqs = (Object.values(projectReqsMap) as SkillRequirementResponse[][]).reduce(
      (acc, r) => acc + r.length,
      0
    );
    return {
      activeProjects,
      totalReqs,
      gapsCount: skillGaps.length,
      mandatoryGaps: skillGaps.filter((g) => g.isMandatory).length,
    };
  }, [projects, projectReqsMap, skillGaps]);

  // ─── Level label helper ─────────────────────────────────
  const getLevelLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: "Básico",
      2: "Intermedio",
      3: "Competente",
      4: "Avanzado",
      5: "Experto",
    };
    return labels[level] || `Nivel ${level}`;
  };

  const getLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      1: "bg-slate-400",
      2: "bg-blue-400",
      3: "bg-emerald-400",
      4: "bg-purple-500",
      5: "bg-amber-500",
    };
    return colors[level] || "bg-slate-400";
  };

  // ─── Section Header component ───────────────────────────
  const SectionHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    section: string;
    badge?: string;
  }> = ({ title, icon, section, badge }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-2 group"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        {badge && (
          <Badge variant="default" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp size={20} className="text-slate-400" />
      ) : (
        <ChevronDown size={20} className="text-slate-400" />
      )}
    </button>
  );

  // ─── Loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        <div className="h-60 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
          {error}
        </p>
        <Button variant="outline" icon={RefreshCw} onClick={loadData}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={24} className="text-primary" />
            Reportes y Analítica
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análisis de habilidades, brechas de capacitación y métricas de equipo
          </p>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={loadData}>
          Actualizar datos
        </Button>
      </div>

      {/* ─── Summary Stats ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Miembros"
          value={teamStats.totalEmployees}
          icon={Users}
          iconColor="text-indigo-500"
          iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
          trend={{
            value: `${teamStats.employeesWithSkills} con skills`,
            isPositive: true,
          }}
        />
        <StatCard
          title="Skills Declaradas"
          value={teamStats.totalDeclarations}
          icon={Award}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-50 dark:bg-purple-500/10"
          trend={{
            value: `${teamStats.avgSkillsPerEmployee} prom/miembro`,
            isPositive: teamStats.avgSkillsPerEmployee >= 2,
          }}
        />
        <StatCard
          title="Brechas Detectadas"
          value={summaryStats.gapsCount}
          icon={AlertTriangle}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50 dark:bg-amber-500/10"
          trend={
            summaryStats.mandatoryGaps > 0
              ? {
                  value: `${summaryStats.mandatoryGaps} obligatorias`,
                  isPositive: false,
                }
              : { value: "Sin brechas críticas", isPositive: true }
          }
        />
        <StatCard
          title="Tasa Validación"
          value={`${teamStats.validationRate}%`}
          icon={Target}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
          trend={{
            value: `${teamStats.validated} de ${teamStats.totalDeclarations}`,
            isPositive: teamStats.validationRate >= 50,
          }}
        />
      </div>

      {/* ─── Skill Distribution ─────────────────────── */}
      <Card>
        <SectionHeader
          title="Distribución de Habilidades"
          icon={<TrendingUp size={20} className="text-primary" />}
          section="distribution"
          badge={`${skillDistribution.length} skills`}
        />
        {expandedSections.distribution && (
          <div className="mt-4 space-y-3">
            {skillDistribution.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No hay habilidades declaradas aún
              </p>
            ) : (
              <>
                {skillDistribution.slice(0, 15).map((skill) => (
                  <div key={skill.name} className="flex items-center gap-4">
                    {/* Skill name + category */}
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {skill.name}
                      </p>
                      {skill.category && (
                        <p className="text-xs text-slate-400 truncate">
                          {skill.category}
                        </p>
                      )}
                    </div>

                    {/* Bar */}
                    <div className="flex-1 relative">
                      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 flex items-center justify-end px-2"
                          style={{
                            width: `${Math.min(
                              (skill.count /
                                Math.max(
                                  ...skillDistribution.map((s) => s.count),
                                  1
                                )) *
                                100,
                              100
                            )}%`,
                            minWidth: "2rem",
                          }}
                        >
                          <span className="text-[10px] font-bold text-white">
                            {skill.count}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Avg level */}
                    <div className="w-24 shrink-0 text-right">
                      <Badge
                        variant={
                          skill.avgLevel >= 4
                            ? "success"
                            : skill.avgLevel >= 3
                            ? "info"
                            : skill.avgLevel >= 2
                            ? "warning"
                            : "default"
                        }
                      >
                        Prom: {skill.avgLevel}
                      </Badge>
                    </div>
                  </div>
                ))}

                {skillDistribution.length > 15 && (
                  <p className="text-xs text-slate-400 text-center pt-2">
                    Mostrando top 15 de {skillDistribution.length} skills
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* ─── Skill Gaps Analysis ────────────────────── */}
      <Card>
        <SectionHeader
          title="Brechas de Capacitación"
          icon={<AlertTriangle size={20} className="text-amber-500" />}
          section="gaps"
          badge={
            skillGaps.length > 0
              ? `${skillGaps.length} brechas`
              : "Sin brechas"
          }
        />
        {expandedSections.gaps && (
          <div className="mt-4">
            {skillGaps.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-3">
                  <Target size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  No se detectaron brechas de habilidades
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Todos los proyectos activos tienen cobertura de skills
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-2 text-xs font-bold uppercase text-slate-400">
                        Proyecto
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-slate-400">
                        Skill Requerida
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-slate-400 text-center">
                        Requerido
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-slate-400 text-center">
                        Disponible
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-slate-400 text-center">
                        Déficit
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-slate-400 text-center">
                        Prioridad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {skillGaps.map((gap, idx) => (
                      <tr
                        key={`${gap.projectId}-${gap.skillName}-${idx}`}
                        className="hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium">
                          {gap.projectName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {gap.skillName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <span
                              className={`size-2 rounded-full ${getLevelColor(
                                gap.requiredLevel
                              )}`}
                            />
                            {gap.requiredLevel} - {getLevelLabel(gap.requiredLevel)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {gap.bestAvailableLevel === 0 ? (
                            <span className="text-sm text-slate-400 italic">
                              Nadie
                            </span>
                          ) : (
                            <span className="text-sm">
                              {gap.bestAvailableLevel} -{" "}
                              {getLevelLabel(gap.bestAvailableLevel)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              gap.deficit >= 3
                                ? "danger"
                                : gap.deficit >= 2
                                ? "warning"
                                : "info"
                            }
                          >
                            -{gap.deficit}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={gap.isMandatory ? "danger" : "default"}
                            dot
                          >
                            {gap.isMandatory ? "Obligatoria" : "Deseable"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ─── Category Distribution ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader
            title="Distribución por Categoría"
            icon={<Code2 size={20} className="text-purple-500" />}
            section="categories"
            badge={`${categoryStats.length} categorías`}
          />
          {expandedSections.categories && (
            <div className="mt-4 space-y-3">
              {categoryStats.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Sin datos disponibles
                </p>
              ) : (
                categoryStats.map((stat) => (
                  <div key={stat.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {stat.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {stat.count} ({stat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        {/* Team Overview */}
        <Card>
          <SectionHeader
            title="Métricas de Equipo"
            icon={<Users size={20} className="text-indigo-500" />}
            section="team"
          />
          {expandedSections.team && (
            <div className="mt-4 space-y-4">
              {/* Skills coverage */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Cobertura de skills
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {teamStats.totalEmployees > 0
                      ? Math.round(
                          (teamStats.employeesWithSkills /
                            teamStats.totalEmployees) *
                            100
                        )
                      : 0}
                    %
                  </span>
                  <span className="text-xs text-slate-400">
                    ({teamStats.employeesWithSkills}/{teamStats.totalEmployees})
                  </span>
                </div>
              </div>

              {/* Avg skills */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Promedio skills/miembro
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {teamStats.avgSkillsPerEmployee}
                </span>
              </div>

              {/* Validation rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Tasa de validación
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {teamStats.validationRate}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      teamStats.validationRate >= 70
                        ? "bg-emerald-500"
                        : teamStats.validationRate >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${teamStats.validationRate}%` }}
                  />
                </div>
              </div>

              {/* Employees without skills warning */}
              {teamStats.employeesWithout > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {teamStats.employeesWithout} miembros sin habilidades declaradas
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/60">
                      Recomiéndales completar su perfil de skills
                    </p>
                  </div>
                </div>
              )}

              {/* Skill catalog info */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Skills en catálogo
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="info" icon={Globe}>
                    {allSkills.filter((s) => s.skillType === 0).length} globales
                  </Badge>
                  <Badge variant="warning" icon={Building2}>
                    {allSkills.filter((s) => s.skillType === 1).length} org
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
