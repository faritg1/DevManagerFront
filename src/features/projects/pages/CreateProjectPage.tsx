import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Users, Save, X, Calendar } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, CardHeader, CardTitle, PageContainer, PageHeader, useGoBack } from '../../../shared/ui';
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
    const goBack = useGoBack(ROUTES.PROJECTS);
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
        if (isSubmitting) return;
        
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
                navigate(ROUTES.PROJECTS, { replace: true });
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
                backTo={ROUTES.PROJECTS}
                title="Crear Nuevo Proyecto"
                description="Define los detalles del proyecto, alcance y asigna el equipo."
                actions={<>
                        <Button 
                            variant="outline" 
                            icon={X}
                            onClick={goBack}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" form="create-project-form" icon={Save} isLoading={isSubmitting}>
                            Guardar Proyecto
                        </Button>
                </>}
            />
                
                <form id="create-project-form" className="flex flex-col gap-8" onSubmit={handleSubmit}>
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
                                <Textarea
                                    label="Descripción"
                                    name="description"
                                    value={values.description}
                                    onChange={handleChange}
                                    className="h-32 resize-none"
                                    placeholder="Describe los objetivos y alcance del proyecto..."
                                />
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
                            <Select
                                label="Complejidad"
                                name="complexityLevel"
                                value={values.complexityLevel}
                                onChange={handleChange}
                            >
                                {catalogs?.complexityLevels.map(level => (
                                    <option key={level.id} value={level.id}>
                                        {level.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </Card>
                </form>
        </PageContainer>
    );
};

