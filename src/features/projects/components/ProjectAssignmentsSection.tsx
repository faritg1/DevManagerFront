import React from "react";
import { Users, Edit, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, Badge, Button, Avatar } from "../../../shared/ui";
import { assignmentsService } from "../../../shared/api";
import type { AssignmentResponse } from "../../../shared/api/types";
import { useNotification, useConfig } from "../../../shared/context";
import { useConfirm } from "../../../shared/hooks";

interface ProjectAssignmentsSectionProps {
  assignments: AssignmentResponse[];
  isAdmin: boolean;
  onEdit: (assignment: AssignmentResponse) => void;
  onAssignmentsChange: () => void;
}

export const ProjectAssignmentsSection: React.FC<ProjectAssignmentsSectionProps> = ({
  assignments,
  isAdmin,
  onEdit,
  onAssignmentsChange,
}) => {
  const { showNotification } = useNotification();
  const { catalogs } = useConfig();
  const { confirm } = useConfirm();

  const getStatusConfig = (status: number) => {
    const label = catalogs?.assignmentStatuses.find((s) => s.id === status)?.name || "Desconocido";
    // 1=Active, 2=Removed, 3=Completed
    const variant: "success" | "danger" | "info" =
      status === 1 ? "success" : status === 2 ? "danger" : "info";
    return { variant, label };
  };

  const handleRemove = async (assignment: AssignmentResponse) => {
    const ok = await confirm({
      title: "Quitar miembro",
      message: `¿Quitar a ${assignment.userName} de este proyecto?`,
      confirmText: "Quitar",
      cancelText: "Cancelar",
      type: "warning",
    });
    if (!ok) return;

    try {
      const response = await assignmentsService.delete(assignment.id);
      if (response.success) {
        showNotification({ type: "success", message: `${assignment.userName} fue removido del proyecto` });
        onAssignmentsChange();
      } else {
        showNotification({ type: "error", message: response.message || "Error al quitar la asignación" });
      }
    } catch {
      showNotification({ type: "error", message: "Error de conexión al quitar la asignación" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-emerald-500" size={20} />
          Miembros Asignados
          {assignments.length > 0 && <Badge variant="default">{assignments.length}</Badge>}
        </CardTitle>
      </CardHeader>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">No hay miembros asignados aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const statusConfig = getStatusConfig(assignment.status);
            return (
              <div
                key={assignment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={assignment.userName} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {assignment.userName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {assignment.roleName && <span className="mr-2">{assignment.roleName} •</span>}
                      Desde{" "}
                      {new Date(assignment.assignedAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => onEdit(assignment)}
                      >
                        Reasignar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleRemove(assignment)}
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                      >
                        Quitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
