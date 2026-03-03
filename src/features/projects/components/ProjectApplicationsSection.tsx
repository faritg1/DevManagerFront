import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, Badge, Button, Avatar, Modal } from "../../../shared/ui";
import { applicationsService } from "../../../shared/api";
import { ApplicationStatus, type ApplicationResponse } from "../../../shared/api/types";
import { useModal } from "../../../shared/hooks";
import { useNotification, useConfig } from "../../../shared/context";
    
interface ProjectApplicationsSectionProps {
  applications: ApplicationResponse[];
  onApplicationsChange: (apps: ApplicationResponse[]) => void;
}

export const ProjectApplicationsSection: React.FC<ProjectApplicationsSectionProps> = ({
  applications,
  onApplicationsChange,
}) => {
  const { showNotification } = useNotification();
  const { catalogs } = useConfig();
  const reviewModal = useModal();

  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const getApplicationStatusConfig = (status: number) => {
    const label = catalogs?.applicationStatuses.find((s) => s.id === status)?.name || "Desconocido";
    let variant: "success" | "warning" | "danger" = "warning";
    switch (status) {
      case ApplicationStatus.Pending:
        variant = "warning";
        break;
      case ApplicationStatus.Approved:
        variant = "success";
        break;
      case ApplicationStatus.Rejected:
        variant = "danger";
        break;
    }
    return { variant, label };
  };

  const handleOpenReview = (app: ApplicationResponse, action: "approve" | "reject") => {
    setSelectedApplication(app);
    setReviewAction(action);
    setReviewNotes("");
    reviewModal.open();
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication) return;
    setIsReviewing(true);
    try {
      const status =
        reviewAction === "approve" ? ApplicationStatus.Approved : ApplicationStatus.Rejected;
      const response = await applicationsService.review(selectedApplication.id, {
        status,
        reviewNotes: reviewNotes.trim() || null,
      });

      if (response.success) {
        showNotification({
          type: "success",
          message:
            reviewAction === "approve"
              ? `Postulación de ${selectedApplication.userFullName} aprobada`
              : `Postulación de ${selectedApplication.userFullName} rechazada`,
        });
        reviewModal.close();
        onApplicationsChange(
          applications.map((app) =>
            app.id === selectedApplication.id
              ? {
                  ...app,
                  status,
                  statusName:
                    status === ApplicationStatus.Approved ? "Aprobada" : "Rechazada",
                }
              : app
          )
        );
      } else {
        showNotification({
          type: "error",
          message: response.message || "Error al procesar la postulación",
        });
      }
    } catch {
      showNotification({ type: "error", message: "Error de conexión al procesar la postulación" });
    } finally {
      setIsReviewing(false);
    }
  };

  const pendingApps = applications.filter((a) => a.status === ApplicationStatus.Pending);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-purple-500" size={20} />
            Postulaciones
            {pendingApps.length > 0 && (
              <Badge variant="warning">{pendingApps.length} pendientes</Badge>
            )}
          </CardTitle>
        </CardHeader>

        {applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">No hay postulaciones aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const appStatusConfig = getApplicationStatusConfig(app.status);
              const isPending = app.status === ApplicationStatus.Pending;
              return (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={app.userFullName} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {app.userFullName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(app.appliedAt).toLocaleDateString("es-ES")}
                        {app.message && (
                          <span className="ml-2 text-slate-400">• "{app.message}"</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleOpenReview(app, "reject")}
                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                        >
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleOpenReview(app, "approve")}
                        >
                          Aprobar
                        </Button>
                      </>
                    ) : (
                      <Badge variant={appStatusConfig.variant}>{appStatusConfig.label}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal Revisar Postulación */}
      <Modal
        isOpen={reviewModal.isOpen}
        onClose={reviewModal.close}
        title={reviewAction === "approve" ? "Aprobar Postulación" : "Rechazar Postulación"}
        icon={
          reviewAction === "approve" ? (
            <CheckCircle2 className="text-emerald-500" size={20} />
          ) : (
            <XCircle className="text-rose-500" size={20} />
          )
        }
        size="md"
        footer={
          <>
            <Button
              onClick={handleSubmitReview}
              disabled={isReviewing || (reviewAction === "reject" && !reviewNotes.trim())}
              icon={isReviewing ? Loader2 : reviewAction === "approve" ? CheckCircle2 : XCircle}
              className={reviewAction === "reject" ? "bg-rose-600 hover:bg-rose-700" : ""}
            >
              {isReviewing
                ? "Procesando..."
                : reviewAction === "approve"
                ? "Aprobar"
                : "Rechazar"}
            </Button>
            <Button variant="outline" onClick={reviewModal.close}>
              Cancelar
            </Button>
          </>
        }
      >
        {selectedApplication && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111b22]">
              <Avatar name={selectedApplication.userFullName} size="lg" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">
                  {selectedApplication.userFullName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Postulado el{" "}
                  {new Date(selectedApplication.appliedAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {selectedApplication.message && (
              <div>
                <label className="text-slate-700 dark:text-white text-sm font-bold block mb-2">
                  Mensaje del postulante
                </label>
                <p className="p-3 rounded-xl bg-slate-100 dark:bg-[#0d1419] text-slate-700 dark:text-slate-300 text-sm italic">
                  "{selectedApplication.message}"
                </p>
              </div>
            )}

            <div
              className={`p-4 rounded-xl border ${
                reviewAction === "approve"
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                  : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
              }`}
            >
              <p
                className={`text-sm ${
                  reviewAction === "approve"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {reviewAction === "approve"
                  ? `¿Estás seguro de aprobar la postulación de ${selectedApplication.userFullName}? El candidato será notificado.`
                  : `¿Estás seguro de rechazar la postulación de ${selectedApplication.userFullName}? Esta acción no se puede deshacer.`}
              </p>
            </div>

            <div>
              <label className="text-slate-700 dark:text-white text-sm font-bold block mb-2">
                Notas de revisión{" "}
                {reviewAction === "reject" && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === "approve"
                    ? "Opcional: Agrega comentarios sobre la aprobación..."
                    : "Obligatorio: Indica el motivo del rechazo..."
                }
                rows={3}
                className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-white dark:bg-[#111b22] px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
              />
              {reviewAction === "reject" && !reviewNotes.trim() && (
                <p className="text-xs text-rose-500 mt-1">
                  Las notas son obligatorias para rechazar una postulación
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
