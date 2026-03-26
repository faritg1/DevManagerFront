import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Users,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Medal,
} from "lucide-react";
import { Badge, Button, Avatar, Modal } from "../../../shared/ui";
import { agentService, projectsService } from "../../../shared/api";
import type { MatchCandidatesResponse, CandidateMatch } from "../../../shared/api/types";
import { useNotification } from "../../../shared/context";

interface ProjectMatchingModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-indigo-600 dark:text-indigo-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const getScoreBadgeClass = (score: number): string => {
  if (score >= 90) return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30";
  if (score >= 70) return "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30";
  if (score >= 50) return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30";
  return "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30";
};

export const ProjectMatchingModal: React.FC<ProjectMatchingModalProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const { showNotification } = useNotification();
  const [matchingResults, setMatchingResults] = useState<MatchCandidatesResponse | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const minMatchScore = 70;

  const handleMatch = async () => {
    setIsMatching(true);
    setMatchingResults(null);
    setMatchingError(null);

    try {
      const response = await agentService.matchCandidates({
        projectId,
        minScore: minMatchScore,
        requireApproval: false,
      });

      if (response.success && response.data) {
        setMatchingResults(response.data);
        if (response.data.candidates.length === 0) {
          showNotification({
            type: "warning",
            message: "No se encontraron candidatos que cumplan el puntaje mínimo",
          });
        }
      } else {
        const errorMsg = response.message || "Error al buscar candidatos";
        const isServerOverloaded =
          errorMsg.includes("interno") ||
          errorMsg.includes("INTERNAL_ERROR") ||
          errorMsg.includes("saturado");
        setMatchingError(
          isServerOverloaded
            ? "El servidor está procesando muchas solicitudes. Intenta nuevamente en unos segundos."
            : errorMsg
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage.includes("timeout") || errorMessage.includes("ECONNABORTED")) {
        setMatchingError("El análisis está tomando más tiempo del esperado. El servidor puede estar sobrecargado.");
      } else if (errorMessage.includes("Network") || errorMessage.includes("ECONNREFUSED")) {
        setMatchingError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        setMatchingError("Error al conectar con el agente IA. Intenta nuevamente.");
      }
    } finally {
      setIsMatching(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !matchingResults && !isMatching && !matchingError) {
      handleMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApply = async (candidateUserId: string, candidateName: string) => {
    setIsApplying(true);
    try {
      const response = await projectsService.apply(projectId, {
        message: `Postulación recomendada por IA — Candidato: ${candidateName}`,
      });
      if (response.success) {
        showNotification({ type: "success", message: "Postulación enviada correctamente." });
        onClose();
      } else {
        showNotification({ type: "error", message: response.message || "Error al postularse" });
      }
    } catch {
      showNotification({ type: "error", message: "Error al conectar con el servidor" });
    } finally {
      setIsApplying(false);
    }
  };

  const getCandidateStats = () => {
    if (!matchingResults) return { total: 0, above90: 0, avgScore: 0, bestMatch: null as CandidateMatch | null };
    const candidates = matchingResults.candidates;
    const total = candidates.length;
    const above90 = candidates.filter((c) => c.matchScore >= 90).length;
    const avgScore = total > 0 ? candidates.reduce((acc, c) => acc + c.matchScore, 0) / total : 0;
    return { total, above90, avgScore, bestMatch: candidates[0] ?? null };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidatos sugeridos por IA"
      icon={<Sparkles className="text-indigo-500" size={20} />}
      size="4xl"
    >
      <div className="space-y-5">

        {/* Loading */}
        {isMatching && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">Analizando perfiles con IA...</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Esto puede tardar unos segundos</p>
          </div>
        )}

        {/* Error */}
        {!isMatching && matchingError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <AlertCircle className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-1">No se pudo completar el análisis</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-5">{matchingError}</p>
            <Button variant="primary" onClick={() => { setMatchingError(null); handleMatch(); }} icon={RefreshCw}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Results */}
        {!isMatching && !matchingError && matchingResults && (() => {
          const stats = getCandidateStats();
          return (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Candidatos", value: stats.total, icon: <Users size={16} className="text-slate-500" /> },
                  { label: "Excelentes (≥90%)", value: stats.above90, icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
                  { label: "Score promedio", value: `${stats.avgScore.toFixed(0)}%`, icon: <TrendingUp size={16} className="text-indigo-500" /> },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{item.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analysis narrative */}
              {matchingResults.analysisNarrative && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={15} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Análisis de la IA</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {matchingResults.analysisNarrative}
                  </p>
                </div>
              )}

              {/* Empty state */}
              {matchingResults.candidates.length === 0 ? (
                <div className="text-center py-10">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 inline-block mb-3">
                    <Users className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Sin candidatos con score ≥ {minMatchScore}%</p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Considera reducir el puntaje mínimo requerido</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ranking — {matchingResults.candidates.length} candidatos
                  </p>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {matchingResults.candidates.map((candidate, idx) => {
                      const strengths = candidate.skillAlignments.filter((s) => s.meets);
                      const gaps = candidate.skillAlignments.filter((s) => !s.meets);
                      const mandatoryMet = candidate.skillAlignments.filter((s) => s.isMandatory && s.meets).length;
                      const mandatoryTotal = candidate.skillAlignments.filter((s) => s.isMandatory).length;
                      const isBest = idx === 0;

                      return (
                        <div
                          key={candidate.userId}
                          className={`rounded-xl bg-white dark:bg-slate-800/60 border transition-shadow hover:shadow-md ${
                            isBest
                              ? "border-indigo-300 dark:border-indigo-500/40 shadow-sm"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {/* Card header */}
                          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="relative shrink-0">
                              <Avatar name={candidate.fullName} size="md" />
                              {isBest && (
                                <div className="absolute -top-1.5 -right-1.5 p-1 bg-indigo-500 rounded-full">
                                  <Medal className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{candidate.fullName}</p>
                                {isBest && (
                                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full shrink-0">
                                    Mejor candidato
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{candidate.email}</p>
                            </div>

                            {/* Score badge */}
                            <div className={`px-3 py-2 rounded-lg shrink-0 text-center ${getScoreBadgeClass(candidate.matchScore)}`}>
                              <p className={`text-2xl font-black leading-none ${getScoreColor(candidate.matchScore)}`}>
                                {candidate.matchScore}%
                              </p>
                              <p className="text-xs opacity-70 mt-0.5">match</p>
                            </div>
                          </div>

                          {/* Skill stats */}
                          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-700 text-center">
                            <div className="py-3 px-4">
                              <p className={`text-lg font-black ${mandatoryMet === mandatoryTotal ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                {mandatoryMet}/{mandatoryTotal}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Obligatorias cubiertas</p>
                            </div>
                            <div className="py-3 px-4">
                              <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                                {strengths.length}/{candidate.skillAlignments.length}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Skills cumplidas</p>
                            </div>
                          </div>

                          {/* Skills breakdown */}
                          <div className="p-4 space-y-3">
                            {strengths.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Fortalezas</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {strengths.slice(0, 6).map((s, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium">
                                      {s.skillName} · Lv.{s.currentLevel}
                                    </span>
                                  ))}
                                  {strengths.length > 6 && (
                                    <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                      +{strengths.length - 6}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {gaps.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <XCircle size={13} className="text-slate-400 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Brechas</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {gaps.slice(0, 6).map((g, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded-md font-medium border ${
                                      g.isMandatory
                                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600"
                                    }`}>
                                      {g.skillName} · {g.currentLevel}/{g.requiredLevel}
                                    </span>
                                  ))}
                                  {gaps.length > 6 && (
                                    <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                      +{gaps.length - 6}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Recommendation reason */}
                            {candidate.recommendationReason && (
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 select-none">
                                  <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                                  Ver análisis de la IA
                                </summary>
                                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-1 border-l-2 border-indigo-200 dark:border-indigo-500/30 ml-1 pl-3">
                                  {candidate.recommendationReason}
                                </p>
                              </details>
                            )}

                            {/* Apply button — best candidate only */}
                            {isBest && (
                              <Button
                                variant="primary"
                                onClick={() => handleApply(candidate.userId, candidate.fullName)}
                                disabled={isApplying}
                                className="w-full mt-1"
                                icon={isApplying ? Loader2 : CheckCircle2}
                              >
                                {isApplying ? "Enviando postulación..." : "Postularme como candidato principal"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </Modal>
  );
};