import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Users, Save, X, Calendar, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, PageContainer, PageHeader, SELECT_CLASS } from '../../../shared/ui';
import { useNotification, useConfig } from '../../../shared/context';
import { ROUTES } from '../../../shared/config/constants';
import { projectsService } from '../../../shared/api';
import { ProjectComplexity } from '../../../shared/api/types';

interface ProjectFormData {
    name: string;
    code: string;
    description: string;
    startDate: string;
    endDate: string;
    complexityLevel: string;
}

export const CreateProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { catalogs } = useConfig();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [values, setValues] = useState<ProjectFormData>({
        name: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        complexityLevel: String(ProjectComplexity.Medium),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!values.name.trim()) {
            showNotification({ type: 'error', message: 'El nombre del proyecto es requerido' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await projectsService.create({
                name: values.name,
                code: values.code || undefined,
                description: values.description || undefined,
                startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
                endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
                complexityLevel: parseInt(values.complexityLevel) as ProjectComplexity,
            });

            if (response.success) {
                showNotification({ type: 'success', message: 'Proyecto creado exitosamente' });
                navigate(ROUTES.PROJECTS);
            } else {
                showNotification({ type: 'error', message: response.message || 'Error al crear proyecto' });
            }
        } catch (error) {
            showNotification({ type: 'error', message: 'Error de conexión' });
            console.error('Error creating project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageContainer narrow>
            <PageHeader
                title="Crear Nuevo Proyecto"
                description="Define los detalles del proyecto, alcance y asigna el equipo."
                actions={<>
                        <Button 
                            variant="outline" 
                            icon={X}
                            onClick={() => navigate(ROUTES.PROJECTS)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            icon={isSubmitting ? Loader2 : Save}
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Proyecto'}
                        </Button>
                </>}
            />
                
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="text-primary" size={24} /> 
                                Información Básica
                            </CardTitle>
                        </CardHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Nombre del Proyecto *"
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                                placeholder="Ej: Sistema de Gestión Hospitalaria"
                                required
                            />
                            <Input
                                label="Código del Proyecto"
                                name="code"
                                value={values.code}
                                onChange={handleChange}
                                placeholder="Ej: SIST-HOSP-001"
                                hint="Identificador único (opcional)"
                            />
                            <div className="md:col-span-2">
                                <label className="flex flex-col gap-2">
                                    <span className="text-slate-700 dark:text-white text-sm font-bold">Descripción</span>
                                    <textarea 
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-32 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Describe los objetivos y alcance del proyecto..."
                                    />
                                </label>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="text-blue-500" size={24} /> 
                                Fechas y Presupuesto
                            </CardTitle>
                        </CardHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Fecha de Inicio"
                                type="date"
                                name="startDate"
                                value={values.startDate}
                                onChange={handleChange}
                            />
                            <Input
                                label="Fecha de Fin"
                                type="date"
                                name="endDate"
                                value={values.endDate}
                                onChange={handleChange}
                            />
                            <div className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Complejidad</span>
                                <select
                                    name="complexityLevel"
                                    value={values.complexityLevel}
                                    onChange={handleChange}
                                    className={`${SELECT_CLASS} w-full`}
                                >
                                    {catalogs?.complexityLevels.map(level => (
                                        <option key={level.id} value={level.id}>
                                            {level.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>
                </form>
        </PageContainer>
    );
};

