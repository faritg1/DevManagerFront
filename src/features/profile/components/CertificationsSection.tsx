import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  IconButton,
} from "../../../shared/ui";
import {
  Award,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import type { CertificationResponse } from "../../../shared/api/types";
import { CertificationModal } from "./CertificationModal";
import { useConfirm } from "../../../shared/hooks";

interface Props {
  certifications: CertificationResponse[];
  isLoading: boolean;
  opLoading: boolean;
  onDelete: (cert: CertificationResponse) => Promise<void>;
  onSave: (
    payload: {
      name: string;
      issuer: string;
      issueDate: string;
      expirationDate?: string | null;
      evidenceUrl?: string | null;
    },
    id?: string,
  ) => Promise<boolean>;
}

export const CertificationsSection: React.FC<Props> = ({
  certifications,
  isLoading,
  opLoading,
  onDelete,
  onSave,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationResponse | null>(
    null,
  );
  const { confirm } = useConfirm();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const handleOpenCreate = () => {
    setEditingCert(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cert: CertificationResponse) => {
    setEditingCert(cert);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCert(null);
  };

  const handleDelete = async (cert: CertificationResponse) => {
    const confirmed = await confirm({
      message: `¿Eliminar la certificación "${cert.name}"?`,
      type: "warning",
    });
    if (confirmed) {
      await onDelete(cert);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="text-primary" size={20} />
            Certificaciones
          </CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Award className="text-primary" size={20} />
              Certificaciones
              <Badge variant="default">{certifications.length}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreate}
              disabled={opLoading}
            >
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>

        {certifications.length === 0 ? (
          <div className="text-center py-8">
            <Award
              className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              size={48}
            />
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              No has agregado certificaciones aún
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Agregar mi primera certificación
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#0d1419] border border-slate-200 dark:border-[#233948] hover:border-primary/30 transition-all relative"
              >
                {opLoading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center rounded-xl z-10">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                      {cert.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {cert.issuer}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Emitida: {formatDate(cert.issueDate)}</span>
                      </div>
                      
                      {cert.expirationDate && (
                        <div className={`flex items-center gap-1 ${isExpired(cert.expirationDate) ? 'text-rose-500' : ''}`}>
                          <Calendar size={12} />
                          <span>
                            Expira: {formatDate(cert.expirationDate)}
                            {isExpired(cert.expirationDate) && ' (Expirada)'}
                          </span>
                        </div>
                      )}
                      
                      {cert.evidenceUrl && (
                        <a 
                          href={cert.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink size={12} />
                          <span>Ver evidencia</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <IconButton icon={Pencil} label={`Editar ${cert.name}`} onClick={() => handleOpenEdit(cert)} />
                    <IconButton icon={Trash2} label={`Eliminar ${cert.name}`} variant="danger" onClick={() => handleDelete(cert)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CertificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        saving={opLoading}
        editing={editingCert}
        onSave={onSave}
      />
    </>
  );
};
