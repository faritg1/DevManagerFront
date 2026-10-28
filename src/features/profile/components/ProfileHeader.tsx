import React from 'react';
import { Edit, Save, X, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { Avatar, Button, Badge, PageHeader } from '../../../shared/ui';
import type { ProfileResponse, UpdateProfileRequest, AllConfigCatalogsDto } from '../../../shared/api/types';

interface Props {
    userName?: string;
    userEmail?: string;
    userRole?: string;
    profile?: ProfileResponse | null;
    profileForm: UpdateProfileRequest;
    catalogs: AllConfigCatalogsDto | null;
    isEditing: boolean;
    isSaving: boolean;
    isDeleting?: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSave: () => void;
    onDelete?: () => void;
}

export const ProfileHeader: React.FC<Props> = ({
    userName,
    userEmail,
    userRole,
    profile,
    profileForm,
    catalogs,
    isEditing,
    isSaving,
    isDeleting,
    onStartEdit,
    onCancelEdit,
    onSave,
    onDelete,
}) => {
    const seniority = catalogs?.seniorityLevels?.find(s => s.id === (profileForm.seniorityLevelId ?? profile?.seniorityLevelId))?.name;
    return (
        <PageHeader
            className="!mb-0"
            icon={
                <span className="relative mr-2 shrink-0" aria-hidden="true">
                    <Avatar name={userName || 'Usuario'} size="xl" />
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white">
                        <CheckCircle2 size={12} />
                    </span>
                </span>
            }
            title={userName || 'Mi Perfil'}
            description={
                <span className="flex flex-col gap-3">
                    <span>{userEmail}</span>
                    <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="purple">{userRole || 'Usuario'}</Badge>
                        {seniority && <Badge variant="default">{seniority}</Badge>}
                        {profile?.yearsExperience && (
                            <Badge variant="info">{profile.yearsExperience} años de experiencia</Badge>
                        )}
                    </span>
                </span>
            }
            actions={!isEditing ? (<>
                {onDelete && profile && (
                    <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete} disabled={isDeleting}>
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                )}
                <Button variant="outline" icon={Edit} onClick={onStartEdit}>
                    Editar Perfil
                </Button>
            </>) : (<>
                <Button variant="outline" icon={X} onClick={onCancelEdit}>
                    Cancelar
                </Button>
                <Button icon={isSaving ? Loader2 : Save} onClick={onSave} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
            </>)}
        />
    );
};
