import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  BarChart2,
  Users,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { reportsService } from "../../../shared/api";
import type {
  SkillDistributionResponse,
  ProjectMetricsResponse,
  EmployeeUtilizationResponse,
  DepartmentMetricsResponse,
} from "../../../shared/api/types";
import { Card, Badge, Button, StatCard, PageContainer, PageHeader } from "../../../shared/ui";
import { EducationCoverageCard } from "../components/EducationCoverageCard";

export const ReportsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [skillDistribution, setSkillDistribution] = useState<SkillDistributionResponse[]>([]);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetricsResponse | null>(null);
  const [utilization, setUtilization] = useState<EmployeeUtilizationResponse | null>(null);
  const [department, setDepartment] = useState<DepartmentMetricsResponse | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    distribution: true,
    projects: true,
    experience: true,
    team: true,
  });

  const toggleSection = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [distRes, projRes, utilRes, deptRes] = await Promise.all([
        reportsService.getSkillsDistribution(),
        reportsService.getProjectMetrics(),
        reportsService.getEmployeeUtilization(),
        reportsService.getDepartmentMetrics(),
      ]);

      if (!distRes.success || !projRes.success || !utilRes.success || !deptRes.success) {
        setError("Error al cargar datos de reportes");
        return;
      }

      setSkillDistribution(
        [...(distRes.data || [])].sort((a, b) => b.totalEmployees - a.totalEmployees)
      );
      setProjectMetrics(projRes.data ?? null);
      setUtilization(utilRes.data ?? null);
      setDepartment(deptRes.data ?? null);
    } catch (err) {
      console.error("Reports data load error:", err);
      setError("Error de conexión al cargar reportes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAiSummary = useCallback(async () => {
    setAiSummaryLoading(true);
    try {
      const aiRes = await reportsService.getAiSummary();
      if (aiRes.success && aiRes.data?.markdown) {
        setAiSummary(aiRes.data.markdown);
      }
    } catch (aiErr) {
      console.error("AI summary load error:", aiErr);
    } finally {
      setAiSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadAiSummary();
  }, [loadData, loadAiSummary]);

  const handleRefresh = useCallback(() => {
    loadData();
    loadAiSummary();
  }, [loadData, loadAiSummary]);

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

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
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

  if (error || !projectMetrics || !utilization || !department) {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
          {error || "No hay datos de reportes disponibles"}
        </p>
        <Button variant="outline" icon={RefreshCw} onClick={handleRefresh}>
          Reintentar
        </Button>
      </div>
    );
  }

  const maxSkillCount = Math.max(...skillDistribution.map((s) => s.totalEmployees), 1);
  const maxDemand = Math.max(
    ...projectMetrics.mostDemandedSkills.map((s) => s.requiredInProjects),
    1
  );
  const experienceRows = [
    { label: "Junior (0-2 años)", count: department.experienceDistribution.junior },
    { label: "Mid-level (3-5 años)", count: department.experienceDistribution.midLevel },
    { label: "Senior (6-10 años)", count: department.experienceDistribution.senior },
    { label: "Lead (11+ años)", count: department.experienceDistribution.lead },
  ];
  const experienceTotal = experienceRows.reduce((acc, r) => acc + r.count, 0) || 1;
  const utilizationRate = Math.round(utilization.utilizationRate);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        icon={<BarChart2 size={28} className="text-primary" />}
        title="Reportes y Analítica"
        description="Análisis de habilidades, proyectos y métricas de equipo"
        actions={
        <Button variant="outline" icon={RefreshCw} onClick={handleRefresh}>
          Actualizar datos
        </Button>
        }
      />

      <EducationCoverageCard />

      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-blue-500/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Insights de IA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Análisis automático generado por IA
              </p>
            </div>
          </div>
          {aiSummaryLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Cargando...
            </div>
          )}
        </div>
        {aiSummary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              <ReactMarkdown>{aiSummary}</ReactMarkdown>
            </div>
          </div>
        ) : aiSummaryLoading ? (
          <div className="text-center py-6">
            <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generando insights...
            </p>
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No pudimos generar insights en este momento. Intenta más tarde.
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
        title="Miembros"
          value={department.totalEmployees}
        icon={Users}
          iconColor="text-indigo-500"
          iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
          trend={{
            value: `${department.activeEmployees} activos`,
            isPositive: true,
          }}
        />
        <StatCard
        title="Skills Únicas"
          value={department.totalUniqueSkills}
        icon={Award}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-50 dark:bg-purple-500/10"
          trend={{
            value: `${department.averageSkillsPerEmployee} prom/miembro`,
            isPositive: department.averageSkillsPerEmployee >= 2,
          }}
        />
        <StatCard
        title="Proyectos en Riesgo"
          value={projectMetrics.projectsAtRisk}
        icon={AlertTriangle}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50 dark:bg-amber-500/10"
          trend={
            projectMetrics.projectsAtRisk > 0
              ? {
                  value: `de ${projectMetrics.totalActiveProjects} activos`,
                  isPositive: false,
                }
              : { value: "Sin proyectos en riesgo", isPositive: true }
        }
        />
        <StatCard
        title="Utilización"
          value={`${utilizationRate}%`}
        icon={Target}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
          trend={{
            value: `${utilization.allocatedEmployees} de ${utilization.totalEmployees} asignados`,
            isPositive: utilizationRate >= 50,
          }}
        />
      </div>

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
                  <div key={skill.skillName} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {skill.skillName}
                      </p>
                    </div>

                    <div className="flex-1 relative">
                      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 flex items-center justify-end px-2"
                          style={{
                            width: `${Math.min((skill.totalEmployees / maxSkillCount) * 100, 100)}%`,
                            minWidth: "2rem",
                          }}
                        >
                          <span className="text-[10px] font-bold text-white">
                            {skill.totalEmployees}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-24 shrink-0 text-right">
                      <Badge
                        variant={
                          skill.averageLevel >= 4
                            ? "success"
                            : skill.averageLevel >= 3
                            ? "info"
                            : skill.averageLevel >= 2
                            ? "warning"
                            : "default"
                        }
                      >
                        Prom: {+skill.averageLevel.toFixed(1)}
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

      <Card>
        <SectionHeader
        title="Demanda de Habilidades en Proyectos"
        icon={<Briefcase size={20} className="text-amber-500" />}
          section="projects"
          badge={`${projectMetrics.totalActiveProjects} proyectos activos`}
        />
        {expandedSections.projects && (
          <div className="mt-4 space-y-3">
            {projectMetrics.mostDemandedSkills.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No hay requisitos de habilidades en proyectos activos
              </p>
            ) : (
              projectMetrics.mostDemandedSkills.map((skill) => (
                <div key={skill.skillName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {skill.skillName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {skill.requiredInProjects} proyecto(s)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${(skill.requiredInProjects / maxDemand) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader
            title="Distribución por Experiencia"
            icon={<Award size={20} className="text-purple-500" />}
            section="experience"
          />
          {expandedSections.experience && (
            <div className="mt-4 space-y-3">
              {experienceRows.map((row) => {
                const percentage = Math.round((row.count / experienceTotal) * 100);
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {row.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Métricas de Equipo"
            icon={<Users size={20} className="text-indigo-500" />}
            section="team"
          />
          {expandedSections.team && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Promedio skills/miembro
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {department.averageSkillsPerEmployee}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Miembros con skills validadas
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {department.employeesWithCertifications}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Promedio años de experiencia
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {department.averageYearsExperience}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Promedio proyectos/miembro asignado
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {utilization.averageProjectsPerEmployee}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Tasa de utilización
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {utilizationRate}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      utilizationRate >= 70
                        ? "bg-emerald-500"
                        : utilizationRate >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>
              </div>

              {utilization.unallocatedEmployees > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {utilization.unallocatedEmployees} miembros sin proyectos asignados
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/60">
                      Disponibles para nuevas asignaciones
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

