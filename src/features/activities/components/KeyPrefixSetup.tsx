import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { projectsService } from '../../../shared/api';
import { Button, Card, Input } from '../../../shared/ui';

interface Props {
    projectId: string;
    /** Whether the user may edit the project (the API demands menu.platform.projects.edit). */
    canSet: boolean;
    onSaved: (keyPrefix: string) => void;
}

/** Every project needs a key prefix (DEV in DEV-12) before its first activity; it cannot change afterwards. */
export const KeyPrefixSetup: React.FC<Props> = ({ projectId, canSet, onSaved }) => {
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);
    const valid = /^[A-Z][A-Z0-9]{1,9}$/.test(value);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await projectsService.setKeyPrefix(projectId, value);
            onSaved(data?.keyPrefix ?? value);
        } catch {
            // el listener global muestra el error (prefijo en uso, inválido…)
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="mb-4 border-amber-300 dark:border-amber-500/40">
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={20} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">Este proyecto aún no tiene prefijo de claves</p>
                    {canSet ? (
                        <>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Las actividades se identifican como PREFIJO-número (por ejemplo DEV-12).
                                Atención: el prefijo no se puede cambiar después de crear la primera actividad.
                            </p>
                            <form
                                className="mt-3 flex flex-wrap items-end gap-3"
                                onSubmit={(e) => { e.preventDefault(); if (valid) void save(); }}
                            >
                                <div className="w-40">
                                    <Input
                                        label="Prefijo"
                                        value={value}
                                        maxLength={10}
                                        placeholder="DEV"
                                        hint="2 a 10 letras o números, en mayúsculas"
                                        onChange={(e) => setValue(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <Button type="submit" size="md" disabled={!valid} isLoading={saving}>Definir prefijo</Button>
                            </form>
                        </>
                    ) : (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Pide a un administrador que lo defina para poder crear actividades.
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
};
