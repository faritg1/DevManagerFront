import React from "react";
import { useParams } from "react-router-dom";
import RoleEditor from "../components/RoleEditor";

export const RolePermissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Reutilizamos el componente `RoleEditor` para una UI más rica (matriz + búsqueda + select all)
  return <RoleEditor roleId={id} onSaved={() => { /* opcional: mostrar toast / redirigir */ }} />;
};
