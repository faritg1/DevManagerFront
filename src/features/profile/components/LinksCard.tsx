import React from 'react';
import { Card, CardHeader, CardTitle, Input } from '../../../shared/ui';
import { Link as LinkIcon, Linkedin, Github, Globe } from 'lucide-react';
import type { UpdateProfileRequest, ProfileResponse } from '../../../shared/api/types';

interface Props {
    profile?: ProfileResponse | null;
    form: UpdateProfileRequest;
    isEditing: boolean;
    onChange: (partial: Partial<UpdateProfileRequest>) => void;
}

export const LinksCard: React.FC<Props> = ({ profile, form, isEditing, onChange }) => (
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
                        value={form.linkedinUrl || ''}
                        onChange={(e) => onChange({ linkedinUrl: e.target.value })}
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
                        value={form.githubUrl || ''}
                        onChange={(e) => onChange({ githubUrl: e.target.value })}
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
                        value={form.portfolioUrl || ''}
                        onChange={(e) => onChange({ portfolioUrl: e.target.value })}
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
);
