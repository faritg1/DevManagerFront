import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, Users, FileText, Building2, ChevronLeft, Trash2 } from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../../../shared/ui';
import { useNotification } from '../../../shared/context';
import { useIsAdmin, useConfirm } from '../../../shared/hooks';
import { organosService, associatesService } from '../../../shared/api';
import type {
    AssemblyDto,
    AssociateDto,
    CreateGoverningBodyRequest,
    GoverningBodyDto,
    GoverningBodyMemberDto,
    GoverningBodyType,
    MinutesDto,
    VoteResultsDto,
} from '../../../shared/api/types';

const BODY_TYPE_LABEL: Record<GoverningBodyType, string> = {
    1: 'Asamblea General',
    2: 'Consejo de Administración',
    3: 'Junta de Vigilancia',
    4: 'Revisor Fiscal',
    5: 'Comité',
    99: 'Otros',
};

const SESSION_TYPE_LABEL: Record<number, string> = { 1: 'Ordinaria', 2: 'Extraordinaria' };

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const selectClass = 'w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none';

export const OrganosPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const isAdmin = useIsAdmin();

    const [bodies, setBodies] = useState<GoverningBodyDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateGoverningBodyRequest>({ type: 2, name: '', constitutionDate: today() });

    const [selected, setSelected] = useState<GoverningBodyDto | null>(null);
    const [members, setMembers] = useState<GoverningBodyMemberDto[]>([]);
    const [minutes, setMinutes] = useState<MinutesDto[]>([]);
    const [assemblies, setAssemblies] = useState<AssemblyDto[]>([]);
    const [results, setResults] = useState<VoteResultsDto | null>(null);
    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [memberOpen, setMemberOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ userId: '', position: '', startDate: today() });

    const loadBodies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await organosService.getAll();
            setBodies(res.success && res.data ? res.data : []);
        } catch {
            setError('Error de conexión al cargar órganos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBodies();
        if (isAdmin) {
            associatesService.getAll().then(res => setAssociates(res.success && res.data ? res.data : [])).catch(() => {});
        }
    }, [isAdmin]);

    const handleCreate = async () => {
        try {
            const res = await organosService.create({ ...createForm, name: createForm.name.trim() });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Órgano creado' });
                setCreateOpen(false);
                setCreateForm(f => ({ ...f, name: '' }));
                await loadBodies();
                openDetail(res.data);
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const loadMembers = async (bodyId: string) => {
        const res = await organosService.getMembers(bodyId);
        setMembers(res.success && res.data ? res.data : []);
    };

    const openDetail = async (body: GoverningBodyDto) => {
        setSelected(body);
        setDetailLoading(true);
        setResults(null);
        try {
            const [m, a, asm] = await Promise.all([
                organosService.getMembers(body.id),
                organosService.getMinutes(body.id),
                organosService.getAssemblies(),
            ]);
            setMembers(m.success && m.data ? m.data : []);
            setMinutes(a.success && a.data ? a.data : []);
            setAssemblies((asm.success && asm.data ? asm.data : []).filter(x => !x.governingBodyId || x.governingBodyId === body.id));
        } catch {
            setMembers([]); setMinutes([]); setAssemblies([]);
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshSelected = async (id: string) => {
        const res = await organosService.getById(id);
        if (res.success && res.data) setSelected(res.data);
    };

    const handleAddMember = async () => {
        if (!selected || !memberForm.userId || !memberForm.position.trim()) return;
        try {
            await organosService.assignMember({
                governingBodyId: selected.id,
                userId: memberForm.userId,
                position: memberForm.position.trim(),
                startDate: memberForm.startDate,
            });
            showNotification({ type: 'success', message: 'Miembro asignado' });
            setMemberOpen(false);
            setMemberForm({ userId: '', position: '', startDate: today() });
            await loadMembers(selected.id);
            await refreshSelected(selected.id);
        } catch {
            // el listener global muestra el error
        }
    };

    const handleRemoveMember = async (member: GoverningBodyMemberDto) => {
        if (!selected) return;
        const ok = await confirm({ message: `¿Retirar a ${member.fullName} de ${selected.name}?` });
        if (!ok) return;
        try {
            await organosService.removeMember(member.id);
            showNotification({ type: 'success', message: 'Miembro retirado' });
            await loadMembers(selected.id);
            await refreshSelected(selected.id);
        } catch {
            // el listener global muestra el error
        }
    };

    const handleShowResults = async (assemblyId: string) => {
        try {
            const res = await organosService.getResults(assemblyId);
            setResults(res.success ? res.data : null);
        } catch {
            setResults(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Cargando órganos...</p>
            </div>
        );
    }

    if (error && !selected) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{error}</p>
                <Button variant="outline" onClick={loadBodies}>Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Órganos
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Órganos de administración y control, miembros, actas, asambleas y votos.
                    </p>
                </div>
                {isAdmin && (
                    <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                        Crear Órgano
                    </Button>
                )}
            </div>

            {selected ? (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setSelected(null)}
                            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary"
                        >
                            <ChevronLeft size={16} /> Volver
                        </button>
                        <Badge variant="purple">{BODY_TYPE_LABEL[selected.type] ?? selected.type}</Badge>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{selected.name}</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Constituido: {formatDate(selected.constitutionDate)}
                    </p>

                    {detailLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={16} /> Miembros</h3>
                                    {isAdmin && <Button size="sm" variant="outline" icon={Plus} onClick={() => setMemberOpen(true)}>Asignar</Button>}
                                </div>
                                <div className="space-y-2">
                                    {members.length === 0 && <p className="text-sm text-slate-500">Sin miembros.</p>}
                                    {members.map(m => (
                                        <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{m.fullName}</p>
                                                <p className="text-xs text-slate-500">{m.position} · {formatDate(m.startDate)}{m.endDate ? ` – ${formatDate(m.endDate)}` : ''}</p>
                                                <Badge variant={m.isActive ? 'success' : 'default'}>{m.isActive ? 'Activo' : 'Inactivo'}</Badge>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => handleRemoveMember(m)} className="p-1 text-slate-400 hover:text-rose-500" aria-label="Retirar miembro">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3"><FileText size={16} /> Actas</h3>
                                <div className="space-y-2">
                                    {minutes.length === 0 && <p className="text-sm text-slate-500">Sin actas.</p>}
                                    {minutes.map(ac => (
                                        <div key={ac.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">Sesión {SESSION_TYPE_LABEL[ac.sessionType] ?? ac.sessionType}</p>
                                            <p className="text-xs text-slate-500">{formatDate(ac.sessionDate)} · Quórum {ac.quorum}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{ac.decisions}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3"><Building2 size={16} /> Asambleas</h3>
                                <div className="space-y-2">
                                    {assemblies.length === 0 && <p className="text-sm text-slate-500">Sin asambleas.</p>}
                                    {assemblies.map(as => (
                                        <div key={as.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{SESSION_TYPE_LABEL[as.type] ?? as.type}</p>
                                                <Badge variant={as.isClosed ? 'default' : 'success'}>{as.isClosed ? 'Cerrada' : 'Abierta'}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500">{formatDate(as.scheduledAt)} · Quórum mínimo {as.minimumQuorum}{as.hasQuorum ? ' (alcanzado)' : ''} · Votos {as.votesCount}</p>
                                            <Button size="sm" variant="ghost" className="mt-1" onClick={() => handleShowResults(as.id)}>
                                                Ver resultados
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {results && (
                                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs">
                                        <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Resultados de votación ({results.totalVotes} votos)</p>
                                        <p>A favor: {results.approve} · En contra: {results.reject} · Abstenciones: {results.abstain} · En blanco: {results.blank}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bodies.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-500">
                            No hay órganos registrados para esta organización.
                        </div>
                    )}
                    {bodies.map(o => (
                        <Card key={o.id} hoverable onClick={() => openDetail(o)}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <Badge variant="purple">{BODY_TYPE_LABEL[o.type] ?? o.type}</Badge>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{o.name}</h3>
                                </div>
                                {!o.isActive && <Badge variant="default">Inactivo</Badge>}
                            </div>
                            {o.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{o.description}</p>}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-[#233948] text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Users size={13} /> {o.membersCount} miembros</span>
                                <span className="flex items-center gap-1"><FileText size={13} /> {o.minutesCount} actas</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Crear Órgano"
                icon={<Plus className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreate} disabled={!createForm.name.trim()}>Guardar</Button>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Nombre *" value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo *</label>
                        <select
                            value={createForm.type}
                            onChange={(e) => setCreateForm(f => ({ ...f, type: Number(e.target.value) as GoverningBodyType }))}
                            className={`${selectClass} mt-2`}
                        >
                            {Object.entries(BODY_TYPE_LABEL).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <Input type="date" label="Fecha de constitución" value={createForm.constitutionDate} onChange={(e) => setCreateForm(f => ({ ...f, constitutionDate: e.target.value }))} />
                    <Input label="Descripción" value={createForm.description ?? ''} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value || undefined }))} />
                </div>
            </Modal>

            <Modal
                isOpen={memberOpen}
                onClose={() => setMemberOpen(false)}
                title="Asignar Miembro"
                icon={<Users className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleAddMember} disabled={!memberForm.userId || !memberForm.position.trim()}>Asignar</Button>
                        <Button variant="outline" onClick={() => setMemberOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <select
                        value={memberForm.userId}
                        onChange={(e) => setMemberForm(f => ({ ...f, userId: e.target.value }))}
                        className={selectClass}
                    >
                        <option value="">Asociado *</option>
                        {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                    </select>
                    <Input label="Cargo *" value={memberForm.position} onChange={(e) => setMemberForm(f => ({ ...f, position: e.target.value }))} />
                    <Input type="date" label="Fecha de inicio" value={memberForm.startDate} onChange={(e) => setMemberForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
};

export default OrganosPage;
