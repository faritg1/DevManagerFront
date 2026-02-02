import React, { useState, useEffect } from 'react';
import { 
    User, 
    Briefcase, 
    Link as LinkIcon,
    Github,
    Linkedin,
    Globe,
    Edit,
    Save,
    X,
    Loader2,
    AlertCircle,
    Plus,
    Award,
    CheckCircle2,
    Clock,
    Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Input, Avatar, Modal } from '../../../shared/ui';
import { useAuth, useNotification } from '../../../shared/context';
import { useModal } from '../../../shared/hooks';
import { profileService, skillsService } from '../../../shared/api';
import type { 
    ProfileResponse, 
    UpdateProfileRequest,
    EmployeeSkillResponse,
    SkillDto,
    UpsertEmployeeSkillRequest
} from '../../../shared/api/types';

// Helpers
const getLevelLabel = (level: number): string => {
    const levels: Record<number, string> = {
        1: 'Básico',
        2: 'Intermedio', 
        3: 'Competente',
        4: 'Avanzado',
        5: 'Experto'
    };
    return levels[level] || `Nivel ${level}`;
};

const getLevelColor = (level: number): string => {
    if (level >= 5) return 'text-purple-500';
    if (level >= 4) return 'text-blue-500';
    if (level >= 3) return 'text-emerald-500';
    if (level >= 2) return 'text-yellow-500';
    return 'text-slate-400';
};

const getLevelBg = (level: number): string => {
    if (level >= 5) return 'bg-purple-50 dark:bg-purple-500/10';
    if (level >= 4) return 'bg-blue-50 dark:bg-blue-500/10';
    if (level >= 3) return 'bg-emerald-50 dark:bg-emerald-500/10';
    if (level >= 2) return 'bg-yellow-50 dark:bg-yellow-500/10';
    return 'bg-slate-50 dark:bg-slate-500/10';
};

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    
    // Profile state
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});

    // Skills state
    const [mySkills, setMySkills] = useState<EmployeeSkillResponse[]>([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(true);
    
    // Add skill modal
    const skillModal = useModal();
    const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
    const [loadingAvailableSkills, setLoadingAvailableSkills] = useState(false);
    const [savingSkill, setSavingSkill] = useState(false);
    const [skillForm, setSkillForm] = useState<UpsertEmployeeSkillRequest>({
        skillId: '',
        level: 3,
        evidenceUrl: ''
    });

    // Cargar perfil
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const response = await profileService.getMyProfile();
                if (response.success) {
                    setProfile(response.data);
                    setProfileForm({
                        bio: response.data?.bio || '',
                        yearsExperience: response.data?.yearsExperience || 0,
                        linkedinUrl: response.data?.linkedinUrl || '',
                        githubUrl: response.data?.githubUrl || '',
                        portfolioUrl: response.data?.portfolioUrl || ''
                    });
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchProfile();
    }, []);

    // Cargar mis skills
    useEffect(() => {
        const fetchMySkills = async () => {
            if (!user?.id) return;
            
            setIsLoadingSkills(true);
            try {
                const response = await skillsService.getEmployeeSkills(user.id);
                if (response.success && response.data) {
                    setMySkills(response.data);
                }
            } catch (err) {
                console.error('Error loading skills:', err);
            } finally {
                setIsLoadingSkills(false);
            }
        };

        fetchMySkills();
    }, [user?.id]);

    // Guardar perfil
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const response = await profileService.updateMyProfile(profileForm);
            if (response.success) {
                setProfile(prev => prev ? { ...prev, ...profileForm } : null);
                setIsEditing(false);
                showNotification({
                    type: 'success',
                    message: 'Perfil actualizado exitosamente'
                });
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al actualizar perfil'
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

    // Abrir modal de agregar skill
    const handleOpenSkillModal = async () => {
        skillModal.open();
        setSkillForm({ skillId: '', level: 3, evidenceUrl: '' });
        
        if (availableSkills.length === 0) {
            setLoadingAvailableSkills(true);
            try {
                const response = await skillsService.getAll();
                if (response.success && response.data) {
                    // Filtrar skills que ya tengo
                    const mySkillIds = mySkills.map(s => s.skillId);
                    const filtered = response.data.filter(s => !mySkillIds.includes(s.id));
                    setAvailableSkills(filtered);
                }
            } catch (err) {
                console.error('Error loading skills:', err);
            } finally {
                setLoadingAvailableSkills(false);
            }
        }
    };

    // Guardar skill
    const handleSaveSkill = async () => {
        if (!skillForm.skillId) {
            showNotification({
                type: 'error',
                message: 'Selecciona una habilidad'
            });
            return;
        }

        setSavingSkill(true);
        try {
            const response = await skillsService.upsertEmployeeSkill(skillForm);
            if (response.success) {
                showNotification({
                    type: 'success',
                    message: 'Habilidad agregada exitosamente'
                });
                skillModal.close();
                
                // Refrescar mis skills
                if (user?.id) {
                    const skillsRes = await skillsService.getEmployeeSkills(user.id);
                    if (skillsRes.success && skillsRes.data) {
                        setMySkills(skillsRes.data);
                        // Actualizar skills disponibles
                        setAvailableSkills(prev => prev.filter(s => s.id !== skillForm.skillId));
                    }
                }
            } else {
                showNotification({
                    type: 'error',
                    message: response.message || 'Error al agregar habilidad'
                });
            }
        } catch (err) {
            showNotification({
                type: 'error',
                message: 'Error de conexión'
            });
        } finally {
            setSavingSkill(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar grande */}
                    <div className="relative">
                        <Avatar 
                            name={user?.name || 'Usuario'} 
                            size="xl"
                            className="h-28 w-28 text-3xl"
                        />
                        <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full text-white">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-slate-900 dark:text-white text-3xl font-black">
                                    {user?.name || 'Mi Perfil'}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {user?.email}
                                </p>
                                <div className="flex items-center gap-3 mt-3">
                                    <Badge variant="purple">{user?.role || 'Usuario'}</Badge>
                                    {profile?.yearsExperience && (
                                        <Badge variant="info">
                                            {profile.yearsExperience} años de experiencia
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            
                            {!isEditing ? (
                                <Button 
                                    variant="outline" 
                                    icon={Edit}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Editar Perfil
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline"
                                        icon={X}
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        icon={isSaving ? Loader2 : Save}
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna izquierda - Info personal */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Bio */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="text-primary" size={20} />
                                    Acerca de mí
                                </CardTitle>
                            </CardHeader>
                            
                            {isEditing ? (
                                <textarea
                                    value={profileForm.bio || ''}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Escribe una breve descripción sobre ti, tu experiencia y lo que te apasiona..."
                                    rows={4}
                                    className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white placeholder:text-slate-400 p-4 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                                />
                            ) : (
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {profile?.bio || 'No has agregado una descripción aún. Haz clic en "Editar Perfil" para agregar información sobre ti.'}
                                </p>
                            )}
                        </Card>

                        {/* Información profesional */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="text-primary" size={20} />
                                    Información Profesional
                                </CardTitle>
                            </CardHeader>

                            <div className="space-y-4">
                                {/* Años de experiencia */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Años de Experiencia
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={profileForm.yearsExperience || ''}
                                            onChange={(e) => setProfileForm(prev => ({ 
                                                ...prev, 
                                                yearsExperience: parseInt(e.target.value) || 0 
                                            }))}
                                            placeholder="Ej: 5"
                                        />
                                    ) : (
                                        <p className="text-slate-900 dark:text-white">
                                            {profile?.yearsExperience ?? 'No especificado'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Enlaces */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LinkIcon className="text-primary" size={20} />
                                    Enlaces
                                </CardTitle>
                            </CardHeader>

                            <div className="space-y-4">
                                {/* LinkedIn */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                        <Linkedin className="text-blue-600" size={20} />
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            value={profileForm.linkedinUrl || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                            placeholder="https://linkedin.com/in/tu-perfil"
                                            className="flex-1"
                                        />
                                    ) : profile?.linkedinUrl ? (
                                        <a 
                                            href={profile.linkedinUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            {profile.linkedinUrl}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400">No configurado</span>
                                    )}
                                </div>

                                {/* GitHub */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-500/10">
                                        <Github className="text-slate-700 dark:text-slate-300" size={20} />
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            value={profileForm.githubUrl || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                                            placeholder="https://github.com/tu-usuario"
                                            className="flex-1"
                                        />
                                    ) : profile?.githubUrl ? (
                                        <a 
                                            href={profile.githubUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            {profile.githubUrl}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400">No configurado</span>
                                    )}
                                </div>

                                {/* Portfolio */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                                        <Globe className="text-purple-500" size={20} />
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            value={profileForm.portfolioUrl || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                            placeholder="https://tu-portafolio.com"
                                            className="flex-1"
                                        />
                                    ) : profile?.portfolioUrl ? (
                                        <a 
                                            href={profile.portfolioUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            {profile.portfolioUrl}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400">No configurado</span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Columna derecha - Skills */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Award className="text-primary" size={20} />
                                        Mis Habilidades
                                        <Badge variant="default">{mySkills.length}</Badge>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={Plus}
                                        onClick={handleOpenSkillModal}
                                    >
                                        Agregar
                                    </Button>
                                </CardTitle>
                            </CardHeader>

                            {isLoadingSkills ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="animate-spin text-primary" size={24} />
                                </div>
                            ) : mySkills.length === 0 ? (
                                <div className="text-center py-8">
                                    <Award className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                                        No has agregado habilidades aún
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={Plus}
                                        onClick={handleOpenSkillModal}
                                    >
                                        Agregar mi primera habilidad
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {mySkills.map((skill) => (
                                        <div 
                                            key={skill.id}
                                            className={`p-3 rounded-xl ${getLevelBg(skill.level)} border border-transparent hover:border-slate-200 dark:hover:border-[#233948] transition-all`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {skill.skillName}
                                                </span>
                                                <Badge 
                                                    variant={skill.level >= 4 ? 'success' : skill.level >= 3 ? 'info' : 'default'}
                                                >
                                                    {getLevelLabel(skill.level)}
                                                </Badge>
                                            </div>
                                            
                                            {/* Barra de nivel */}
                                            <div className="flex gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((lvl) => (
                                                    <div 
                                                        key={lvl}
                                                        className={`h-1.5 flex-1 rounded-full ${
                                                            lvl <= skill.level 
                                                                ? 'bg-primary' 
                                                                : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Validación */}
                                            <div className="flex items-center gap-1.5 text-xs">
                                                {skill.lastValidatedAt ? (
                                                    <>
                                                        <CheckCircle2 className="text-emerald-500" size={12} />
                                                        <span className="text-emerald-600 dark:text-emerald-400">
                                                            Validado por {skill.validatedByName}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="text-slate-400" size={12} />
                                                        <span className="text-slate-500">
                                                            Pendiente de validación
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal Agregar Skill */}
            <Modal
                isOpen={skillModal.isOpen}
                onClose={skillModal.close}
                title="Agregar Habilidad"
                icon={<Award className="text-primary" size={20} />}
                size="md"
                footer={
                    <>
                        <Button 
                            onClick={handleSaveSkill}
                            disabled={savingSkill || !skillForm.skillId}
                            icon={savingSkill ? Loader2 : Plus}
                        >
                            {savingSkill ? 'Guardando...' : 'Agregar Habilidad'}
                        </Button>
                        <Button variant="outline" onClick={skillModal.close}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    {/* Selector de Skill */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Habilidad *
                        </label>
                        {loadingAvailableSkills ? (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Loader2 className="animate-spin" size={16} />
                                Cargando habilidades...
                            </div>
                        ) : (
                            <select
                                value={skillForm.skillId}
                                onChange={(e) => setSkillForm(prev => ({ ...prev, skillId: e.target.value }))}
                                className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            >
                                <option value="">Seleccionar habilidad...</option>
                                {availableSkills.map(skill => (
                                    <option key={skill.id} value={skill.id}>
                                        {skill.name} {skill.category && `(${skill.category})`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Nivel de dominio */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Nivel de Dominio *
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setSkillForm(prev => ({ ...prev, level }))}
                                    className={`
                                        p-3 rounded-xl border text-center transition-all
                                        ${skillForm.level === level
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-200 dark:border-[#233948] hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <p className="text-lg font-bold">{level}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {getLevelLabel(level)}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* URL de evidencia */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">
                            Evidencia (opcional)
                        </label>
                        <Input
                            value={skillForm.evidenceUrl || ''}
                            onChange={(e) => setSkillForm(prev => ({ ...prev, evidenceUrl: e.target.value }))}
                            placeholder="https://github.com/tu-proyecto o certificación"
                            icon={LinkIcon}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Agrega un link a un proyecto, repositorio o certificación que demuestre tu dominio.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;
