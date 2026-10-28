import { usd } from '../../../shared/format';
import React from 'react';
import { Card, CardHeader, CardTitle, Input, SELECT_CLASS } from '../../../shared/ui';
import { Briefcase } from 'lucide-react';
import type { UpdateProfileRequest, ProfileResponse, AllConfigCatalogsDto, AvailabilityStatus } from '../../../shared/api/types';

interface Props {
    profile?: ProfileResponse | null;
    form: UpdateProfileRequest;
    catalogs: AllConfigCatalogsDto | null;
    isEditing: boolean;
    onChange: (partial: Partial<UpdateProfileRequest>) => void;
}

export const ProfessionalInfoCard: React.FC<Props> = ({ profile, form, catalogs, isEditing, onChange }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Briefcase className="text-primary" size={20} />
                Información Profesional
            </CardTitle>
        </CardHeader>

        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="professional-info-card-anos-de-experiencia" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Años de Experiencia
                </label>
                {isEditing ? (
                    <Input id="professional-info-card-anos-de-experiencia"
                        type="number"
                        min={0}
                        max={50}
                        value={form.yearsExperience ?? ''}
                        onChange={(e) => onChange({ yearsExperience: parseInt(e.target.value) || 0 })}
                        placeholder="Ej: 5"
                    />
                ) : (
                    <p className="text-slate-900 dark:text-white">
                        {profile?.yearsExperience ?? 'No especificado'}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="professional-info-seniority" className="text-sm font-bold text-slate-700 dark:text-slate-300">Seniority</label>
                    {isEditing ? (
                        <select id="professional-info-seniority"
                            value={form.seniorityLevelId ?? profile?.seniorityLevelId ?? ''}
                            onChange={(e) => onChange({ seniorityLevelId: e.target.value ? parseInt(e.target.value) : undefined })}
                            className={SELECT_CLASS}
                        >
                            <option value="">Selecciona seniority...</option>
                            {catalogs?.seniorityLevels?.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-slate-900 dark:text-white">
                            {catalogs?.seniorityLevels?.find(s => s.id === profile?.seniorityLevelId)?.name || 'No especificado'}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="professional-info-ubicacion" className="text-sm font-bold text-slate-700 dark:text-slate-300">Ubicación</label>
                    {isEditing ? (
                        <Input id="professional-info-ubicacion" value={form.location ?? profile?.location ?? ''} onChange={(e) => onChange({ location: e.target.value })} placeholder="Ciudad, País" />
                    ) : (
                        <p className="text-slate-900 dark:text-white">{profile?.location || 'No especificado'}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="professional-info-zona-horaria" className="text-sm font-bold text-slate-700 dark:text-slate-300">Zona horaria</label>
                    {isEditing ? (
                        <Input id="professional-info-zona-horaria" value={form.timezone ?? profile?.timezone ?? ''} onChange={(e) => onChange({ timezone: e.target.value })} placeholder="Ej: America/Bogota" />
                    ) : (
                        <p className="text-slate-900 dark:text-white">{profile?.timezone || 'No especificado'}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="professional-info-disponibilidad" className="text-sm font-bold text-slate-700 dark:text-slate-300">Disponibilidad</label>
                    {isEditing ? (
                        <select id="professional-info-disponibilidad"
                            value={form.availability ?? profile?.availability ?? ''}
                            onChange={(e) => onChange({ availability: (e.target.value as AvailabilityStatus) || null })}
                            className={SELECT_CLASS}
                        >
                            <option value="">Selecciona disponibilidad...</option>
                            <option value="Available">Disponible</option>
                            <option value="OpenToOffers">Abierto a propuestas</option>
                            <option value="NotAvailable">No disponible</option>
                        </select>
                    ) : (
                        <p className="text-slate-900 dark:text-white">{profile?.availability || 'No especificado'}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="professional-info-titulo-preferido" className="text-sm font-bold text-slate-700 dark:text-slate-300">Título preferido</label>
                    {isEditing ? (
                        <Input id="professional-info-titulo-preferido" value={form.preferredTitle ?? profile?.preferredTitle ?? ''} onChange={(e) => onChange({ preferredTitle: e.target.value })} placeholder="Ej: Senior Frontend Developer" />
                    ) : (
                        <p className="text-slate-900 dark:text-white">{profile?.preferredTitle || 'No especificado'}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="professional-info-tarifa-estimada-usd" className="text-sm font-bold text-slate-700 dark:text-slate-300">Tarifa estimada (USD/h)</label>
                    {isEditing ? (
                        <Input id="professional-info-tarifa-estimada-usd" type="number" min={0} value={form.hourlyRate ?? profile?.hourlyRate ?? ''} onChange={(e) => onChange({ hourlyRate: e.target.value ? Number(e.target.value) : undefined })} placeholder="Ej: 40" />
                    ) : (
                        <p className="text-slate-900 dark:text-white">{profile?.hourlyRate ? `${usd(profile.hourlyRate)}/h` : 'No especificado'}</p>
                    )}
                </div>
            </div>
        </div>
    </Card>
);
