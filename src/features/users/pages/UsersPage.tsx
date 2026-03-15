import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    UserPlus,
    Eye, 
    MoreVertical, 
    Mail, 
    Loader2, 
    AlertCircle,
    Edit,
    Trash2,
    UserX,
    UserCheck,
    Search,
    Phone,
    Calendar,
    ShieldCheck,
    Key,
    Award,
    CheckCircle2,
    ChevronUp,
    ChevronDown,
    Plus,
    ShieldOff,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input } from '../../../shared/ui';
import { useModal } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { usersService, rbacService, skillsService } from '../../../shared/api';
import type { UserResponse, CreateUserRequest, UpdateUserRequest, RoleDto, EffectivePermissionsResponse, PermissionGroupDto, EmployeeSkillResponse, ValidateSkillRequest } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';

// Helpers
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const UsersPage: React.FC = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    // State
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Modales
    const createModal = useModal();
    const editModal = useModal();
    const deleteModal = useModal();
    const rolesModal = useModal();
    const permissionsModal = useModal();

    // Form states
    const [isSaving, setIsSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [createForm, setCreateForm] = useState<CreateUserRequest>({
        email: '',
        password: '',
        fullName: '',
        roleId: '',
        phoneNumber: ''
    });
    const [editForm, setEditForm] = useState<UpdateUserRequest>({});

    // Roles & permissions states
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [rolesSaving, setRolesSaving] = useState(false);
    const [userAssignedRoleIds, setUserAssignedRoleIds] = useState<Set<string>>(new Set());

    const [permsLoading, setPermsLoading] = useState(false);
    const [effectivePerms, setEffectivePerms] = useState<EffectivePermissionsResponse | null>(null);
    const [groupedPerms, setGroupedPerms] = useState<PermissionGroupDto[]>([]);
    const [overridePermId, setOverridePermId] = useState('');
    const [overrideIsGrant, setOverrideIsGrant] = useState(true);
    const [overrideSaving, setOverrideSaving] = useState(false);

    // Skills validation
    const skillsModal = useModal();
    const [userSkills, setUserSkills] = useState<EmployeeSkillResponse[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [validatingSkillId, setValidatingSkillId] = useState<string | null>(null);
    const [adjustingSkillId, setAdjustingSkillId] = useState<string | null>(null);
    const [adjustLevel, setAdjustLevel] = useState<number>(3);

    // Cargar usuarios
    useEffect(() => {
        fetchUsers();
    }, []);

    // Filtrar por búsqueda
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = users.filter(user => 
            user.fullName.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.roleName.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await usersService.getAll();
            if (response.success && response.data) {
                const usersData = response.data;

                // Detect users missing roleName and try to resolve their primary role via RBAC service
                const missingRoleUsers = usersData.filter(u => !u.roleName || !u.roleName.trim());

                if (missingRoleUsers.length > 0) {
                    try {
                        const lookups = await Promise.allSettled(
                            missingRoleUsers.map((u) => rbacService.getUserEffectivePermissions(u.id)),
                        );

                        lookups.forEach((res, idx) => {
                            if (res.status === 'fulfilled' && res.value.success && res.value.data) {
                                const effective = res.value.data;
                                const firstRoleName = effective.roles?.[0]?.name;
                                const userId = missingRoleUsers[idx].id;
                                const target = usersData.find(x => x.id === userId);
                                if (target) {
                                    target.roleName = firstRoleName || 'Sin rol';
                                }
                            } else {
                                const userId = missingRoleUsers[idx].id;
                                const target = usersData.find(x => x.id === userId);
                                if (target) target.roleName = 'Sin rol';
                            }
                        });
                    } catch (err) {
                        console.warn('RBAC lookup failed for users roleName population', err);
                        // fallback: mark missing as 'Sin rol'
                        usersData.forEach(u => {
                            if (!u.roleName || !u.roleName.trim()) u.roleName = 'Sin rol';
                        });
                    }
                }

                // Ensure all users have a visible roleName
                usersData.forEach(u => { if (!u.roleName || !u.roleName.trim()) u.roleName = 'Sin rol'; });

                setUsers(usersData);
                setFilteredUsers(usersData);
            } else {
                setError(response.message || 'Error al cargar usuarios');
            }
        } catch (err) {
            setError('Error de conexión al cargar usuarios');
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Crear usuario
    const handleCreate = async () => {
        if (!createForm.email || !createForm.password || !createForm.fullName) {
            showNotification({
                type: 'error',
                message: 'Completa los campos obligatorios'
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await usersService.create(createForm);
            if (response.success) {
                showNotification({
                    type: 'success',
                    message: 'Usuario creado exitosamente'
                });
                createModal.close();
                setCreateForm({ email: '', password: '', fullName: '', roleId: '', phoneNumber: '' });
                fetchUsers();
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al crear usuario'
                });
            }
        } catch (err) {
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Abrir modal de edición
    const handleOpenEdit = (user: UserResponse) => {
        setSelectedUser(user);
        setEditForm({
            fullName: user.fullName,
            phoneNumber: user.phoneNumber || '',
            isActive: user.isActive
        });
        editModal.open();
        setActiveDropdown(null);
    };

    // Load roles for Manage Roles modal
    useEffect(() => {
        const loadRolesForUser = async () => {
            if (!rolesModal.isOpen || !selectedUser) return;

            setRolesLoading(true);
            try {
                const [rolesResp, effResp] = await Promise.all([
                    rbacService.getRoles(),
                    rbacService.getUserEffectivePermissions(selectedUser.id),
                ]);

                if (rolesResp.success && rolesResp.data) setRoles(rolesResp.data);
                if (effResp.success && effResp.data) {
                    const assigned = new Set(effResp.data.roles.map(r => findRoleIdByName(rolesResp.data || [], r.name)).filter(Boolean) as string[]);
                    setUserAssignedRoleIds(assigned);
                    setEffectivePerms(effResp.data);
                }
            } catch (err) {
                console.error('Failed loading roles/permissions', err);
            } finally {
                setRolesLoading(false);
            }
        };

        loadRolesForUser();
    }, [rolesModal.isOpen, selectedUser]);

    // Load effective permissions when permissions modal opens
    useEffect(() => {
        const loadEffective = async () => {
            if (!permissionsModal.isOpen || !selectedUser) return;
            setPermsLoading(true);
            try {
                const [resp, groupedResp] = await Promise.all([
                    rbacService.getUserEffectivePermissions(selectedUser.id),
                    rbacService.getGroupedPermissions(),
                ]);
                if (resp.success && resp.data) setEffectivePerms(resp.data);
                if (groupedResp.success && groupedResp.data) setGroupedPerms(groupedResp.data);
            } catch (err) {
                console.error('Failed loading effective permissions', err);
            } finally {
                setPermsLoading(false);
            }
        };

        loadEffective();
    }, [permissionsModal.isOpen, selectedUser]);

    const handleAddOverride = async () => {
        if (!selectedUser || !overridePermId) return;
        setOverrideSaving(true);
        try {
            const res = await rbacService.assignPermissionToUser({
                userId: selectedUser.id,
                permissionId: overridePermId,
                isGranted: overrideIsGrant,
            });
            if (res.success) {
                showNotification({ type: 'success', message: `Override ${overrideIsGrant ? 'concedido' : 'denegado'} correctamente` });
                setOverridePermId('');
                // Reload effective permissions to reflect the change
                const updated = await rbacService.getUserEffectivePermissions(selectedUser.id);
                if (updated.success && updated.data) setEffectivePerms(updated.data);
            } else {
                showNotification({ type: 'error', message: 'No se pudo guardar el override' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error al guardar el override' });
        } finally {
            setOverrideSaving(false);
        }
    };

    // Load employee skills when modal opens
    useEffect(() => {
        const loadUserSkills = async () => {
            if (!skillsModal.isOpen || !selectedUser) return;
            setSkillsLoading(true);
            try {
                const resp = await skillsService.getEmployeeSkills(selectedUser.id);
                if (resp.success && resp.data) {
                    setUserSkills(resp.data);
                } else {
                    setUserSkills([]);
                }
            } catch (err) {
                console.error('Failed loading user skills', err);
                setUserSkills([]);
            } finally {
                setSkillsLoading(false);
            }
        };
        loadUserSkills();
    }, [skillsModal.isOpen, selectedUser]);

    const handleValidateSkill = async (skill: EmployeeSkillResponse, newLevel: number | null) => {
        setValidatingSkillId(skill.id);
        try {
            const data: ValidateSkillRequest = { newLevel };
            const resp = await skillsService.validateSkill(skill.id, data);
            if (resp.success) {
                showNotification({
                    type: 'success',
                    message: newLevel
                        ? `Skill "${skill.skillName}" validada y ajustada a nivel ${newLevel}`
                        : `Skill "${skill.skillName}" validada exitosamente`,
                });
                // Refresh skills list
                const refreshed = await skillsService.getEmployeeSkills(selectedUser!.id);
                if (refreshed.success && refreshed.data) setUserSkills(refreshed.data);
                setAdjustingSkillId(null);
            } else {
                showNotification({ type: 'error', message: resp.message || 'Error al validar skill' });
            }
        } catch (err) {
            console.error('Validate skill error:', err);
            showNotification({ type: 'error', message: 'Error de conexión al validar' });
        } finally {
            setValidatingSkillId(null);
        }
    };

    const getLevelLabel = (level: number) => {
        const labels: Record<number, string> = { 1: 'Básico', 2: 'Intermedio', 3: 'Competente', 4: 'Avanzado', 5: 'Experto' };
        return labels[level] || `Nivel ${level}`;
    };

    const findRoleIdByName = (list: RoleDto[], name: string) => {
        const r = list.find(x => x.name === name);
        return r ? r.id : undefined;
    };

    // Guardar edición
    const handleSaveEdit = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            const response = await usersService.update(selectedUser.id, editForm);
            if (response.success) {
                showNotification({
                    type: 'success',
                    message: 'Usuario actualizado exitosamente'
                });
                editModal.close();
                fetchUsers();
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al actualizar usuario'
                });
            }
        } catch (err) {
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle estado activo/inactivo
    const handleToggleStatus = async (user: UserResponse) => {
        try {
            const response = await usersService.update(user.id, { 
                isActive: !user.isActive 
            });
            if (response.success) {
                showNotification({
                    type: 'success',
                    message: user.isActive ? 'Usuario desactivado' : 'Usuario activado'
                });
                fetchUsers();
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al actualizar estado'
                });
            }
        } catch (err) {
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        }
        setActiveDropdown(null);
    };

    // Abrir modal de eliminar
    const handleOpenDelete = (user: UserResponse) => {
        setSelectedUser(user);
        deleteModal.open();
        setActiveDropdown(null);
    };

    // Confirmar eliminación
    const handleConfirmDelete = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            const response = await usersService.delete(selectedUser.id);
            if (response.success) {
                showNotification({
                    type: 'success',
                    message: 'Usuario eliminado exitosamente'
                });
                deleteModal.close();
                fetchUsers();
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al eliminar usuario'
                });
            }
        } catch (err) {
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Stats
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Cargando usuarios...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{error}</p>
                <Button variant="outline" onClick={fetchUsers}>
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Gestión de Usuarios
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Administra el acceso y roles de los miembros del equipo.
                    </p>
                </div>
                <Button icon={UserPlus} onClick={createModal.open}>
                    Invitar Usuario
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                        <UserPlus className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Usuarios</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                        <UserCheck className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeUsers}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Activos</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-500/10 rounded-xl">
                        <UserX className="text-slate-500" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveUsers}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Inactivos</p>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <Input
                    placeholder="Buscar por nombre, email o rol..."
                    icon={Search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>
            
            {/* Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Usuario</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Email</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Rol</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Creado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={user.fullName} size="sm" />
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                                                    {user.phoneNumber && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                            <Phone size={10} /> {user.phoneNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} /> {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="purple">
                                                {user.roleName}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                                variant={user.isActive ? 'success' : 'danger'} 
                                                dot
                                            >
                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === user.id ? null : user.id);
                                                }}
                                                className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b22]"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeDropdown === user.id && (
                                                <div 
                                                    className="absolute right-6 top-full mt-1 w-48 bg-white dark:bg-[#16222b] rounded-xl shadow-xl border border-slate-200 dark:border-[#233948] py-2 z-50"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            navigate(ROUTES.USER_DETAIL.replace(':id', user.id));
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22] flex items-center gap-2"
                                                    >
                                                        <Eye size={16} /> Ver perfil
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22] flex items-center gap-2"
                                                    >
                                                        <Edit size={16} /> Editar
                                                    </button>

                                                    {/* Manage roles */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            rolesModal.open();
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22] flex items-center gap-2"
                                                    >
                                                        <ShieldCheck size={16} /> Gestionar roles
                                                    </button>

                                                    {/* View effective permissions */}
                                                    <button
                                                        onClick={async () => {
                                                            setSelectedUser(user);
                                                            permissionsModal.open();
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22] flex items-center gap-2"
                                                    >
                                                        <Key size={16} /> Permisos efectivos
                                                    </button>

                                                    {/* View & validate skills */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            skillsModal.open();
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22] flex items-center gap-2"
                                                    >
                                                        <Award size={16} /> Skills / Validar
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111b22] flex items-center gap-2"
                                                    >
                                                        {user.isActive ? (
                                                            <><UserX size={16} /> Desactivar</>
                                                        ) : (
                                                            <><UserCheck size={16} /> Activar</>
                                                        )}
                                                    </button>
                                                    <hr className="my-2 border-slate-200 dark:border-[#233948]" />
                                                    <button
                                                        onClick={() => handleOpenDelete(user)}
                                                        className="w-full px-4 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} /> Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Crear Usuario */}
            <Modal
                isOpen={createModal.isOpen}
                onClose={createModal.close}
                title="Invitar Usuario"
                icon={<UserPlus className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button 
                            onClick={handleCreate}
                            disabled={isSaving}
                            icon={isSaving ? Loader2 : UserPlus}
                        >
                            {isSaving ? 'Creando...' : 'Crear Usuario'}
                        </Button>
                        <Button variant="outline" onClick={createModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre Completo *"
                        placeholder="Ej: Juan Pérez"
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                    <Input
                        label="Email *"
                        type="email"
                        placeholder="juan@empresa.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                        label="Contraseña *"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Input
                        label="Teléfono"
                        placeholder="+57 300 123 4567"
                        value={createForm.phoneNumber || ''}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        * El rol se asigna automáticamente como "Empleado". Un administrador puede cambiarlo posteriormente.
                    </p>
                </div>
            </Modal>

            {/* Modal Editar Usuario */}
            <Modal
                isOpen={editModal.isOpen}
                onClose={editModal.close}
                title="Editar Usuario"
                icon={<Edit className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button 
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            icon={isSaving ? Loader2 : Edit}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                        <Button variant="outline" onClick={editModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#111b22] rounded-xl mb-4">
                            <Avatar name={selectedUser.fullName} size="md" />
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">{selectedUser.fullName}</p>
                                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        
                        <Input
                            label="Nombre Completo"
                            value={editForm.fullName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                        <Input
                            label="Teléfono"
                            value={editForm.phoneNumber || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        />
                        
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#111b22] rounded-xl">
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Estado del Usuario</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {editForm.isActive ? 'El usuario puede acceder al sistema' : 'El acceso está deshabilitado'}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={`relative w-14 h-8 rounded-full transition-colors ${
                                    editForm.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                            >
                                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                    editForm.isActive ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Confirmar Eliminación */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.close}
                title="Eliminar Usuario"
                icon={<Trash2 className="text-rose-500" size={20} />}
                size="sm"
                footer={
                    <>
                        <Button 
                            variant="danger"
                            onClick={handleConfirmDelete}
                            disabled={isSaving}
                            icon={isSaving ? Loader2 : Trash2}
                        >
                            {isSaving ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                        <Button variant="outline" onClick={deleteModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                {selectedUser && (
                    <div className="text-center">
                        <Avatar name={selectedUser.fullName} size="lg" className="mx-auto mb-4" />
                        <p className="text-slate-700 dark:text-slate-300">
                            ¿Estás seguro de eliminar a <strong>{selectedUser.fullName}</strong>?
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Esta acción no se puede deshacer. El usuario perderá acceso al sistema.
                        </p>
                    </div>
                )}
            </Modal>

            {/* Manage Roles Modal */}
            <Modal
                isOpen={rolesModal.isOpen}
                onClose={() => {
                    rolesModal.close();
                    setRoles([]);
                    setUserAssignedRoleIds(new Set());
                }}
                title={selectedUser ? `Roles — ${selectedUser.fullName}` : 'Roles'}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => { rolesModal.close(); }}>
                            Cerrar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {rolesLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        </div>
                    ) : (
                        roles.map((role) => {
                            const checked = userAssignedRoleIds.has(role.id);
                            return (
                                <div key={role.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#111b22]">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{role.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{role.description || `${role.permissionCount} permisos`}</p>
                                    </div>
                                    <div>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={rolesSaving}
                                            onChange={async () => {
                                                if (!selectedUser) return;
                                                setRolesSaving(true);
                                                try {
                                                    if (checked) {
                                                        await rbacService.revokeRoleFromUser({ userId: selectedUser.id, roleId: role.id });
                                                        setUserAssignedRoleIds(prev => { const next = new Set(prev); next.delete(role.id); return next; });
                                                        showNotification({ type: 'success', message: 'Rol revocado' });
                                                    } else {
                                                        await rbacService.assignRoleToUser({ userId: selectedUser.id, roleId: role.id });
                                                        setUserAssignedRoleIds(prev => { const next = new Set(prev); next.add(role.id); return next; });
                                                        showNotification({ type: 'success', message: 'Rol asignado' });
                                                    }

                                                    // Refresh users list to reflect possible primary roleName change
                                                    fetchUsers();
                                                } catch (err) {
                                                    console.error('RBAC error', err);
                                                    showNotification({ type: 'error', message: 'No se pudo actualizar el rol' });
                                                } finally {
                                                    setRolesSaving(false);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Modal>

            {/* Effective Permissions Modal */}
            <Modal
                isOpen={permissionsModal.isOpen}
                onClose={() => { permissionsModal.close(); setEffectivePerms(null); setOverridePermId(''); setOverrideIsGrant(true); }}
                title={selectedUser ? `Permisos — ${selectedUser.fullName}` : 'Permisos'}
                size="lg"
                icon={<ShieldCheck size={20} className="text-primary" />}
                footer={
                    <Button variant="outline" onClick={() => { permissionsModal.close(); setEffectivePerms(null); setOverridePermId(''); setOverrideIsGrant(true); }}>
                        Cerrar
                    </Button>
                }
            >
                {permsLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    </div>
                ) : effectivePerms ? (
                    <div className="space-y-5">
                        {/* Roles asignados */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Roles asignados</p>
                            <div className="flex flex-wrap gap-2">
                                {effectivePerms.roles.length > 0
                                    ? effectivePerms.roles.map((r) => (
                                        <Badge key={r.name} variant="purple">{r.name}</Badge>
                                    ))
                                    : <span className="text-sm text-slate-400">Sin roles asignados</span>
                                }
                            </div>
                        </div>

                        {/* Permisos efectivos */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Permisos efectivos</p>
                            {effectivePerms.effectivePermissions.length > 0 ? (
                                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                                    {effectivePerms.effectivePermissions.map((p) => (
                                        <div key={p.code} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                                            <CheckCircle2 size={12} className="shrink-0" />
                                            {p.code}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400">Sin permisos efectivos</span>
                            )}
                        </div>

                        {/* Overrides activos */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Overrides directos</p>
                            {effectivePerms.directOverrides && effectivePerms.directOverrides.length > 0 ? (
                                <div className="space-y-1.5">
                                    {effectivePerms.directOverrides.map((o) => (
                                        <div key={o.permissionCode} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border ${
                                            o.isGranted
                                                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
                                                : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700'
                                        }`}>
                                            {o.isGranted
                                                ? <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                                : <ShieldOff size={14} className="text-rose-600 shrink-0" />
                                            }
                                            <span className={`font-semibold text-xs ${o.isGranted ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                                {o.isGranted ? 'GRANT' : 'DENY'}
                                            </span>
                                            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{o.permissionCode}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400">Sin overrides configurados</span>
                            )}
                        </div>

                        {/* Agregar override */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Agregar / modificar override</p>
                            <div className="flex flex-col gap-3">
                                {/* Selector de permiso */}
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Permiso</label>
                                    <select
                                        value={overridePermId}
                                        onChange={(e) => setOverridePermId(e.target.value)}
                                        className="w-full text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111b22] text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="">— Selecciona un permiso —</option>
                                        {groupedPerms.map((group) => (
                                            <optgroup key={group.module} label={group.module}>
                                                {group.permissions.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Toggle Grant / Deny */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOverrideIsGrant(true)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                                            overrideIsGrant
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-emerald-300'
                                        }`}
                                    >
                                        <CheckCircle2 size={16} />
                                        Conceder
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOverrideIsGrant(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                                            !overrideIsGrant
                                                ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-rose-300'
                                        }`}
                                    >
                                        <ShieldOff size={16} />
                                        Denegar
                                    </button>
                                </div>

                                {/* Botón guardar */}
                                <Button
                                    onClick={handleAddOverride}
                                    disabled={!overridePermId || overrideSaving}
                                    icon={overrideSaving ? Loader2 : Plus}
                                    className={overrideSaving ? 'animate-spin' : ''}
                                >
                                    {overrideSaving ? 'Guardando...' : 'Aplicar override'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500">No hay permisos disponibles</div>
                )}
            </Modal>

            {/* Skills Validation Modal */}
            <Modal
                isOpen={skillsModal.isOpen}
                onClose={() => { skillsModal.close(); setUserSkills([]); setAdjustingSkillId(null); }}
                title={selectedUser ? `Skills — ${selectedUser.fullName}` : 'Skills'}
                icon={<Award size={20} className="text-primary" />}
                size="lg"
                footer={
                    <Button variant="outline" onClick={() => skillsModal.close()}>
                        Cerrar
                    </Button>
                }
            >
                {skillsLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-slate-400 mt-2">Cargando habilidades...</p>
                    </div>
                ) : userSkills.length === 0 ? (
                    <div className="text-center py-8">
                        <Award size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500">Este usuario no tiene habilidades declaradas</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-400 mb-2">
                            {userSkills.length} habilidades declaradas. Puedes validar o ajustar el nivel de cada una.
                        </p>
                        {userSkills.map((skill) => (
                            <div
                                key={skill.id}
                                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Award size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {skill.skillName}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Nivel declarado: <span className="font-medium">{skill.level} — {getLevelLabel(skill.level)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {skill.lastValidatedAt ? (
                                            <Badge variant="success" icon={CheckCircle2}>
                                                Validada {skill.validatedByName ? `por ${skill.validatedByName}` : ''}
                                            </Badge>
                                        ) : (
                                            <Badge variant="warning">Pendiente</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Evidence */}
                                {skill.experienceDescription && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        {skill.experienceDescription}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Validate at current level */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={CheckCircle2}
                                        isLoading={validatingSkillId === skill.id && adjustingSkillId !== skill.id}
                                        onClick={() => handleValidateSkill(skill, null)}
                                    >
                                        Validar (nivel actual)
                                    </Button>

                                    {/* Toggle adjust level */}
                                    {adjustingSkillId === skill.id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setAdjustLevel((prev) => Math.max(1, prev - 1))}
                                                    className="p-0.5 hover:text-primary"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <span className="text-sm font-bold w-16 text-center text-slate-900 dark:text-white">
                                                    {adjustLevel} — {getLevelLabel(adjustLevel)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdjustLevel((prev) => Math.min(5, prev + 1))}
                                                    className="p-0.5 hover:text-primary"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                            </div>
                                            <Button
                                                size="sm"
                                                isLoading={validatingSkillId === skill.id}
                                                onClick={() => handleValidateSkill(skill, adjustLevel)}
                                            >
                                                Aplicar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setAdjustingSkillId(null)}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAdjustingSkillId(skill.id);
                                                setAdjustLevel(skill.level);
                                            }}
                                        >
                                            Ajustar nivel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UsersPage;
