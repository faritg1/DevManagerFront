import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Users,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { Badge, Button, Avatar, Modal } from "../../../shared/ui";
import { agentService } from "../../../shared/api";
import type { MatchCandidatesResponse, CandidateMatch } from "../../../shared/api/types";
import { useNotification } from "../../../shared/context";

interface ProjectMatchingModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-emerald-500";
  if (score >= 70) return "text-blue-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
};

const getScoreBg = (score: number): string => {
  if (score >= 90) return "bg-emerald-50 dark:bg-emerald-500/10";
  if (score >= 70) return "bg-blue-50 dark:bg-blue-500/10";
  if (score >= 50) return "bg-amber-50 dark:bg-amber-500/10";
  return "bg-rose-50 dark:bg-rose-500/10";
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
            ? "El servidor está procesando muchas solicitudes. Por favor, intenta nuevamente en unos segundos."
            : errorMsg
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "";
      const isTimeout =
        errorMessage.includes("timeout") || errorMessage.includes("ECONNABORTED");
      const isNetworkError =
        errorMessage.includes("Network") || errorMessage.includes("ECONNREFUSED");

      if (isTimeout) {
        setMatchingError(
          "El análisis está tomando más tiempo del esperado. El servidor puede estar sobrecargado."
        );
      } else if (isNetworkError) {
        setMatchingError("No se pudo conectar con el servidor. Verifica tu conexión a internet.");
      } else {
        setMatchingError("Error al conectar con el agente IA. Por favor, intenta nuevamente.");
      }
    } finally {
      setIsMatching(false);
    }
  };

  // Auto-start matching when opened
  React.useEffect(() => {
    if (isOpen && !matchingResults && !isMatching && !matchingError) {
      handleMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getCandidateStats = () => {
    if (!matchingResults) return { total: 0, above90: 0, avgScore: 0, bestMatch: null as CandidateMatch | null };
    const candidates = matchingResults.candidates;
    const total = candidates.length;
    const above90 = candidates.filter((c) => c.matchScore >= 90).length;
    const avgScore =
      total > 0 ? candidates.reduce((acc, c) => acc + c.matchScore, 0) / total : 0;
    const bestMatch = candidates.length > 0 ? candidates[0] : null;
    return { total, above90, avgScore, bestMatch };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidatos Sugeridos por IA"
      icon={<Sparkles className="text-purple-500" size={20} />}
      size="lg"
    >
      <div className="space-y-6">
        {/* Loading */}
        {isMatching && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">
              Analizando perfiles con IA...
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              Esto puede tomar unos segundos
            </p>
          </div>
        )}

        {/* Error State */}
        {!isMatching && matchingError && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-500/10 mb-4">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-center font-medium mb-2">
              No se pudo completar el análisis
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-md mb-4">
              {matchingError}
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setMatchingError(null);
                handleMatch();
              }}
              icon={RefreshCw}
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Results */}
        {!isMatching &&
          !matchingError &&
          matchingResults &&
          (() => {
            const stats = getCandidateStats();
            return (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.total}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Candidatos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.above90}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Score +90%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.avgScore.toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Score Promedio</p>
                  </div>
                </div>

                {/* Best Match */}
                {stats.bestMatch && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="text-purple-500" size={18} />
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        Mejor Candidato
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {stats.bestMatch.fullName} con {stats.bestMatch.matchScore}% de compatibilidad
                    </p>
                  </div>
                )}

                {/* Analysis Narrative */}
                {matchingResults.analysisNarrative && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1419] border border-slate-200 dark:border-[#233948]">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="text-purple-500" size={16} />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Análisis de la IA
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                      {matchingResults.analysisNarrative.length > 500
                        ? matchingResults.analysisNarrative.substring(0, 500) + "..."
                        : matchingResults.analysisNarrative}
                    </p>
                  </div>
                )}

                {/* Candidates List */}
                {matchingResults.candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-500/10 inline-block mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      No se encontraron candidatos con score mínimo de {minMatchScore}%
                    </p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                      Intenta reducir el puntaje mínimo requerido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Ranking de Candidatos ({matchingResults.candidates.length})
                    </h4>

                    {matchingResults.candidates.map((candidate, idx) => {
                      const strengths = candidate.skillAlignments.filter((s) => s.meets);
                      const gaps = candidate.skillAlignments.filter((s) => !s.meets);
                      const mandatoryMet = candidate.skillAlignments.filter(
                        (s) => s.isMandatory && s.meets
                      ).length;
                      const mandatoryTotal = candidate.skillAlignments.filter(
                        (s) => s.isMandatory
                      ).length;

                      return (
                        <div
                          key={candidate.userId}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] border border-slate-200 dark:border-[#233948]"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar name={candidate.fullName} size="md" />
                                {idx === 0 && (
                                  <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full">
                                    <Star className="w-3 h-3 text-white" fill="white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {candidate.fullName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {candidate.email}
                                </p>
                              </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl ${getScoreBg(candidate.matchScore)}`}>
                              <p className={`text-2xl font-black ${getScoreColor(candidate.matchScore)}`}>
                                {candidate.matchScore}%
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="text-sm">
                              <span className="text-slate-500 dark:text-slate-400">
                                Skills Obligatorias:
                              </span>
                              <span
                                className={`ml-2 font-medium ${
                                  mandatoryMet === mandatoryTotal
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {mandatoryMet}/{mandatoryTotal}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-slate-500 dark:text-slate-400">
                                Skills Cumplidas:
                              </span>
                              <span className="ml-2 font-medium text-slate-900 dark:text-white">
                                {strengths.length}/{candidate.skillAlignments.length}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            {strengths.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                  <TrendingUp size={14} />
                                  Fortalezas ({strengths.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {strengths.slice(0, 4).map((s, i) => (
                                    <Badge key={i} variant="success" className="text-xs">
                                      {s.skillName} (Nv.{s.currentLevel})
                                    </Badge>
                                  ))}
                                  {strengths.length > 4 && (
                                    <Badge variant="default" className="text-xs">
                                      +{strengths.length - 4} más
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {gaps.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                                  <TrendingDown size={14} />
                                  Brechas ({gaps.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {gaps.slice(0, 4).map((g, i) => (
                                    <Badge key={i} variant={g.isMandatory ? "error" : "warning"} className="text-xs">
                                      {g.skillName} ({g.currentLevel}/{g.requiredLevel})
                                    </Badge>
                                  ))}
                                  {gaps.length > 4 && (
                                    <Badge variant="default" className="text-xs">
                                      +{gaps.length - 4} más
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {candidate.recommendationReason && (
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                                💡 Ver recomendación de la IA
                              </summary>
                              <div className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-[#0d1419] text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {candidate.recommendationReason}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
      </div>
    </Modal>
  );
};
