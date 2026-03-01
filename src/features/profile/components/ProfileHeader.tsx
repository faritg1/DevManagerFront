import React from 'react';
import { Edit, Save, X, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { Avatar, Button, Badge } from '../../../shared/ui';
import type { ProfileResponse } from '../../../shared/api/types';

interface Props {
    userName?: string;
    userEmail?: string;
    userRole?: string;
    profile?: ProfileResponse | null;
    profileForm: any;
    catalogs: any;
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
    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
                <Avatar 
                    name={userName || 'Usuario'} 
                    size="xl"
                    className="h-28 w-28 text-3xl"
                />
                <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full text-white">
                    <CheckCircle2 size={16} />
                </div>
            </div>

            <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black">
                            {userName || 'Mi Perfil'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {userEmail}
                        </p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <Badge variant="purple">{userRole || 'Usuario'}</Badge>

                            {/* Seniority */}
                            { (profile?.seniorityLevelId || profileForm.seniorityLevelId) && (
                                <Badge variant="default">
                                    {catalogs?.seniorityLevels?.find(s => s.id === (profileForm.seniorityLevelId ?? profile?.seniorityLevelId))?.name}
                                </Badge>
                            )}

                            {profile?.yearsExperience && (
                                <Badge variant="info">
                                    {profile.yearsExperience} años de experiencia
                                </Badge>
                            )}
                        </div>
                    </div>
                    
                    {!isEditing ? (
                        <div className="flex gap-2 items-center">
                            {onDelete && profile && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={onDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                icon={Edit}
                                onClick={onStartEdit}
                            >
                                Editar Perfil
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button 
                                variant="outline"
                                icon={X}
                                onClick={onCancelEdit}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                icon={isSaving ? Loader2 : Save}
                                onClick={onSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
