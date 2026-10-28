import React from "react";
import { useParams } from "react-router-dom";
import { RoleEditor } from "../components/RoleEditor";

export const RolePermissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <RoleEditor key={id} roleId={id!} />;
};
