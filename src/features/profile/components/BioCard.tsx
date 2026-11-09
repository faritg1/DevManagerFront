import React from 'react';
import { Card, CardHeader, CardTitle, Input } from '../../../shared/ui';
import { User } from 'lucide-react';

interface Props {
    bio?: string | null;
    isEditing: boolean;
    formValue: string;
    onChange: (val: string) => void;
}

export const BioCard: React.FC<Props> = ({ bio, isEditing, formValue, onChange }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <User className="text-primary" size={20} />
                Acerca de mí
            </CardTitle>
        </CardHeader>

        {isEditing ? (
            <textarea
                value={formValue || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Escribe una breve descripción sobre ti, tu experiencia y lo que te apasiona..."
                rows={4}
                className="w-full rounded-xl border border-control-border dark:border-input-border bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 p-4 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] resize-none"
            />
        ) : (
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {bio || 'No has agregado una descripción aún. Haz clic en "Editar Perfil" para agregar información sobre ti.'}
            </p>
        )}
    </Card>
);
