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
import { agentService, projectsService } from "../../../shared/api";
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

  const handleApply = async (candidateUserId: string, candidateName: string) => {
    setIsApplying(true);
    try {
      const response = await projectsService.apply(projectId, {
        message: `Postulación recomendada por IA - Candidato: ${candidateName}`,
      });

      if (response.success) {
        showNotification({
          type: "success",
          message: "¡Postulación exitosa! El equipo del proyecto revisará tu perfil.",
        });
        onClose();
      } else {
        showNotification({
          type: "error",
          message: response.message || "Error al postularse al proyecto",
        });
      }
    } catch (err) {
      showNotification({
        type: "error",
        message: "Error al conectar con el servidor",
      });
    } finally {
      setIsApplying(false);
    }
  };

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
      size="4xl"
    >
      <div className="space-y-6">
        {/* Loading */}
        {isMatching && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 border border-purple-200 dark:border-purple-500/30 text-center shadow-md">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="text-purple-600 dark:text-purple-400" size={20} />
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Candidatos</p>
                    </div>
                    <p className="text-4xl font-black text-purple-600 dark:text-purple-400">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-600/10 border border-emerald-200 dark:border-emerald-500/30 text-center shadow-md">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="text-emerald-600 dark:text-emerald-400" size={20} fill="currentColor" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Excelentes (+90%)</p>
                    </div>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                      {stats.above90}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 border border-blue-200 dark:border-blue-500/30 text-center shadow-md">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Score Promedio</p>
                    </div>
                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                      {stats.avgScore.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Best Match */}
                {stats.bestMatch && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-500/10 dark:via-yellow-500/10 dark:to-amber-500/10 border-2 border-amber-300 dark:border-amber-500/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-md">
                          <Award className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                            🏆 Mejor Candidato Sugerido
                          </p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {stats.bestMatch.fullName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Compatibilidad</p>
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                          {stats.bestMatch.matchScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Narrative */}
                {matchingResults.analysisNarrative && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-300 dark:border-slate-600 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                        <Sparkles className="text-purple-600 dark:text-purple-400" size={18} />
                      </div>
                      <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                        💡 Análisis Inteligente de la IA
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-1">
                      {matchingResults.analysisNarrative}
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Ranking de Candidatos ({matchingResults.candidates.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {matchingResults.candidates.map((candidate, idx) => {
                        const strengths = candidate.skillAlignments.filter((s) => s.meets);
                        const gaps = candidate.skillAlignments.filter((s) => !s.meets);
                        const mandatoryMet = candidate.skillAlignments.filter(
                          (s) => s.isMandatory && s.meets
                        ).length;
                        const mandatoryTotal = candidate.skillAlignments.filter(
                          (s) => s.isMandatory
                        ).length;
                        const isBestCandidate = idx === 0;

                        return (
                          <div
                            key={candidate.userId}
                            className={`p-6 rounded-xl bg-white dark:bg-slate-800/50 border-2 transition-all hover:shadow-xl ${
                              isBestCandidate
                                ? 'border-amber-400 dark:border-amber-500 shadow-xl shadow-amber-500/20 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-500/5 dark:to-yellow-500/5'
                                : 'border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary'
                            }`}
                          >
                            {/* Header con Avatar y Score */}
                            <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-shrink-0">
                                  <Avatar name={candidate.fullName} size="lg" />
                                  {isBestCandidate && (
                                    <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-xl animate-pulse">
                                      <Star className="w-4 h-4 text-white" fill="white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-slate-900 dark:text-white text-lg truncate">
                                      {candidate.fullName}
                                    </p>
                                    {isBestCandidate && (
                                      <Badge variant="warning" className="text-xs px-2.5 py-1 font-bold flex-shrink-0">
                                        🏆 TOP 1
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    📧 {candidate.email}
                                  </p>
                                </div>
                              </div>
                              <div className={`px-5 py-3 rounded-xl ${getScoreBg(candidate.matchScore)} flex-shrink-0 ml-3 shadow-md`}>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5 text-center font-semibold">Match</p>
                                <p className={`text-4xl font-black ${getScoreColor(candidate.matchScore)} text-center leading-none`}>
                                  {candidate.matchScore}%
                                </p>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-5">
                              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                                      <Award size={14} />
                                      Skills Obligatorias
                                    </p>
                                    <p
                                      className={`text-2xl font-black ${
                                        mandatoryMet === mandatoryTotal
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {mandatoryMet}/{mandatoryTotal}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                      mandatoryMet === mandatoryTotal 
                                        ? 'bg-emerald-200 dark:bg-emerald-500/20' 
                                        : 'bg-amber-200 dark:bg-amber-500/20'
                                    }`}>
                                      <span className="text-xl">{mandatoryMet === mandatoryTotal ? '✓' : '⚠'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/30 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1 flex items-center gap-1.5">
                                      <TrendingUp size={14} />
                                      Skills Totales
                                    </p>
                                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                      {strengths.length}/{candidate.skillAlignments.length}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-500/20 flex items-center justify-center">
                                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                        {Math.round((strengths.length / candidate.skillAlignments.length) * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Skills Section */}
                            <div className="space-y-4 mb-5">
                              {strengths.length > 0 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-500/10 dark:via-green-500/10 dark:to-emerald-500/10 border-l-4 border-emerald-500 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-emerald-500">
                                        <TrendingUp size={16} className="text-white" />
                                      </div>
                                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                                        ✅ Fortalezas Identificadas
                                      </span>
                                    </div>
                                    <Badge variant="success" className="text-xs px-3 py-1">
                                      {strengths.length} skills
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {strengths.slice(0, 6).map((s, i) => (
                                      <Badge key={i} variant="success" className="text-xs px-3 py-1.5 font-medium">
                                        {s.skillName} <span className="ml-1 font-black">Lv.{s.currentLevel}</span>
                                      </Badge>
                                    ))}
                                    {strengths.length > 6 && (
                                      <Badge variant="default" className="text-xs px-3 py-1.5">
                                        +{strengths.length - 6} más
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                              {gaps.length > 0 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-500/10 dark:via-yellow-500/10 dark:to-amber-500/10 border-l-4 border-amber-500 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-amber-500">
                                        <TrendingDown size={16} className="text-white" />
                                      </div>
                                      <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                        ⚠️ Áreas de Mejora
                                      </span>
                                    </div>
                                    <Badge variant="warning" className="text-xs px-3 py-1">
                                      {gaps.length} skills
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {gaps.slice(0, 6).map((g, i) => (
                                      <Badge key={i} variant={g.isMandatory ? "danger" : "warning"} className="text-xs px-3 py-1.5 font-medium">
                                        {g.skillName} <span className="ml-1 font-black">{g.currentLevel}/{g.requiredLevel}</span>
                                      </Badge>
                                    ))}
                                    {gaps.length > 6 && (
                                      <Badge variant="default" className="text-xs px-3 py-1.5">
                                        +{gaps.length - 6} más
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Recommendation & Action */}
                            {candidate.recommendationReason && (
                              <details className="group mb-4">
                                <summary className="cursor-pointer text-sm font-bold text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 transition-all hover:shadow-md">
                                  <Sparkles size={16} className="flex-shrink-0" />
                                  <span className="flex-1">💡 Ver Análisis y Recomendación de la IA</span>
                                  <span className="text-xs text-purple-600 dark:text-purple-400">▼</span>
                                </summary>
                                <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border-2 border-purple-300 dark:border-purple-500/50 shadow-lg">
                                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                    {candidate.recommendationReason}
                                  </p>
                                </div>
                              </details>
                            )}

                            {/* Action Button for Best Candidate */}
                            {isBestCandidate && (
                              <Button
                                variant="primary"
                                onClick={() => handleApply(candidate.userId, candidate.fullName)}
                                disabled={isApplying}
                                className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-white font-black text-base shadow-2xl shadow-amber-500/50 hover:shadow-amber-600/60 transition-all border-2 border-amber-600 py-3"
                                icon={isApplying ? Loader2 : Star}
                              >
                                {isApplying ? '⏳ Enviando postulación...' : '⭐ Postularme como Mejor Candidato'}
                              </Button>
                            )}
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
