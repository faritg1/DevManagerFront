import React from 'react';
import { Card, CardHeader, CardTitle, Button, Badge } from '../../../shared/ui';
import { Award, Loader2, Plus, Edit, Trash2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import type { EmployeeSkillResponse } from '../../../shared/api/types';

interface Props {
    skills: EmployeeSkillResponse[];
    isLoading: boolean;
    opLoading: boolean;
    validatingSkillId?: string | null;
    onAdd: () => void;
    onEdit: (skill: EmployeeSkillResponse) => void;
    onDelete: (skill: EmployeeSkillResponse) => void;
    onValidateAI?: (skill: EmployeeSkillResponse) => void;
    catalogs: any;
}

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

export const SkillsSection: React.FC<Props> = ({
    skills,
    isLoading,
    opLoading,
    validatingSkillId,
    onAdd,
    onEdit,
    onDelete,
    onValidateAI,
    catalogs,
}) => {
    const getLevelLabel = (levelId: number) => {
        return catalogs?.skillLevels.find(l => l.id === levelId)?.name || `Nivel ${levelId}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Award className="text-primary" size={20} />
                        Mis Habilidades
                        <Badge variant="default">{skills.length}</Badge>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        icon={Plus}
                        onClick={onAdd}
                        disabled={opLoading}
                    >
                        Agregar
                    </Button>
                </CardTitle>
            </CardHeader>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={24} />
                </div>
            ) : skills.length === 0 ? (
                <div className="text-center py-8">
                    <Award className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        No has agregado habilidades aún
                    </p>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        icon={Plus}
                        onClick={onAdd}
                    >
                        Agregar mi primera habilidad
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {skills.map((skill) => (
                        <div 
                            key={skill.id}
                            className={`p-3 rounded-xl ${getLevelBg(skill.level)} border border-transparent hover:border-slate-200 dark:hover:border-[#233948] transition-all relative`}
                        >
                            {opLoading && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary" />
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {skill.skillName}
                                </span>

                                <div className="flex items-center gap-2">
                                    <Badge 
                                        variant={skill.level >= 4 ? 'success' : skill.level >= 3 ? 'info' : 'default'}
                                    >
                                        {getLevelLabel(skill.level)}
                                    </Badge>
                                    <div className="flex gap-1">
                                        {onValidateAI && (
                                            <button
                                                type="button"
                                                disabled={opLoading || validatingSkillId === skill.id}
                                                onClick={() => onValidateAI(skill)}
                                                title="Validar con IA"
                                                className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-500 disabled:opacity-50"
                                            >
                                                {validatingSkillId === skill.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Sparkles size={16} />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={opLoading}
                                            onClick={() => onEdit(skill)}
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#233948]"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={opLoading}
                                            onClick={() => onDelete(skill)}
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#233948]"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Barra de nivel */}
                            <div className="flex gap-1 mb-2">
                                {catalogs?.skillLevels.map((lvl) => (
                                    <div 
                                        key={lvl.id}
                                        className={`h-1.5 flex-1 rounded-full ${
                                            lvl.id <= skill.level 
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
    );
};
