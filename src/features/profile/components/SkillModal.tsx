import React from 'react';
import { Modal, Button, Input, Select, Textarea, LevelSelector, LoadingBlock } from '../../../shared/ui';
import { Award, Link as LinkIcon, Save, Plus } from 'lucide-react';
import type { SkillDto, UpsertEmployeeSkillRequest, EmployeeSkillResponse, AllConfigCatalogsDto } from '../../../shared/api/types';

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
    catalogs: AllConfigCatalogsDto | null;
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

    // Validación: Nivel >= 4 requiere evidencias
    const requiresEvidence = form.level >= 4;
    const hasValidEvidence = requiresEvidence 
        ? (form.evidenceUrl?.trim() && form.experienceDescription?.trim())
        : true;

    const isFormValid = form.skillId && hasValidEvidence;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={() => { if (!saving && isFormValid) onSave(); }}
            title={editing ? 'Editar Habilidad' : 'Agregar Habilidad'}
            icon={<Award className="text-primary" size={20} />}
            size="md"
            footer={
                <>
                    <Button type="submit" isLoading={saving} icon={editing ? Save : Plus}>
                        {editing ? 'Guardar cambios' : 'Agregar Habilidad'}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                {editing ? (
                    <Input label="Habilidad *" value={editing.skillName} disabled />
                ) : loadingSkills ? (
                    <LoadingBlock label="Cargando habilidades..." className="py-4" />
                ) : (
                    <Select
                        label="Habilidad *"
                        required
                        value={form.skillId}
                        onChange={(e) => setForm(prev => ({ ...prev, skillId: e.target.value }))}
                    >
                        <option value="">Seleccionar habilidad...</option>
                        {availableSkills.map(skill => (
                            <option key={skill.id} value={skill.id}>
                                {skill.name} {skill.category && `(${skill.category})`}
                            </option>
                        ))}
                    </Select>
                )}

                <div className="flex flex-col gap-2" role="group" aria-labelledby="skill-modal-nivel">
                    <p id="skill-modal-nivel" className="text-slate-700 dark:text-white text-sm font-bold">
                        Nivel de Dominio *
                    </p>
                    <LevelSelector
                        levels={catalogs?.skillLevels || []}
                        selectedId={form.level}
                        onSelect={(id) => setForm(prev => ({ ...prev, level: id }))}
                    />
                    {requiresEvidence && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Award size={12} />
                            Nivel avanzado: requiere evidencias obligatorias
                        </p>
                    )}
                </div>

                <Input
                    label={`Evidencia${requiresEvidence ? ' *' : ''}`}
                    required={requiresEvidence}
                    value={form.evidenceUrl || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, evidenceUrl: e.target.value }))}
                    placeholder="https://github.com/tu-proyecto o certificación"
                    icon={LinkIcon}
                    hint={requiresEvidence
                        ? 'Obligatorio para niveles avanzados (4+). Agrega un link a un proyecto o certificación.'
                        : 'Agrega un link a un proyecto, repositorio o certificación que demuestre tu dominio.'}
                />

                <Textarea
                    label={`Descripción de Experiencia${requiresEvidence ? ' *' : ''}`}
                    required={requiresEvidence}
                    value={form.experienceDescription || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, experienceDescription: e.target.value }))}
                    placeholder="Describe tu experiencia con esta habilidad, proyectos en los que has trabajado, tecnologías que dominas..."
                    rows={4}
                    maxLength={1000}
                    className="resize-none"
                    hint={requiresEvidence
                        ? 'Obligatorio para niveles avanzados (4+). Describe tu experiencia (máx 1000 caracteres).'
                        : 'Describe tu experiencia (máx 1000 caracteres). Útil si no tienes URL de evidencia.'}
                />
            </div>
        </Modal>
    );
};
