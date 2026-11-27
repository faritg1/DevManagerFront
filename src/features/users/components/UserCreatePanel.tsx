import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { rbacService, usersService } from '../../../shared/api';
import type { CreateUserRequest, RoleDto } from '../../../shared/api/types';
import { useNotification } from '../../../shared/context';
import { FormPanel, FormSection, Input, Select } from '../../../shared/ui';

const EMPTY_FORM: CreateUserRequest = { firstName: '', lastName: '', email: '', password: '', phone: '', isEmployee: true };
const MIN_PASSWORD_LENGTH = 8;

interface UserCreatePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

/** Form to invite a user, with an optional first role assigned right after the user exists. */
export const UserCreatePanel: React.FC<UserCreatePanelProps> = ({ isOpen, onClose, onCreated }) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState<CreateUserRequest>(EMPTY_FORM);
    const [roleId, setRoleId] = useState('');
    const [passwordTooShort, setPasswordTooShort] = useState(false);
    const [roles, setRoles] = useState<RoleDto[]>([]);

    // The role picker is optional: its options load the first time the panel opens.
    useEffect(() => {
        if (!isOpen || roles.length > 0) return;
        let alive = true;
        rbacService.getRoles().then((r) => { if (alive && r.data) setRoles(r.data); }, () => {});
        return () => { alive = false; };
    }, [isOpen, roles.length]);

    const set = <K extends keyof CreateUserRequest>(key: K, value: CreateUserRequest[K]) => setForm((prev) => ({ ...prev, [key]: value }));

    const create = async () => {
        // Empty names, email and password never get here: the fields are `required`.
        if (form.password.length < MIN_PASSWORD_LENGTH) {
            setPasswordTooShort(true);
            return;
        }

        // No try/catch: an API error rejects and the panel shows it.
        const response = await usersService.create(form);
        const userId = response.data?.id;
        const roleAssigned = !roleId || !userId
            || await rbacService.assignRoleToUser({ userId, roleId }).then((r) => r.success, () => false);
        showNotification(roleAssigned
            ? { type: 'success', message: 'Usuario creado exitosamente' }
            : { type: 'warning', message: 'Usuario creado, pero no se pudo asignar el rol. Asígnalo desde "Gestionar roles".' });
        onClose();
        setForm(EMPTY_FORM);
        setRoleId('');
        onCreated();
    };

    return (
        <FormPanel
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={create}
            title="Invitar Usuario"
            icon={<UserPlus className="text-primary" size={20} />}
            submitText="Crear Usuario"
        >
            <FormSection>
                <Input label="Nombres *" required maxLength={80} placeholder="Ej: Juan" name="firstName" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
                <Input label="Apellidos *" required maxLength={80} placeholder="Ej: Pérez" name="lastName" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                <Input
                    label="Email *"
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="juan@empresa.com"
                    name="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                />
                <Input
                    label="Contraseña *"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                    name="password"
                    value={form.password}
                    onChange={(e) => { setPasswordTooShort(false); set('password', e.target.value); }}
                    error={passwordTooShort ? `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres` : undefined}
                />
                <Input label="Teléfono" placeholder="+57 300 123 4567" name="phone" maxLength={30} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
                <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" name="isEmployee" checked={form.isEmployee ?? true} onChange={(e) => set('isEmployee', e.target.checked)} />
                    Es empleado (vinculación laboral)
                </label>
                <div className="sm:col-span-2">
                    <Select
                        label="Rol"
                        name="roleId"
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        hint="Si no eliges un rol, el usuario solo verá su perfil hasta que se le asigne uno."
                    >
                        <option value="">Sin asignar</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                </div>
            </FormSection>
        </FormPanel>
    );
};
