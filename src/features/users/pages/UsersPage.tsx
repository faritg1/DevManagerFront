import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    Eye,
    Mail,
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
import { Button, Card, Badge, Avatar, Modal, Input, Select, PageContainer, PageHeader, TABLE_CLASS, THEAD_CLASS, TH_CLASS, TBODY_CLASS, TD_CLASS, EmptyState, LoadingBlock, Pager, ActionMenu, type ActionMenuItem } from '../../../shared/ui';
import { useModal, useIsAdmin, usePagedFilter, usePermission } from '../../../shared/hooks';
import { useNotification } from '../../../shared/context';
import { usersService, rbacService, skillsService } from '../../../shared/api';
import type { UserResponse, CreateUserRequest, UpdateUserRequest, RoleDto, EffectivePermissionsResponse, PermissionGroupDto, EmployeeSkillResponse, ValidateSkillRequest } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';
import { formatDate, skillLevelLabel } from '../../../shared/format';
import { AskAiButton } from '../../ai/AskAiButton';

const EMPTY_CREATE_FORM: CreateUserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    isEmployee: true
};

export const UsersPage: React.FC = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const isAdmin = useIsAdmin();
    const canValidateSkills = usePermission().has('menu.platform.skills.validate');
    
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pager = usePagedFilter(users, { searchFields: u => [u.fullName, u.email, u.roleName] });

    const createModal = useModal();
    const editModal = useModal();
    const deleteModal = useModal();
    const rolesModal = useModal();
    const permissionsModal = useModal();

    const [isSaving, setIsSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [createForm, setCreateForm] = useState<CreateUserRequest>(EMPTY_CREATE_FORM);
    const [createRoleId, setCreateRoleId] = useState('');
    const [editForm, setEditForm] = useState<UpdateUserRequest>({ firstName: '', lastName: '' });

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

    const skillsModal = useModal();
    const [userSkills, setUserSkills] = useState<EmployeeSkillResponse[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [validatingSkillId, setValidatingSkillId] = useState<string | null>(null);
    const [adjustingSkillId, setAdjustingSkillId] = useState<string | null>(null);
    const [adjustLevel, setAdjustLevel] = useState<number>(3);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await usersService.getAll();
            if (response.success && response.data) {
                const usersData = response.data;

                // List rows may lack roleName; resolve it from each user's effective permissions.
                const missingRole = usersData.filter(u => !u.roleName?.trim());
                const lookups = await Promise.allSettled(
                    missingRole.map((u) => rbacService.getUserEffectivePermissions(u.id)),
                );
                lookups.forEach((res, idx) => {
                    const name = res.status === 'fulfilled' && res.value.success ? res.value.data?.roles?.[0]?.name : undefined;
                    missingRole[idx].roleName = name || 'Sin rol';
                });

                setUsers(usersData);
            } else {
                setError(response.message || 'Error al cargar usuarios');
            }
        } catch {
            setError('Error de conexión al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (isSaving) return;
        if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim() || !createForm.password) {
            showNotification({
                type: 'error',
                message: 'Completa nombres, apellidos, email y contraseña'
            });
            return;
        }
        if (createForm.password.length < 8) {
            showNotification({ type: 'error', message: 'La contraseña debe tener mínimo 8 caracteres' });
            return;
        }

        setIsSaving(true);
        try {
            const response = await usersService.create(createForm);
            if (response.success) {
                const userId = response.data?.id;
                const roleAssigned = !createRoleId || !userId
                    || await rbacService.assignRoleToUser({ userId, roleId: createRoleId }).then(r => r.success, () => false);
                showNotification(roleAssigned
                    ? { type: 'success', message: 'Usuario creado exitosamente' }
                    : { type: 'warning', message: 'Usuario creado, pero no se pudo asignar el rol. Asígnalo desde "Gestionar roles".' });
                createModal.close();
                setCreateForm(EMPTY_CREATE_FORM);
                setCreateRoleId('');
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

    const handleOpenEdit = (user: UserResponse) => {
        setSelectedUser(user);
        setEditForm({
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            phone: user.phoneNumber || '',
            isActive: user.isActive,
            isEmployee: user.isEmployee ?? true
        });
        editModal.open();
    };

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
            } catch {
                showNotification({ type: 'error', message: 'No se pudieron cargar los roles del usuario' });
            } finally {
                setRolesLoading(false);
            }
        };

        loadRolesForUser();
    }, [rolesModal.isOpen, selectedUser]);

    // Roles for the optional role picker of the create modal.
    useEffect(() => {
        if (!createModal.isOpen || roles.length > 0) return;
        rbacService.getRoles().then(r => { if (r.success && r.data) setRoles(r.data); }, () => {});
    }, [createModal.isOpen]);

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
            } catch {
                showNotification({ type: 'error', message: 'No se pudieron cargar los permisos del usuario' });
            } finally {
                setPermsLoading(false);
            }
        };

        loadEffective();
    }, [permissionsModal.isOpen, selectedUser]);

    const handleAddOverride = async () => {
        if (!selectedUser || !overridePermId || overrideSaving) return;
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
            } catch {
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
                const refreshed = await skillsService.getEmployeeSkills(selectedUser!.id);
                if (refreshed.success && refreshed.data) setUserSkills(refreshed.data);
                setAdjustingSkillId(null);
            } else {
                showNotification({ type: 'error', message: resp.message || 'Error al validar skill' });
            }
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al validar' });
        } finally {
            setValidatingSkillId(null);
        }
    };

    const findRoleIdByName = (list: RoleDto[], name: string) => {
        const r = list.find(x => x.name === name);
        return r ? r.id : undefined;
    };

    const handleSaveEdit = async () => {
        if (!selectedUser || isSaving) return;
        if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
            showNotification({ type: 'error', message: 'Nombres y apellidos son obligatorios' });
            return;
        }

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

    const handleToggleStatus = async (user: UserResponse) => {
        try {
            // The backend requires both names on every PUT.
            const response = await usersService.update(user.id, {
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phoneNumber,
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
    };

    const handleOpenDelete = (user: UserResponse) => {
        setSelectedUser(user);
        deleteModal.open();
    };

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

    const userActions = (user: UserResponse): ActionMenuItem[] => {
        const open = (modal: { open: () => void }) => () => { setSelectedUser(user); modal.open(); };
        const items: ActionMenuItem[] = [
            { label: 'Ver perfil', icon: Eye, onSelect: () => navigate(ROUTES.USER_DETAIL.replace(':id', user.id)) },
        ];
        if (isAdmin) {
            items.push(
                { label: 'Editar', icon: Edit, onSelect: () => handleOpenEdit(user) },
                { label: 'Gestionar roles', icon: ShieldCheck, onSelect: open(rolesModal) },
                { label: 'Permisos efectivos', icon: Key, onSelect: open(permissionsModal) },
            );
        }
        items.push({ label: canValidateSkills ? 'Skills / Validar' : 'Skills', icon: Award, onSelect: open(skillsModal) });
        if (isAdmin) {
            items.push(
                user.isActive
                    ? { label: 'Desactivar', icon: UserX, onSelect: () => handleToggleStatus(user) }
                    : { label: 'Activar', icon: UserCheck, onSelect: () => handleToggleStatus(user) },
                { label: 'Eliminar', icon: Trash2, onSelect: () => handleOpenDelete(user), danger: true, separated: true },
            );
        }
        return items;
    };

    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;

    if (isLoading) {
        return (
            <LoadingBlock label="Cargando usuarios..." className="h-full py-20" />
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
        <PageContainer>
            <PageHeader
                title="Gestión de Usuarios"
                description="Administra el acceso y roles de los miembros del equipo."
                actions={<><AskAiButton moduleKey="admin" />{isAdmin && (
                    <Button icon={UserPlus} onClick={createModal.open}>
                        Invitar Usuario
                    </Button>
                )}</>}
            />

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
                        <UserX className="text-slate-500 dark:text-slate-400" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveUsers}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Inactivos</p>
                    </div>
                </Card>
            </div>

            <div className="mb-6">
                <Input
                    placeholder="Buscar por nombre, email o rol..." aria-label="Buscar usuarios"
                    icon={Search}
                    value={pager.query}
                    onChange={(e) => pager.setQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>
            
            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={TABLE_CLASS}>
                        <thead className={THEAD_CLASS}>
                            <tr>
                                <th className={TH_CLASS}>Usuario</th>
                                <th className={TH_CLASS}>Email</th>
                                <th className={TH_CLASS}>Rol</th>
                                <th className={TH_CLASS}>Estado</th>
                                <th className={TH_CLASS}>Creado</th>
                                <th className={`${TH_CLASS} text-right`}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className={TBODY_CLASS}>
                            {pager.total === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            title={pager.query ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                                            description={pager.query ? 'Prueba con otro nombre o correo.' : undefined}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                pager.pageItems.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-border-dark/50 transition-colors group">
                                        <td className={TD_CLASS}>
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
                                        <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} /> {user.email}
                                            </div>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <Badge variant="purple">
                                                {user.roleName}
                                            </Badge>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <Badge 
                                                variant={user.isActive ? 'success' : 'danger'} 
                                                dot
                                            >
                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </td>
                                        <td className={`${TD_CLASS} w-px text-right`}>
                                            <ActionMenu label={`Acciones de ${user.fullName}`} items={userActions(user)} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pager pager={pager} />
            </Card>

            <Modal
                isOpen={createModal.isOpen}
                onClose={createModal.close}
                onSubmit={handleCreate}
                title="Invitar Usuario"
                icon={<UserPlus className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" icon={UserPlus} isLoading={isSaving}>
                            Crear Usuario
                        </Button>
                        <Button variant="outline" onClick={createModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nombres *"
                            required
                            maxLength={80}
                            placeholder="Ej: Juan"
                            value={createForm.firstName}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                        <Input
                            label="Apellidos *"
                            required
                            maxLength={80}
                            placeholder="Ej: Pérez"
                            value={createForm.lastName}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                    </div>
                    <Input
                        label="Email *"
                        type="email"
                        required
                        autoComplete="off"
                        placeholder="juan@empresa.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                        label="Contraseña *"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Input
                        label="Teléfono"
                        placeholder="+57 300 123 4567"
                        maxLength={30}
                        value={createForm.phone || ''}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input type="checkbox" checked={createForm.isEmployee ?? true} onChange={(e) => setCreateForm(prev => ({ ...prev, isEmployee: e.target.checked }))} />
                        Es empleado (vinculación laboral)
                    </label>
                    <Select
                        label="Rol"
                        value={createRoleId}
                        onChange={(e) => setCreateRoleId(e.target.value)}
                        hint="Si no eliges un rol, el usuario solo verá su perfil hasta que se le asigne uno."
                    >
                        <option value="">Sin asignar</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                </div>
            </Modal>

            <Modal
                isOpen={editModal.isOpen}
                onClose={editModal.close}
                onSubmit={handleSaveEdit}
                title="Editar Usuario"
                icon={<Edit className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" icon={Edit} isLoading={isSaving}>
                            Guardar Cambios
                        </Button>
                        <Button variant="outline" onClick={editModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-background-dark rounded-xl mb-4">
                            <Avatar name={selectedUser.fullName} size="md" />
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">{selectedUser.fullName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Nombres *"
                                required
                                maxLength={80}
                                value={editForm.firstName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                            />
                            <Input
                                label="Apellidos *"
                                required
                                maxLength={80}
                                value={editForm.lastName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                            />
                        </div>
                        <Input
                            label="Teléfono"
                            maxLength={30}
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={editForm.isEmployee ?? true} onChange={(e) => setEditForm(prev => ({ ...prev, isEmployee: e.target.checked }))} />
                            Es empleado (vinculación laboral)
                        </label>
                        
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-background-dark rounded-xl">
                            <div>
                                <p id="user-status-label" className="font-semibold text-slate-900 dark:text-white">Estado del Usuario</p>
                                <p id="user-status-desc" className="text-sm text-slate-500 dark:text-slate-400">
                                    {editForm.isActive ? 'El usuario puede acceder al sistema' : 'El acceso está deshabilitado'}
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!!editForm.isActive}
                                aria-labelledby="user-status-label"
                                aria-describedby="user-status-desc"
                                onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={`relative w-14 h-8 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark ${
                                    editForm.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                            >
                                <span className={`absolute left-0 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                    editForm.isActive ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.close}
                title="Eliminar Usuario"
                icon={<Trash2 className="text-rose-500" size={20} />}
                size="sm"
                footer={
                    <>
                        <Button variant="danger" onClick={handleConfirmDelete} icon={Trash2} isLoading={isSaving}>
                            Eliminar
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
                        <LoadingBlock className="py-8" />
                    ) : (
                        roles.map((role) => {
                            const checked = userAssignedRoleIds.has(role.id);
                            return (
                                <label key={role.id} className="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-background-dark">
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
                                                } catch {
                                                    showNotification({ type: 'error', message: 'No se pudo actualizar el rol' });
                                                } finally {
                                                    setRolesSaving(false);
                                                }
                                            }}
                                            className="size-4"
                                        />
                                    </div>
                                </label>
                            );
                        })
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={permissionsModal.isOpen}
                onClose={() => { permissionsModal.close(); setEffectivePerms(null); setOverridePermId(''); setOverrideIsGrant(true); }}
                onSubmit={handleAddOverride}
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
                    <LoadingBlock className="py-8" />
                ) : effectivePerms ? (
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Roles asignados</p>
                            <div className="flex flex-wrap gap-2">
                                {effectivePerms.roles.length > 0
                                    ? effectivePerms.roles.map((r) => (
                                        <Badge key={r.name} variant="purple">{r.name}</Badge>
                                    ))
                                    : <span className="text-sm text-slate-500 dark:text-slate-400">Sin roles asignados</span>
                                }
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Permisos efectivos</p>
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
                                <span className="text-sm text-slate-500 dark:text-slate-400">Sin permisos efectivos</span>
                            )}
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Overrides directos</p>
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
                                <span className="text-sm text-slate-500 dark:text-slate-400">Sin overrides configurados</span>
                            )}
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Agregar / modificar override</p>
                            <div className="flex flex-col gap-3">
                                <Select
                                    label="Permiso *"
                                    required
                                    value={overridePermId}
                                    onChange={(e) => setOverridePermId(e.target.value)}
                                >
                                        <option value="">— Selecciona un permiso —</option>
                                        {groupedPerms.map((group) => (
                                            <optgroup key={group.module} label={group.module}>
                                                {group.permissions.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                </Select>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        aria-pressed={overrideIsGrant}
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
                                        aria-pressed={!overrideIsGrant}
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

                                <Button type="submit" icon={Plus} isLoading={overrideSaving}>
                                    Aplicar override
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">No hay permisos disponibles</div>
                )}
            </Modal>

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
                    <LoadingBlock label="Cargando habilidades..." className="py-8" />
                ) : userSkills.length === 0 ? (
                    <EmptyState title="Este usuario no tiene habilidades declaradas" icon={Award} className="py-8" />
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
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
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Nivel declarado: <span className="font-medium">{skill.level} — {skillLevelLabel(skill.level)}</span>
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

                                {skill.experienceDescription && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        {skill.experienceDescription}
                                    </p>
                                )}

                                {canValidateSkills && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={CheckCircle2}
                                        isLoading={validatingSkillId === skill.id && adjustingSkillId !== skill.id}
                                        onClick={() => handleValidateSkill(skill, null)}
                                    >
                                        Validar (nivel actual)
                                    </Button>

                                    {adjustingSkillId === skill.id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
                                                <button aria-label="Bajar nivel"
                                                    type="button"
                                                    onClick={() => setAdjustLevel((prev) => Math.max(1, prev - 1))}
                                                    className="p-0.5 hover:text-primary"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <span className="text-sm font-bold w-16 text-center text-slate-900 dark:text-white">
                                                    {adjustLevel} — {skillLevelLabel(adjustLevel)}
                                                </span>
                                                <button aria-label="Subir nivel"
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
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
};

