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
  type CreateAssignmentRequest,
} from "../../../shared/api/types";
import { useNotification } from "../../../shared/context";
import { useConfirm } from "../../../shared/hooks";

interface ProjectAssignModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  applications: ApplicationResponse[];
}

export const ProjectAssignModal: React.FC<ProjectAssignModalProps> = ({
  projectId,
  isOpen,
  onClose,
  applications,
}) => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [orgUsers, setOrgUsers] = useState<UserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignRole, setAssignRole] = useState("Developer");
  const [assignHours, setAssignHours] = useState(40);
  const [isAssigning, setIsAssigning] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Load users when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedUserId("");
    setAssignRole("Developer");
    setAssignHours(40);
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
            response.data.filter((u) => u.isActive && !approvedUserIds.includes(u.id))
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
      message: `¿Asignar a ${selectedUser?.fullName || "este usuario"} al proyecto como ${assignRole}?`,
    });
    if (!ok) return;

    setIsAssigning(true);
    try {
      const data: CreateAssignmentRequest = {
        projectId,
        userId: selectedUserId,
        role: assignRole,
        hoursPerWeek: assignHours,
      };
      const response = await assignmentsService.create(data);
      if (response.success) {
        showNotification({
          type: "success",
          message: `${selectedUser?.fullName} asignado exitosamente`,
        });
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
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.roleName.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Miembro al Proyecto"
      icon={<UserPlus className="text-emerald-500" size={20} />}
      size="lg"
    >
      <div className="space-y-5">
        <Input
          placeholder="Buscar por nombre, email o rol..."
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

        {selectedUserId && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1419] border border-slate-200 dark:border-[#233948] space-y-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Detalles de la asignación
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Rol en el Proyecto
                </label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#111b22] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  <option value="Developer">Developer</option>
                  <option value="Tech Lead">Tech Lead</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Designer">Designer</option>
                  <option value="Project Manager">Project Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Horas por semana
                </label>
                <Input
                  type="number"
                  value={assignHours.toString()}
                  onChange={(e) => setAssignHours(Number(e.target.value) || 0)}
                  min={1}
                  max={48}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isAssigning}
            icon={isAssigning ? Loader2 : UserPlus}
            className={isAssigning ? "[&_svg]:animate-spin" : ""}
          >
            {isAssigning ? "Asignando..." : "Asignar al Proyecto"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
