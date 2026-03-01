import React from 'react';
import { Modal, Button, Input, LevelSelector } from '../../../shared/ui';
import { Award, Loader2, Link as LinkIcon, Save, Plus, FileText } from 'lucide-react';
import type { SkillDto, UpsertEmployeeSkillRequest, EmployeeSkillResponse } from '../../../shared/api/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    loadingSkills: boolean;
    availableSkills: SkillDto[];
    form: UpsertEmployeeSkillRequest;
    setForm: React.Dispatch<React.SetStateAction<UpsertEmployeeSkillRequest>>;
    saving: boolean;
    editing?: EmployeeSkillResponse | null;
    onSave: () => void;
    catalogs: any;
}

export const SkillModal: React.FC<Props> = ({
    isOpen,
    onClose,
    loadingSkills,
    availableSkills,
    form,
    setForm,
    saving,
    editing,
    onSave,
    catalogs,
}) => {
    const getLevelLabel = (levelId: number) => {
        return catalogs?.skillLevels.find(l => l.id === levelId)?.name || `Nivel ${levelId}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Editar Habilidad' : 'Agregar Habilidad'}
            icon={<Award className="text-primary" size={20} />}
            size="md"
            footer={
                <>
                    <Button 
                        onClick={onSave}
                        disabled={saving || !form.skillId}
                        icon={saving ? Loader2 : (editing ? Save : Plus)}
                    >
                        {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Agregar Habilidad')}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
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
                    {editing ? (
                        <Input value={editing.skillName} disabled />
                    ) : loadingSkills ? (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="animate-spin" size={16} />
                            Cargando habilidades...
                        </div>
                    ) : (
                        <select
                            value={form.skillId}
                            onChange={(e) => setForm(prev => ({ ...prev, skillId: e.target.value }))}
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
                    <LevelSelector
                        levels={catalogs?.skillLevels || []}
                        selectedId={form.level}
                        onSelect={(id) => setForm(prev => ({ ...prev, level: id }))}
                    />
                </div>

                {/* URL de evidencia */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-white text-sm font-bold">
                        Evidencia (opcional)
                    </label>
                    <Input
                        value={form.evidenceUrl || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, evidenceUrl: e.target.value }))}
                        placeholder="https://github.com/tu-proyecto o certificación"
                        icon={LinkIcon}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Agrega un link a un proyecto, repositorio o certificación que demuestre tu dominio.
                    </p>
                </div>

                {/* Descripción de experiencia */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-white text-sm font-bold">
                        Descripción de Experiencia (opcional)
                    </label>
                    <textarea
                        value={form.experienceDescription || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, experienceDescription: e.target.value }))}
                        placeholder="Describe tu experiencia con esta habilidad, proyectos en los que has trabajado, tecnologías que dominas..."
                        rows={4}
                        maxLength={1000}
                        className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white placeholder:text-slate-400 p-4 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Describe tu experiencia (máx 1000 caracteres). Útil si no tienes URL de evidencia.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
