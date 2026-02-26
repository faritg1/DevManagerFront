import React, { useEffect } from "react";
import { useNotification } from "../context";
import type { ApiError } from "../api/client";

export const GlobalErrorListener: React.FC = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<ApiError>;
      const error = customEvent.detail;

      let message =
        error.message ||
        "Ha ocurrido un error inesperado al procesar la solicitud.";

      // Si hay errores de validación (400 Bad Request), los formateamos
      if (error.errors && Object.keys(error.errors).length > 0) {
        const errorMessages = Object.entries(error.errors)
          .map(([field, msgs]) => msgs.join(". "))
          .join(" | ");
        message = errorMessages;
      }

      // Mostrar la notificación global de error
      showNotification({
        type: "error",
        title: `Error en Servidor (${error.status})`,
        message: message,
        duration: 8000, // Dar más tiempo para leer errores largos
      });
    };

    window.addEventListener("DevManagerApiError", handleApiError);

    return () => {
      window.removeEventListener("DevManagerApiError", handleApiError);
    };
  }, [showNotification]);

  return null; // Este componente no renderiza nada visual, solo escucha eventos
};

export default GlobalErrorListener;
