/**
 * Project Complexity Configuration Utility
 * Provides unified complexity mapping across Dashboard and Projects pages
 * 
 * Maps ProjectComplexity enum to:
 * - Badge variant (color)
 * - Spanish label
 */

import { ProjectComplexity, PROJECT_COMPLEXITY_LABELS } from "../../../shared/api/types";

export const getComplexityConfig = (
  complexity: ProjectComplexity
): { variant: "success" | "warning" | "danger"; label: string } => {
  const label = PROJECT_COMPLEXITY_LABELS[complexity] ?? "Desconocido";
  switch (complexity) {
    case ProjectComplexity.Medium:
      return { variant: "warning", label };
    case ProjectComplexity.High:
      return { variant: "danger", label };
    default:
      return { variant: "success", label };
  }
};
