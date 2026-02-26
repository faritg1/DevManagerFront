import React, { useState, useEffect } from 'react';
import { 
    UserPlus, 
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
    Key
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input } from '../../../shared/ui';
import { useModal } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { usersService, rbacService } from '../../../shared/api';
import type { UserResponse, CreateUserRequest, UpdateUserRequest, RoleDto, EffectivePermissionsResponse } from '../../../shared/api/types';

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
                const resp = await rbacService.getUserEffectivePermissions(selectedUser.id);
                if (resp.success && resp.data) setEffectivePerms(resp.data);
            } catch (err) {
                console.error('Failed loading effective permissions', err);
            } finally {
                setPermsLoading(false);
            }
        };

        loadEffective();
    }, [permissionsModal.isOpen, selectedUser]);

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
                onClose={() => { permissionsModal.close(); setEffectivePerms(null); }}
                title={selectedUser ? `Permisos — ${selectedUser.fullName}` : 'Permisos'}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => { permissionsModal.close(); }}>
                            Cerrar
                        </Button>
                    </>
                }
            >
                {permsLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    </div>
                ) : effectivePerms ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-500 mb-2">Roles asignados</p>
                            <div className="flex flex-wrap gap-2">
                                {effectivePerms.roles.map((r) => (
                                    <Badge key={r.name} variant="purple">{r.name}</Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 mb-2">Permisos efectivos</p>
                            <div className="grid grid-cols-2 gap-2">
                                {effectivePerms.effectivePermissions.map((p) => (
                                    <div key={p.code} className="p-2 bg-slate-50 dark:bg-[#111b22] rounded-md text-sm text-slate-600 dark:text-slate-300">{p.code}</div>
                                ))}
                            </div>
                        </div>

                        {effectivePerms.directOverrides && effectivePerms.directOverrides.length > 0 && (
                            <div>
                                <p className="text-sm text-slate-500 mb-2">Overrides directos</p>
                                <div className="space-y-2">
                                    {effectivePerms.directOverrides.map((o) => (
                                        <div key={o.permissionCode} className="flex items-center gap-2 text-sm">
                                            <span className={`px-2 py-1 rounded ${o.isGranted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{o.isGranted ? 'Grant' : 'Revoke'}</span>
                                            <span className="text-slate-600 dark:text-slate-300">{o.permissionCode}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-slate-500">No hay permisos disponibles</div>
                )}
            </Modal>
        </div>
    );
};

export default UsersPage;
