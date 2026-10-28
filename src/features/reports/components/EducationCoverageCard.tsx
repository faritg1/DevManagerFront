import React, { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { reportsService } from "../../../shared/api";
import type { EducationCoverageResponse } from "../../../shared/api/types";
import { Card, Badge, SELECT_SM_CLASS } from "../../../shared/ui";
import { HOURS_TYPE_LABELS } from "../../education/labels";

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => thisYear - i);

export const EducationCoverageCard: React.FC = () => {
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState<EducationCoverageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reportsService
      .getEducationCoverage(year)
      .then((res) => { if (!cancelled) setData(res.data ?? null); })
      .catch(() => { if (!cancelled) setData(null); }) // API errors are already notified globally
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap size={20} className="text-primary" />
          Cobertura de educación cooperativa
        </h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={SELECT_SM_CLASS}
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
      ) : !data ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No se pudo cargar la cobertura.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-900 dark:text-white">
            <div><p className="text-xs text-slate-500 dark:text-slate-400">Cobertura</p><p className="text-2xl font-bold">{Math.round(data.coverageRatio * 100)}%</p></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">Asociados cubiertos</p><p className="text-2xl font-bold">{data.coveredAssociates} / {data.eligibleAssociates}</p></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">Promedio de horas</p><p className="text-2xl font-bold">{data.avgHours.toFixed(1)} h</p></div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Educación básica</p>
              <Badge variant={data.basicCompliant ? "success" : "warning"}>{data.basicCompliant ? "Cumple" : "No cumple"}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            {Object.entries(HOURS_TYPE_LABELS).map(([k, label]) => (
              <span key={k}>{label}: <strong>{data.hoursByType[k as keyof typeof data.hoursByType] ?? 0} h</strong></span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
