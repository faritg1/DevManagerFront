/**
 * Project Complexity Configuration Utility
 * Provides unified complexity mapping across Dashboard and Projects pages
 * 
 * Maps ProjectComplexity enum to:
 * - Badge variant (color)
 * - Spanish label
 */

import { ProjectComplexity } from "../../../shared/api/types";

export const getComplexityConfig = (
  complexity: ProjectComplexity
): { variant: "success" | "warning" | "danger"; label: string } => {
  switch (complexity) {
    case ProjectComplexity.Low:
      return { variant: "success", label: "Baja" };
    case ProjectComplexity.Medium:
      return { variant: "warning", label: "Media" };
    case ProjectComplexity.High:
      return { variant: "danger", label: "Alta" };
    default:
      return { variant: "success", label: "Baja" };
  }
};
