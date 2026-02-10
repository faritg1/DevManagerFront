import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Users, Save, X, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle } from '../../../shared/ui';
import { useForm } from '../../../shared/hooks';
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
    complexity: string;
    budgetEstimate: string;
}

export const CreateProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { catalogs } = useConfig();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { values, handleChange, handleBlur } = useForm<ProjectFormData>({
        name: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        complexity: '1', // Medium by default
        budgetEstimate: '',
    });

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
                complexity: parseInt(values.complexity) as ProjectComplexity,
                budgetEstimate: values.budgetEstimate ? parseFloat(values.budgetEstimate) : undefined,
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
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex flex-col max-w-[1024px] w-full px-4 md:px-6 py-6 mx-auto">
                {/* Header */}
                <div className="flex flex-wrap justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#233948] mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-black leading-tight">
                            Crear Nuevo Proyecto
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal">
                            Define los detalles del proyecto, alcance y asigna el equipo.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
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
                    </div>
                </div>
                
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                    {/* Basic Information */}
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
                                onBlur={handleBlur}
                                placeholder="Ej: Sistema de Gestión Hospitalaria"
                                required
                            />
                            <Input
                                label="Código del Proyecto"
                                name="code"
                                value={values.code}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Ej: SIST-HOSP-001"
                                hint="Identificador único (opcional)"
                            />
                            <div className="md:col-span-2">
                                <label className="flex flex-col gap-2">
                                    <span className="text-slate-700 dark:text-white text-sm font-bold">Descripción</span>
                                    <textarea 
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                                        className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-32 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Describe los objetivos y alcance del proyecto..."
                                    />
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* Timeline & Budget */}
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
                                onBlur={handleBlur}
                            />
                            <Input
                                label="Fecha de Fin"
                                type="date"
                                name="endDate"
                                value={values.endDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <div className="flex flex-col gap-2">
                                <span className="text-slate-700 dark:text-white text-sm font-bold">Complejidad</span>
                                <select
                                    name="complexity"
                                    value={values.complexity}
                                    onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                                    className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                >
                                    {catalogs?.complexityLevels.map(level => (
                                        <option key={level.id} value={level.id}>
                                            {level.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Presupuesto Estimado"
                                type="number"
                                name="budgetEstimate"
                                value={values.budgetEstimate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="50000"
                                icon={DollarSign}
                                hint="En USD (opcional)"
                            />
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectPage;