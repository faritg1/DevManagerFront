import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { usersService } from '../../../shared/api';
import type { UpdateUserRequest, UserResponse } from '../../../shared/api/types';
import { useNotification } from '../../../shared/context';
import { Avatar, FormPanel, FormSection, Input } from '../../../shared/ui';

interface UserEditPanelProps {
    /** The user being edited; null keeps the panel closed. Give the panel a `key` per user so each opening starts from that user's data. */
    user: UserResponse | null;
    onClose: () => void;
    onSaved: () => void;
}

const toForm = (user: UserResponse | null): UpdateUserRequest => ({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phoneNumber || '',
    isActive: user?.isActive,
    isEmployee: user?.isEmployee ?? true,
});

/** Form to edit a user's names, phone, employment flag and access. */
export const UserEditPanel: React.FC<UserEditPanelProps> = ({ user, onClose, onSaved }) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState(() => toForm(user));

    const set = <K extends keyof UpdateUserRequest>(key: K, value: UpdateUserRequest[K]) => setForm((prev) => ({ ...prev, [key]: value }));

    const save = async () => {
        if (!user) return;
        // Empty names never get here: the fields are `required`. No try/catch: an API error rejects and the panel shows it.
        await usersService.update(user.id, form);
        showNotification({ type: 'success', message: 'Usuario actualizado exitosamente' });
        onClose();
        onSaved();
    };

    return (
        <FormPanel
            isOpen={!!user}
            onClose={onClose}
            onSubmit={save}
            title="Editar Usuario"
            icon={<Edit className="text-primary" size={20} />}
            submitText="Guardar Cambios"
            // The status switch is a button: it emits no input or change event.
            dirty={!!user && !!form.isActive !== user.isActive}
        >
            {user && (
                <FormSection>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-background-dark rounded-xl sm:col-span-2">
                        <Avatar name={user.fullName} size="md" />
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                    </div>

                    <Input label="Nombres *" required maxLength={80} name="firstName" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
                    <Input label="Apellidos *" required maxLength={80} name="lastName" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                    <Input label="Teléfono" maxLength={30} name="phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
                    <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700 dark:text-slate-300">
                        <input type="checkbox" name="isEmployee" checked={form.isEmployee ?? true} onChange={(e) => set('isEmployee', e.target.checked)} />
                        Es empleado (vinculación laboral)
                    </label>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-background-dark rounded-xl sm:col-span-2">
                        <div>
                            <p id="user-status-label" className="font-semibold text-slate-900 dark:text-white">Estado del Usuario</p>
                            <p id="user-status-desc" className="text-sm text-slate-500 dark:text-slate-400">
                                {form.isActive ? 'El usuario puede acceder al sistema' : 'El acceso está deshabilitado'}
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={!!form.isActive}
                            aria-labelledby="user-status-label"
                            aria-describedby="user-status-desc"
                            onClick={() => set('isActive', !form.isActive)}
                            className={`relative w-14 h-8 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark ${
                                form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                        >
                            <span className={`absolute left-0 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </FormSection>
            )}
        </FormPanel>
    );
};
