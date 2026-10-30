import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    Briefcase,
    Building2,
    CalendarDays,
    FolderOpen,
    GraduationCap,
    Landmark,
    Pencil,
    UserCheck,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, PageContainer, PageHeader, Select, LoadingBlock } from '../../../shared/ui';
import { useAuth, useNotification } from '../../../shared/context';
import { DEFAULT_ACTIVITIES_SETTINGS, setActivitiesSettings, useIsAdmin } from '../../../shared/hooks';
import { organizationsService } from '../../../shared/api';
import type { ActivitiesSettings, AssociateStatus, OrganizationDto, OrganizationEntityType } from '../../../shared/api/types';
import { ROUTES } from '../../../shared/config/constants';
import { ENTITY_TYPES, STATUS_LABELS, STATUS_VARIANTS, errorText, formatDate } from '../../associates/labels';


/** Valor ausente: texto atenuado en lugar de una etiqueta vacía. */
const Undefined: React.FC<{ label?: string }> = ({ label = 'Sin definir' }) => (
    <span className="text-sm italic text-slate-500 dark:text-slate-400">{label}</span>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{children}</div>
    </div>
);

interface StatLinkProps {
    to: string;
    title: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    icon: LucideIcon;
    tone: string;
}

const StatLink: React.FC<StatLinkProps> = ({ to, title, value, hint, icon: Icon, tone }) => (
    <Link
        to={to}
        className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-border-dark dark:bg-card-dark"
    >
        <div className="flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
            <div className={`rounded-lg p-2 ${tone}`}>
                <Icon size={20} />
            </div>
        </div>
        <p className="text-3xl font-bold leading-none text-slate-900 dark:text-white">{value}</p>
        {hint && <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </Link>
);

interface EditForm {
    name: string;
    legalName: string;
    nit: string;
    entityType: OrganizationEntityType | '';
    dueSoonDays: string;
    overdueNotice: boolean;
    activities: ActivitiesSettings;
}

const toForm = (o: OrganizationDto): EditForm => ({
    name: o.name,
    legalName: o.legalName ?? '',
    nit: o.nit ?? '',
    entityType: o.entityType ?? '',
    dueSoonDays: String(o.workItemDueSoonDays ?? 2),
    overdueNotice: o.workItemOverdueNotice ?? true,
    activities: { ...DEFAULT_ACTIVITIES_SETTINGS, ...o.activitiesSettings },
});

export const OrganizationsPage: React.FC = () => {
    const { updateUser } = useAuth();
    const { showNotification } = useNotification();
    const isAdmin = useIsAdmin();

    const [org, setOrg] = useState<OrganizationDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<EditForm | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await organizationsService.getCurrent();
            if (res.success && res.data) {
                setOrg(res.data);
                updateUser({ organizationName: res.data.name });
            } else {
                setError(res.message || 'No se pudo cargar la organización');
            }
        } catch (e) {
            setError(errorText(e, 'No se pudo cargar la organización'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = async () => {
        if (!form || isSaving || !form.name.trim()) return;
        const days = Number(form.dueSoonDays);
        if (form.dueSoonDays.trim() === '' || !Number.isInteger(days) || days < 0 || days > 10) {
            showNotification({ type: 'error', message: 'Los días de aviso deben ser un entero entre 0 y 10' });
            return;
        }
        setIsSaving(true);
        try {
            const res = await organizationsService.updateCurrent({
                name: form.name.trim(),
                legalName: form.legalName.trim() || null,
                nit: form.nit.trim() || null,
                entityType: form.entityType === '' ? null : form.entityType,
                workItemDueSoonDays: days,
                workItemOverdueNotice: form.overdueNotice,
                activitiesSettings: form.activities,
            });
            if (res.success && res.data) {
                setOrg(res.data);
                setActivitiesSettings(res.data.activitiesSettings ?? form.activities);
                updateUser({ organizationName: res.data.name });
                setForm(null);
                showNotification({ type: 'success', message: 'Organización actualizada' });
            }
        } catch {
            // el listener global muestra el error (400 validación / 409 NIT duplicado)
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <LoadingBlock label="Cargando organización…" className="h-full py-20" />
        );
    }

    if (error || !org) {
        return (
            <div className="flex h-full flex-col items-center justify-center py-20">
                <AlertCircle className="mb-4 h-10 w-10 text-rose-500" />
                <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    {error || 'No se encontró la organización'}
                </p>
                <Button variant="outline" onClick={load}>Reintentar</Button>
            </div>
        );
    }

    const { stats } = org;
    const byStatus: Record<AssociateStatus, number> = {
        1: stats.associatesByStatus.applicant,
        2: stats.associatesByStatus.active,
        3: stats.associatesByStatus.suspended,
        4: stats.associatesByStatus.withdrawn,
    };
    const totalAssociates = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return (
        <PageContainer>
            <PageHeader
                icon={<Building2 size={28} className="text-primary" />}
                title="Organización"
                description="Datos de tu entidad solidaria y resumen de su actividad."
                actions={isAdmin && (
                    <Button icon={Pencil} onClick={() => setForm(toForm(org))}>
                        Editar organización
                    </Button>
                )}
            />

            <Card className="mb-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 text-2xl font-black text-white shadow-lg">
                            {org.name.trim().charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{org.name}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant={org.isActive ? 'success' : 'default'} dot>
                                    {org.isActive ? 'Activa' : 'Inactiva'}
                                </Badge>
                                {org.entityType ? (
                                    <Badge variant="info">{ENTITY_TYPES[org.entityType]}</Badge>
                                ) : (
                                    <Undefined label="Tipo de entidad sin definir" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 md:border-l md:border-slate-200 md:pl-6 md:dark:border-border-dark">
                        <Field label="Razón social">{org.legalName || <Undefined />}</Field>
                        <Field label="NIT">{org.nit ? <span className="font-mono">{org.nit}</span> : <Undefined />}</Field>
                        <Field label="Registrada">
                            <span className="inline-flex items-center gap-1">
                                <CalendarDays size={14} className="text-slate-400" />
                                {formatDate(org.createdAt)}
                            </span>
                        </Field>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatLink
                    to={ROUTES.USERS}
                    title="Usuarios"
                    value={stats.users}
                    hint={`${stats.activeUsers} activos`}
                    icon={Users}
                    tone="bg-indigo-100 text-indigo-500 dark:bg-indigo-500/10"
                />
                <StatLink
                    to={ROUTES.ASSOCIATES}
                    title="Asociados"
                    value={totalAssociates}
                    hint={
                        <div className="flex flex-wrap gap-1.5">
                            {([1, 2, 3, 4] as AssociateStatus[]).map((s) => (
                                <Badge key={s} variant={STATUS_VARIANTS[s]}>
                                    {STATUS_LABELS[s]}: {byStatus[s]}
                                </Badge>
                            ))}
                        </div>
                    }
                    icon={UserCheck}
                    tone="bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10"
                />
                <StatLink
                    to={ROUTES.USERS}
                    title="Empleados"
                    value={stats.employees}
                    hint="Usuarios marcados como empleados"
                    icon={Briefcase}
                    tone="bg-orange-100 text-orange-500 dark:bg-orange-500/10"
                />
                <StatLink
                    to={ROUTES.PROJECTS}
                    title="Proyectos"
                    value={stats.projects}
                    hint={`${stats.activeProjects} abiertos o en progreso`}
                    icon={FolderOpen}
                    tone="bg-blue-100 text-blue-500 dark:bg-blue-500/10"
                />
                <StatLink
                    to={ROUTES.ORGANOS}
                    title="Órganos de gobierno"
                    value={stats.governingBodies}
                    hint="Asamblea, consejo, junta y comités"
                    icon={Landmark}
                    tone="bg-purple-100 text-purple-500 dark:bg-purple-500/10"
                />
                <StatLink
                    to={ROUTES.EDUCATION}
                    title="Programas de educación"
                    value={stats.educationPrograms}
                    hint="Educación cooperativa"
                    icon={GraduationCap}
                    tone="bg-rose-100 text-rose-500 dark:bg-rose-500/10"
                />
            </div>

            <Modal
                isOpen={!!form}
                onClose={() => setForm(null)}
                onSubmit={save}
                title="Editar organización"
                icon={<Pencil className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button type="submit" isLoading={isSaving}>Guardar</Button>
                        <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
                    </>
                }
            >
                {form && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Input
                                label="Nombre *"
                                required
                                value={form.name}
                                maxLength={160}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Input
                                label="Razón social"
                                value={form.legalName}
                                maxLength={200}
                                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                            />
                        </div>
                        <Input
                            label="NIT"
                            value={form.nit}
                            maxLength={30}
                            placeholder="900123456-1"
                            onChange={(e) => setForm({ ...form, nit: e.target.value })}
                        />
                        <Select
                            label="Tipo de entidad"
                            value={form.entityType}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    entityType: e.target.value ? (Number(e.target.value) as OrganizationEntityType) : '',
                                })
                            }
                        >
                            <option value="">Sin definir</option>
                            {Object.entries(ENTITY_TYPES).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </Select>
                        <Input
                            label="Avisar antes del vencimiento (días hábiles)"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={form.dueSoonDays}
                            hint="0 = solo el día del vencimiento"
                            onChange={(e) => setForm({ ...form, dueSoonDays: e.target.value })}
                        />
                        <label className="flex items-center gap-2 self-center text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={form.overdueNotice}
                                onChange={(e) => setForm({ ...form, overdueNotice: e.target.checked })}
                            />
                            Avisar cuando una actividad se venza
                        </label>
                        <fieldset className="flex flex-col gap-2 sm:col-span-2">
                            <legend className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Módulo de actividades</legend>
                            {([
                                ['showOnProjectDetail', 'Mostrar actividades en el detalle del proyecto'],
                                ['showMyWorkOnDashboard', 'Mostrar «Mis actividades» en el dashboard'],
                                ['sprintsEnabled', 'Habilitar sprints'],
                            ] as const).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={form.activities[key]}
                                        onChange={(e) => setForm({ ...form, activities: { ...form.activities, [key]: e.target.checked } })}
                                    />
                                    {label}
                                </label>
                            ))}
                        </fieldset>
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
};

