import { useState, useEffect } from "react";
import { certificationService } from "../../../shared/api";
import type {
  CertificationResponse,
  CreateCertificationRequest,
  UpdateCertificationRequest,
} from "../../../shared/api/types";

interface UseCertificationsResult {
  certifications: CertificationResponse[];
  isLoading: boolean;
  opLoading: boolean;
  error: string | null;
  loadCertifications: () => Promise<void>;
  saveCertification: (
    payload: CreateCertificationRequest,
    id?: string,
  ) => Promise<void>;
  deleteCertification: (cert: CertificationResponse) => Promise<boolean>;
}

export function useCertifications(): UseCertificationsResult {
  const [certifications, setCertifications] = useState<CertificationResponse[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCertifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await certificationService.getMyCertifications();
      if (resp.success && resp.data) {
        setCertifications(resp.data);
      }
    } catch (err) {
      console.error('[Certifications] Error:', err);
      setError('No se pudieron cargar las certificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCertification = async (
    payload: CreateCertificationRequest,
    id?: string,
  ): Promise<void> => {
    // Called from the form panel: an API error rejects, and the panel shows it.
    await (id
      ? certificationService.updateMyCertification(id, payload as UpdateCertificationRequest)
      : certificationService.createMyCertification(payload));
    // Not awaited: the list shows its own loading state, and a failed reload is not a failed save.
    void loadCertifications();
  };

  const deleteCertification = async (
    cert: CertificationResponse,
  ): Promise<boolean> => {
    setOpLoading(true);
    try {
      const resp = await certificationService.deleteMyCertification(cert.id);
      if (resp.success) {
        setCertifications((prev) => prev.filter((c) => c.id !== cert.id));
        return true;
      }
    } catch (err) {
      console.error('[Certifications] Error eliminando:', err);
    } finally {
      setOpLoading(false);
    }
    return false;
  };

  useEffect(() => {
    loadCertifications();
  }, []);

  return {
    certifications,
    isLoading,
    opLoading,
    error,
    loadCertifications,
    saveCertification,
    deleteCertification,
  };
}
