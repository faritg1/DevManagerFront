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
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input, PageContainer, PageHeader, TABLE_CLASS, THEAD_CLASS, TH_CLASS, TBODY_CLASS, TD_CLASS, EmptyState, LoadingBlock, Pager, ActionMenu, ExportButton, type ActionMenuItem } from '../../../shared/ui';
import { useModal, useIsAdmin, usePagedFilter, usePermission } from '../../../shared/hooks';
import { useAuth, useNotification } from '../../../shared/context';
import { usersService, rbacService } from '../../../shared/api';
import type { UserResponse } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';
import { formatDate } from '../../../shared/format';
import { AskAiButton } from '../../ai/AskAiButton';
import { UserCreatePanel } from '../components/UserCreatePanel';
import { UserEditPanel } from '../components/UserEditPanel';
import { UserRolesDialog } from '../components/UserRolesDialog';
import { UserPermissionsDialog } from '../components/UserPermissionsDialog';
import { UserSkillsDialog } from '../components/UserSkillsDialog';
import type { CsvColumn } from '../../../shared/export';

const EXPORT_COLUMNS: CsvColumn<UserResponse>[] = [
    { header: 'Nombre', value: (u) => u.fullName },
    { header: 'Email', value: (u) => u.email },
    { header: 'Teléfono', value: (u) => u.phoneNumber },
    { header: 'Rol', value: (u) => u.roleName },
    { header: 'Estado', value: (u) => (u.isActive ? 'Activo' : 'Inactivo') },
    { header: 'Creado', value: (u) => formatDate(u.createdAt, undefined, '') },
];

/** The per-user dialog that is open, if any. */
interface UserDialog { kind: 'roles' | 'permissions' | 'skills'; user: UserResponse }

export const UsersPage: React.FC = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const isAdmin = useIsAdmin();
    const canValidateSkills = usePermission().has('menu.platform.skills.validate');
    // Nobody validates their own skills (the API answers 403): hide the buttons on the caller's own row
    const { user: me } = useAuth();
    
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pager = usePagedFilter(users, { searchFields: u => [u.fullName, u.email, u.roleName] });

    const createModal = useModal();
    const deleteModal = useModal();

    const [isSaving, setIsSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [editing, setEditing] = useState<UserResponse | null>(null);
    const [dialog, setDialog] = useState<UserDialog | null>(null);
    const closeDialog = () => setDialog(null);

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
        const open = (kind: UserDialog['kind']) => () => setDialog({ kind, user });
        const items: ActionMenuItem[] = [
            { label: 'Ver perfil', icon: Eye, onSelect: () => navigate(ROUTES.USER_DETAIL.replace(':id', user.id)) },
        ];
        if (isAdmin) {
            items.push(
                { label: 'Editar', icon: Edit, onSelect: () => setEditing(user) },
                { label: 'Gestionar roles', icon: ShieldCheck, onSelect: open('roles') },
                { label: 'Permisos efectivos', icon: Key, onSelect: open('permissions') },
            );
        }
        items.push({ label: canValidateSkills && user.id !== me?.id ? 'Skills / Validar' : 'Skills', icon: Award, onSelect: open('skills') });
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

    // Only the first load blanks the page: a refresh keeps the table and any open dialog mounted.
    if (isLoading && users.length === 0) {
        return (
            <LoadingBlock label="Cargando usuarios..." className="h-full py-20" />
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-4">
                    <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
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
                        <UserCheck className="text-emerald-700 dark:text-emerald-400" size={24} />
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

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full max-w-md">
                    <Input
                        placeholder="Buscar por nombre, email o rol..." aria-label="Buscar usuarios"
                        icon={Search}
                        value={pager.query}
                        onChange={(e) => pager.setQuery(e.target.value)}
                    />
                </div>
                <div className="sm:ml-auto"><ExportButton rows={pager.filtered} columns={EXPORT_COLUMNS} filename="usuarios" /></div>
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

            <UserCreatePanel isOpen={createModal.isOpen} onClose={createModal.close} onCreated={fetchUsers} />
            <UserEditPanel key={editing?.id ?? 'closed'} user={editing} onClose={() => setEditing(null)} onSaved={fetchUsers} />

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.close}
                title="Eliminar Usuario"
                icon={<Trash2 className="text-rose-600 dark:text-rose-400" size={20} />}
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

            <UserRolesDialog user={dialog?.kind === 'roles' ? dialog.user : null} onClose={closeDialog} onChanged={fetchUsers} />
            <UserPermissionsDialog user={dialog?.kind === 'permissions' ? dialog.user : null} onClose={closeDialog} />
            <UserSkillsDialog user={dialog?.kind === 'skills' ? dialog.user : null} onClose={closeDialog} />
        </PageContainer>
    );
};

