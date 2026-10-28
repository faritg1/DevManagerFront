import React, { useEffect } from "react";
import { useNotification } from "../context";
import type { ApiError } from "../api/client";

export const GlobalErrorListener: React.FC = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const error = (event as CustomEvent<ApiError>).detail;
      const validation = Object.values(error.errors ?? {});

      showNotification({
        type: "error",
        title: `Error en Servidor (${error.status})`,
        message: validation.length
          ? validation.map((msgs) => msgs.join(". ")).join(" | ")
          : error.message || "Ha ocurrido un error inesperado al procesar la solicitud.",
        duration: 8000,
      });
    };

    window.addEventListener("DevManagerApiError", handleApiError);
    return () => window.removeEventListener("DevManagerApiError", handleApiError);
  }, [showNotification]);

  return null;
};
