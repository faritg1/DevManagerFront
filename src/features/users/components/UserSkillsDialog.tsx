import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { skillsService } from '../../../shared/api';
import type { EmployeeSkillResponse, UserResponse } from '../../../shared/api/types';
import { useAuth, useNotification } from '../../../shared/context';
import { skillLevelLabel } from '../../../shared/format';
import { usePermission } from '../../../shared/hooks';
import { Badge, Button, EmptyState, LoadingBlock, Modal } from '../../../shared/ui';

interface UserSkillsDialogProps {
    /** The user whose skills are shown; null keeps the dialog closed. */
    user: UserResponse | null;
    onClose: () => void;
}

/** Declared skills of one user; whoever holds the permission validates each one at its level or at an adjusted one. */
export const UserSkillsDialog: React.FC<UserSkillsDialogProps> = ({ user, onClose }) => {
    const { showNotification } = useNotification();
    const { user: me } = useAuth();
    const isOwn = user?.id === me?.id;
    // Nobody validates their own skills (the API answers 403).
    const canValidate = usePermission().has('menu.platform.skills.validate') && !isOwn;
    const [skills, setSkills] = useState<EmployeeSkillResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [validatingId, setValidatingId] = useState<string | null>(null);
    /** The skill whose level is being adjusted, with the level picked so far. */
    const [adjusting, setAdjusting] = useState<{ id: string; level: number } | null>(null);
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;
        let alive = true;
        setSkills([]);
        setAdjusting(null);
        setLoading(true);
        skillsService.getEmployeeSkills(userId)
            .then((r) => { if (alive) setSkills(r.data ?? []); }, () => { if (alive) setSkills([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [userId]);

    const validate = async (skill: EmployeeSkillResponse, newLevel: number | null) => {
        if (!userId) return;
        setValidatingId(skill.id);
        try {
            const res = await skillsService.validateSkill(skill.id, { newLevel });
            if (!res.success) {
                showNotification({ type: 'error', message: res.message || 'Error al validar skill' });
                return;
            }
            showNotification({
                type: 'success',
                message: newLevel
                    ? `Skill "${skill.skillName}" validada y ajustada a nivel ${newLevel}`
                    : `Skill "${skill.skillName}" validada exitosamente`,
            });
            const refreshed = await skillsService.getEmployeeSkills(userId);
            if (refreshed.data) setSkills(refreshed.data);
            setAdjusting(null);
        } catch {
            showNotification({ type: 'error', message: 'Error de conexión al validar' });
        } finally {
            setValidatingId(null);
        }
    };

    const stepLevel = (delta: number) => setAdjusting((a) => a && { ...a, level: Math.min(5, Math.max(1, a.level + delta)) });

    return (
        <Modal
            isOpen={!!user}
            onClose={onClose}
            title={user ? `Skills — ${user.fullName}` : 'Skills'}
            icon={<Award size={20} className="text-primary" />}
            size="lg"
            footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
        >
            {loading ? (
                <LoadingBlock label="Cargando habilidades..." className="py-8" />
            ) : skills.length === 0 ? (
                <EmptyState title="Este usuario no tiene habilidades declaradas" icon={Award} className="py-8" />
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {skills.length} habilidades declaradas.{' '}
                        {isOwn ? 'Son tus propias habilidades: debe validarlas otra persona.' : canValidate && 'Puedes validar o ajustar el nivel de cada una.'}
                    </p>
                    {skills.map((skill) => {
                        const isAdjusting = adjusting?.id === skill.id;
                        return (
                            <div key={skill.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Award size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{skill.skillName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Nivel declarado: <span className="font-medium">{skill.level} — {skillLevelLabel(skill.level)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {skill.lastValidatedAt ? (
                                        <Badge variant="success" icon={CheckCircle2}>
                                            Validada {skill.validatedByName ? `por ${skill.validatedByName}` : ''}
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning">Pendiente</Badge>
                                    )}
                                </div>

                                {skill.experienceDescription && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        {skill.experienceDescription}
                                    </p>
                                )}

                                {canValidate && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={CheckCircle2}
                                            isLoading={validatingId === skill.id && !isAdjusting}
                                            onClick={() => validate(skill, null)}
                                        >
                                            Validar (nivel actual)
                                        </Button>

                                        {isAdjusting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
                                                    <button aria-label="Bajar nivel" type="button" onClick={() => stepLevel(-1)} className="p-0.5 hover:text-primary-600 dark:hover:text-primary">
                                                        <ChevronDown size={16} />
                                                    </button>
                                                    <span className="text-sm font-bold w-16 text-center text-slate-900 dark:text-white">
                                                        {adjusting.level} — {skillLevelLabel(adjusting.level)}
                                                    </span>
                                                    <button aria-label="Subir nivel" type="button" onClick={() => stepLevel(1)} className="p-0.5 hover:text-primary-600 dark:hover:text-primary">
                                                        <ChevronUp size={16} />
                                                    </button>
                                                </div>
                                                <Button size="sm" isLoading={validatingId === skill.id} onClick={() => validate(skill, adjusting.level)}>
                                                    Aplicar
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setAdjusting(null)}>
                                                    Cancelar
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => setAdjusting({ id: skill.id, level: skill.level })}>
                                                Ajustar nivel
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
};
