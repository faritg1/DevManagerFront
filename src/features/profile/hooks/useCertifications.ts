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
  ) => Promise<boolean>;
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
    console.log('[Certifications] Cargando certificaciones...');
    try {
      const resp = await certificationService.getMyCertifications();
      console.log('[Certifications] Respuesta:', resp);
      if (resp.success && resp.data) {
        setCertifications(resp.data);
        console.log('[Certifications] Certificaciones cargadas:', resp.data.length);
      }
    } catch (err: any) {
      console.error('[Certifications] Error:', err);
      setError('No se pudieron cargar las certificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCertification = async (
    payload: CreateCertificationRequest,
    id?: string,
  ): Promise<boolean> => {
    setOpLoading(true);
    console.log('[Certifications] Guardando:', { id, payload });
    try {
      let resp;
      if (id) {
        resp = await certificationService.updateMyCertification(
          id,
          payload as UpdateCertificationRequest,
        );
      } else {
        resp = await certificationService.createMyCertification(payload);
      }
      console.log('[Certifications] Respuesta save:', resp);

      if (resp.success) {
        await loadCertifications();
        return true;
      }
    } catch (err) {
      console.error('[Certifications] Error guardando:', err);
    } finally {
      setOpLoading(false);
    }
    return false;
  };

  const deleteCertification = async (
    cert: CertificationResponse,
  ): Promise<boolean> => {
    setOpLoading(true);
    console.log('[Certifications] Eliminando:', cert.id);
    try {
      const resp = await certificationService.deleteMyCertification(cert.id);
      console.log('[Certifications] Respuesta delete:', resp);
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
