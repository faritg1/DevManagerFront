import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Users, Save, X } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle } from '../../../shared/ui';
import { useForm } from '../../../shared/hooks';
import { ROUTES } from '../../../shared/config/constants';

interface ProjectFormData {
    name: string;
    client: string;
    description: string;
    skills: string;
    duration: string;
}

export const CreateProjectPage: React.FC = () => {
    const navigate = useNavigate();
    
    const { values, handleChange, handleBlur } = useForm<ProjectFormData>({
        name: '',
        client: '',
        description: '',
        skills: '',
        duration: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Call API to create project
        console.log('Creating project:', values);
        navigate(ROUTES.DASHBOARD);
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto justify-center py-5">
            <div className="flex flex-col max-w-[1024px] w-full px-4 pb-20 mx-auto">
                {/* Header */}
                <div className="flex flex-wrap justify-between gap-6 p-4 border-b border-slate-200 dark:border-[#233948] mb-8">
                    <div className="flex min-w-72 flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight">
                            Crear Nuevo Proyecto
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
                            Define los detalles del proyecto, alcance y asigna el equipo.
                        </p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Button 
                            variant="outline" 
                            icon={X}
                            onClick={() => navigate(ROUTES.DASHBOARD)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            icon={Save}
                            onClick={handleSubmit}
                        >
                            Guardar Proyecto
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
                                label="Nombre del Proyecto"
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Ej: Mobile App Redesign"
                            />
                            <Input
                                label="Cliente / Departamento"
                                name="client"
                                value={values.client}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Ej: Marketing"
                            />
                            <div className="md:col-span-2">
                                <label className="flex flex-col gap-2">
                                    <span className="text-slate-700 dark:text-white text-sm font-bold">Descripción</span>
                                    <textarea 
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange as any}
                                        className="w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-32 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Describe los objetivos y alcance del proyecto..."
                                    />
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* Resource Allocation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="text-purple-500" size={24} /> 
                                Asignación de Recursos
                            </CardTitle>
                        </CardHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Habilidades Requeridas"
                                name="skills"
                                value={values.skills}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="React, Node.js, Python..."
                                hint="Separa las habilidades con comas"
                            />
                            <Input
                                label="Duración Estimada (Semanas)"
                                type="number"
                                name="duration"
                                value={values.duration}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="12"
                            />
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectPage;
