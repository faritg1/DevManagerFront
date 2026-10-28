import React, { useState } from "react";
import {
  UserPlus,
  Users,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button, Avatar, Badge, Modal, Input } from "../../../shared/ui";
import { usersService, assignmentsService } from "../../../shared/api";
import {
  ApplicationStatus,
  type UserResponse,
  type ApplicationResponse,
  type AssignmentResponse,
  type CreateAssignmentRequest,
} from "../../../shared/api/types";
import { useNotification } from "../../../shared/context";
import { useConfirm } from "../../../shared/hooks";

interface ProjectAssignModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  applications: ApplicationResponse[];
  /** Users already assigned to the project (hidden from the list) */
  assignedUserIds?: string[];
  /** When set, the modal reassigns this assignment instead of creating one */
  assignment?: AssignmentResponse | null;
  onSaved?: () => void;
}

export const ProjectAssignModal: React.FC<ProjectAssignModalProps> = ({
  projectId,
  isOpen,
  onClose,
  applications,
  assignedUserIds = [],
  assignment = null,
  onSaved,
}) => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [orgUsers, setOrgUsers] = useState<UserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedUserId("");
    setUserSearch("");

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await usersService.getAll();
        if (response.success && response.data) {
          const approvedUserIds = applications
            .filter((a) => a.status === ApplicationStatus.Approved)
            .map((a) => a.userId);
          setOrgUsers(
            response.data.filter(
              (u) =>
                u.isActive &&
                !approvedUserIds.includes(u.id) &&
                !assignedUserIds.includes(u.id)
            )
          );
        }
      } catch {
        showNotification({ type: "error", message: "Error al cargar usuarios" });
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    const selectedUser = orgUsers.find((u) => u.id === selectedUserId);
    const ok = await confirm({
      message: assignment
        ? `¿Reasignar el puesto de ${assignment.userName} a ${selectedUser?.fullName || "este usuario"}?`
        : `¿Asignar a ${selectedUser?.fullName || "este usuario"} al proyecto?`,
    });
    if (!ok) return;

    setIsAssigning(true);
    try {
      const data: CreateAssignmentRequest = {
        projectId,
        userId: selectedUserId,
      };
      // Backend PUT only updates projectRoleId, so reassigning a user is create-new + remove-old.
      // Create first so a failure leaves the original assignment intact.
      const response = await assignmentsService.create(data);
      if (response.success && assignment) {
        await assignmentsService.delete(assignment.id);
      }
      if (response.success) {
        showNotification({
          type: "success",
          message: `${selectedUser?.fullName} asignado exitosamente`,
        });
        onSaved?.();
        onClose();
        setOrgUsers((prev) => prev.filter((u) => u.id !== selectedUserId));
        setSelectedUserId("");
      } else {
        showNotification({
          type: "error",
          message: response.message || "Error al asignar usuario",
        });
      }
    } catch {
      showNotification({ type: "error", message: "Error de conexión al asignar usuario" });
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = orgUsers.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.roleName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment ? `Reasignar puesto de ${assignment.userName}` : "Asignar Miembro al Proyecto"}
      icon={<UserPlus className="text-emerald-500" size={20} />}
      size="lg"
      footer={
        <>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isAssigning}
            icon={isAssigning ? Loader2 : UserPlus}
            className={isAssigning ? "[&_svg]:animate-spin" : ""}
          >
            {isAssigning ? "Asignando..." : assignment ? "Reasignar" : "Asignar al Proyecto"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          placeholder="Buscar por nombre, email o rol..." aria-label="Buscar usuarios"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />

        {loadingUsers && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">Cargando usuarios...</span>
          </div>
        )}

        {!loadingUsers && filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {orgUsers.length === 0
                ? "No hay usuarios disponibles para asignar"
                : "No se encontraron resultados"}
            </p>
          </div>
        )}

        {!loadingUsers && filteredUsers.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedUserId === user.id
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-slate-50 dark:bg-[#111b22] border-transparent hover:border-slate-200 dark:hover:border-[#233948]"
                }`}
              >
                <Avatar name={user.fullName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                <Badge variant="default" className="text-xs shrink-0">
                  {user.roleName}
                </Badge>
                {selectedUserId === user.id && (
                  <CheckCircle2 className="text-primary shrink-0" size={20} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
