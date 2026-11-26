import React from 'react';
import { FormPanel, FormSection, Input, Select, Textarea, LevelSelector, LoadingBlock } from '../../../shared/ui';
import { Award, Link as LinkIcon } from 'lucide-react';
import type { SkillDto, UpsertEmployeeSkillRequest, EmployeeSkillResponse, AllConfigCatalogsDto } from '../../../shared/api/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    loadingSkills: boolean;
    availableSkills: SkillDto[];
    form: UpsertEmployeeSkillRequest;
    setForm: React.Dispatch<React.SetStateAction<UpsertEmployeeSkillRequest>>;
    editing?: EmployeeSkillResponse | null;
    /** Rejects when the API refuses: the panel shows the error and stays open. */
    onSave: () => Promise<void>;
    catalogs: AllConfigCatalogsDto | null;
}

export const SkillModal: React.FC<Props> = ({
    isOpen,
    onClose,
    loadingSkills,
    availableSkills,
    form,
    setForm,
    editing,
    onSave,
    catalogs,
}) => {
    // The level buttons emit no input event, so the panel cannot see them change.
    const [levelChanged, setLevelChanged] = React.useState(false);
    React.useEffect(() => { if (isOpen) setLevelChanged(false); }, [isOpen]);

    // Validación: Nivel >= 4 requiere evidencias
    const requiresEvidence = form.level >= 4;
    const hasValidEvidence = requiresEvidence 
        ? (form.evidenceUrl?.trim() && form.experienceDescription?.trim())
        : true;

    const isFormValid = form.skillId && hasValidEvidence;

    return (
        <FormPanel
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={async () => { if (isFormValid) await onSave(); }}
            title={editing ? 'Editar Habilidad' : 'Agregar Habilidad'}
            icon={<Award className="text-primary" size={20} />}
            submitText={editing ? 'Guardar cambios' : 'Agregar Habilidad'}
            dirty={levelChanged}
        >
            <FormSection>
              <div className="space-y-5 sm:col-span-2">
                {editing ? (
                    <Input label="Habilidad *" value={editing.skillName} disabled />
                ) : loadingSkills ? (
                    <LoadingBlock label="Cargando habilidades..." className="py-4" />
                ) : (
                    <Select
                        label="Habilidad *"
                        required
                        name="skillId" value={form.skillId}
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
                        onSelect={(id) => { setLevelChanged(true); setForm(prev => ({ ...prev, level: id })); }}
                    />
                    {requiresEvidence && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Award size={12} />
                            Nivel avanzado: requiere evidencias obligatorias
                        </p>
                    )}
                </div>

                <Input
                    label={`Evidencia${requiresEvidence ? ' *' : ''}`}
                    required={requiresEvidence}
                    name="evidenceUrl" value={form.evidenceUrl || ''}
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
                    name="experienceDescription" value={form.experienceDescription || ''}
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
            </FormSection>
        </FormPanel>
    );
};
