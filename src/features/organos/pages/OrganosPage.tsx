import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Users, FileText, Building2, ChevronLeft, Trash2, Vote, Lock, ExternalLink } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, ProgressBar, PageContainer, PageHeader, SELECT_CLASS, LoadingBlock } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin, useConfirm } from '../../../shared/hooks';
import { organosService, associatesService } from '../../../shared/api';
import type {
    AssemblyDto,
    AssociateDto,
    ConveneAssemblyRequest,
    CreateGoverningBodyRequest,
    CreateMinutesRequest,
    GoverningBodyDto,
    GoverningBodyMemberDto,
    GoverningBodyType,
    MinutesDto,
    SessionType,
    VoteOption,
    VoteResultsDto,
} from '../../../shared/api/types';
import { formatDate, formatDateTime, today } from '../../../shared/format';

const BODY_TYPE_LABEL: Record<GoverningBodyType, string> = {
    1: 'Asamblea General',
    2: 'Consejo de Administración',
    3: 'Junta de Vigilancia',
    4: 'Revisor Fiscal',
    5: 'Comité',
    99: 'Otros',
};

const SESSION_TYPE_LABEL: Record<number, string> = { 1: 'Ordinaria', 2: 'Extraordinaria' };
const VOTE_OPTION_LABEL: Record<VoteOption, string> = { 1: 'Aprobar', 2: 'Rechazar', 3: 'Abstención', 4: 'En blanco' };

/** yyyy-MM-ddTHH:mm en hora local, para inputs datetime-local */
const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const selectClass = `${SELECT_CLASS} w-full`;
const textareaClass = 'w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2';
const labelClass = 'text-slate-700 dark:text-white text-sm font-bold';

const emptyMinutes = (governingBodyId: string): CreateMinutesRequest => ({
    governingBodyId, sessionDate: today(), sessionType: 1, quorum: 0, decisions: '',
});
const emptyAssembly = (governingBodyId?: string): ConveneAssemblyRequest => ({
    governingBodyId, scheduledAt: nowLocal(), type: 1, notice: '', minimumQuorum: 1,
});

/** Envía solo los opcionales con contenido */
const optional = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

export const OrganosPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
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
    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [memberOpen, setMemberOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ userId: '', position: '', startDate: today() });

    const [minutesOpen, setMinutesOpen] = useState(false);
    const [minutesForm, setMinutesForm] = useState<CreateMinutesRequest>(emptyMinutes(''));
    const [minutesDetail, setMinutesDetail] = useState<MinutesDto | null>(null);

    const [conveneOpen, setConveneOpen] = useState(false);
    const [conveneForm, setConveneForm] = useState<ConveneAssemblyRequest>(emptyAssembly());
    const [assembly, setAssembly] = useState<AssemblyDto | null>(null);
    const [results, setResults] = useState<VoteResultsDto | null>(null);
    const [attendees, setAttendees] = useState('');
    const [closeResults, setCloseResults] = useState('');

    const [voterId, setVoterId] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [voteOption, setVoteOption] = useState<VoteOption>(1);
    const [voteNotes, setVoteNotes] = useState('');

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

    const loadMinutes = async (bodyId: string) => {
        const res = await organosService.getMinutes(bodyId);
        setMinutes(res.success && res.data ? res.data : []);
    };

    const loadAssemblies = async (bodyId: string) => {
        const res = await organosService.getAssemblies();
        setAssemblies((res.success && res.data ? res.data : []).filter(x => !x.governingBodyId || x.governingBodyId === bodyId));
    };

    const openDetail = async (body: GoverningBodyDto) => {
        setSelected(body);
        setDetailLoading(true);
        try {
            await Promise.all([loadMembers(body.id), loadMinutes(body.id), loadAssemblies(body.id)]);
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

    const openMinutesDetail = async (id: string) => {
        try {
            const res = await organosService.getMinutesById(id);
            if (res.success && res.data) setMinutesDetail(res.data);
        } catch {
            // el listener global muestra el error
        }
    };

    const handleCreateMinutes = async () => {
        if (!selected) return;
        try {
            const res = await organosService.createMinutes({
                governingBodyId: selected.id,
                assemblyId: minutesForm.assemblyId || undefined,
                sessionDate: minutesForm.sessionDate,
                sessionType: minutesForm.sessionType,
                quorum: minutesForm.quorum,
                decisions: minutesForm.decisions.trim(),
                noticeUrl: optional(minutesForm.noticeUrl),
                minutesUrl: optional(minutesForm.minutesUrl),
                notes: optional(minutesForm.notes),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Acta registrada' });
                setMinutesOpen(false);
                await loadMinutes(selected.id);
                await refreshSelected(selected.id);
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const voterOf = (id: string) => id || user?.id || '';

    const loadVoteState = async (asambleaId: string, voter: string) => {
        const [r, v] = await Promise.all([
            organosService.getResults(asambleaId),
            // 404 si el votante no es asociado: no bloquea ver resultados
            voter ? organosService.hasVoted(asambleaId, voter).catch(() => null) : Promise.resolve(null),
        ]);
        setResults(r.success ? r.data : null);
        setHasVoted(!!(v?.success && v.data));
    };

    const openAssembly = async (id: string) => {
        try {
            const res = await organosService.getAssembly(id);
            if (!res.success || !res.data) return;
            setAssembly(res.data);
            setAttendees(res.data.attendees != null ? String(res.data.attendees) : '');
            setCloseResults('');
            setVoterId('');
            setVoteOption(1);
            setVoteNotes('');
            setResults(null);
            setHasVoted(false);
            await loadVoteState(id, voterOf(''));
        } catch {
            // el listener global muestra el error
        }
    };

    const afterAssemblyChange = async (updated: AssemblyDto) => {
        setAssembly(updated);
        if (selected) await loadAssemblies(selected.id);
    };

    const handleConvene = async () => {
        try {
            const res = await organosService.conveneAssembly({
                ...conveneForm,
                scheduledAt: new Date(conveneForm.scheduledAt).toISOString(),
                notice: conveneForm.notice.trim(),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Asamblea convocada' });
                setConveneOpen(false);
                if (selected) await loadAssemblies(selected.id);
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleAttendance = async () => {
        if (!assembly) return;
        try {
            const res = await organosService.registerAttendance(assembly.id, Number(attendees));
            if (res.success && res.data) {
                showNotification({ type: 'success', message: res.data.hasQuorum ? 'Asistencia registrada: hay quórum' : 'Asistencia registrada: sin quórum' });
                await afterAssemblyChange(res.data);
            }
        } catch {
            // el listener global muestra el error (409 si la asamblea está cerrada)
        }
    };

    const handleClose = async () => {
        if (!assembly) return;
        const ok = await confirm({ message: 'Una asamblea cerrada no admite más votos ni cambios. ¿Cerrar la asamblea?' });
        if (!ok) return;
        try {
            const res = await organosService.closeAssembly(assembly.id, optional(closeResults));
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Asamblea cerrada' });
                await afterAssemblyChange(res.data);
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleVoterChange = async (id: string) => {
        if (!assembly) return;
        setVoterId(id);
        setHasVoted(false);
        try {
            await loadVoteState(assembly.id, voterOf(id));
        } catch {
            // el listener global muestra el error
        }
    };

    const handleVote = async () => {
        if (!assembly) return;
        try {
            const res = await organosService.castVote({
                assemblyId: assembly.id,
                ...(isAdmin && voterId ? { userId: voterId } : {}),
                option: voteOption,
                notes: optional(voteNotes),
            });
            if (res.success) {
                showNotification({ type: 'success', message: 'Voto registrado' });
                setVoteNotes('');
                await loadVoteState(assembly.id, voterOf(voterId));
                const fresh = await organosService.getAssembly(assembly.id);
                if (fresh.success && fresh.data) await afterAssemblyChange(fresh.data);
            }
        } catch (err) {
            // el listener global muestra el mensaje del 409 (cerrada, asociado no activo o voto duplicado)
            if ((err as { status?: number })?.status === 409) {
                await loadVoteState(assembly.id, voterOf(voterId)).catch(() => {});
            }
        }
    };

    if (isLoading) {
        return (
            <LoadingBlock label="Cargando órganos…" className="h-full py-20" />
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

    const resultRows: { label: string; value: number; variant: 'success' | 'danger' | 'warning' | 'primary' }[] = results ? [
        { label: VOTE_OPTION_LABEL[1], value: results.approve, variant: 'success' },
        { label: VOTE_OPTION_LABEL[2], value: results.reject, variant: 'danger' },
        { label: VOTE_OPTION_LABEL[3], value: results.abstain, variant: 'warning' },
        { label: VOTE_OPTION_LABEL[4], value: results.blank, variant: 'primary' },
    ] : [];

    return (
        <PageContainer>
            <PageHeader
                title="Órganos"
                description="Órganos de administración y control, miembros, actas, asambleas y votos."
                actions={isAdmin && (
                    <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                        Crear Órgano
                    </Button>
                )}
            />

            {selected ? (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setSelected(null)}
                            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary dark:text-slate-400"
                        >
                            <ChevronLeft size={16} /> Volver
                        </button>
                        <Badge variant="purple">{BODY_TYPE_LABEL[selected.type] ?? selected.type}</Badge>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{selected.name}</h2>
                    <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">
                        Constituido: {formatDate(selected.constitutionDate)}
                    </p>

                    {detailLoading ? (
                        <LoadingBlock />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={16} /> Miembros</h3>
                                    {isAdmin && <Button size="sm" variant="outline" icon={Plus} onClick={() => setMemberOpen(true)}>Asignar</Button>}
                                </div>
                                <div className="space-y-2">
                                    {members.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Sin miembros.</p>}
                                    {members.map(m => (
                                        <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{m.fullName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{m.position} · {formatDate(m.startDate)}{m.endDate ? ` – ${formatDate(m.endDate)}` : ''}</p>
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
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText size={16} /> Actas</h3>
                                    {isAdmin && (
                                        <Button size="sm" variant="outline" icon={Plus} onClick={() => { setMinutesForm(emptyMinutes(selected.id)); setMinutesOpen(true); }}>
                                            Registrar
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {minutes.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Sin actas.</p>}
                                    {minutes.map(ac => (
                                        <button
                                            key={ac.id}
                                            onClick={() => openMinutesDetail(ac.id)}
                                            className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] hover:ring-1 hover:ring-primary"
                                        >
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">Sesión {SESSION_TYPE_LABEL[ac.sessionType] ?? ac.sessionType}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(ac.sessionDate)} · Quórum {ac.quorum}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{ac.decisions}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Building2 size={16} /> Asambleas</h3>
                                    {isAdmin && (
                                        <Button size="sm" variant="outline" icon={Plus} onClick={() => { setConveneForm(emptyAssembly(selected.id)); setConveneOpen(true); }}>
                                            Convocar
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {assemblies.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Sin asambleas.</p>}
                                    {assemblies.map(as => (
                                        <button
                                            key={as.id}
                                            onClick={() => openAssembly(as.id)}
                                            className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] hover:ring-1 hover:ring-primary"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{SESSION_TYPE_LABEL[as.type] ?? as.type}</p>
                                                <div className="flex gap-1">
                                                    {as.hasQuorum && <Badge variant="info">Quórum</Badge>}
                                                    <Badge variant={as.isClosed ? 'default' : 'success'}>{as.isClosed ? 'Cerrada' : 'Abierta'}</Badge>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(as.scheduledAt)} · Quórum mínimo {as.minimumQuorum} · Votos {as.votesCount}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bodies.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
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
                            {o.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2 dark:text-slate-400">{o.description}</p>}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-[#233948] text-xs text-slate-500 dark:text-slate-400">
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
                        <label htmlFor="organos-tipo" className={labelClass}>Tipo *</label>
                        <select id="organos-tipo"
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

            <Modal
                isOpen={minutesOpen}
                onClose={() => setMinutesOpen(false)}
                title="Registrar Acta"
                icon={<FileText className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreateMinutes} disabled={!minutesForm.decisions.trim() || !minutesForm.sessionDate}>Guardar</Button>
                        <Button variant="outline" onClick={() => setMinutesOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input type="date" label="Fecha de sesión *" value={minutesForm.sessionDate} onChange={(e) => setMinutesForm(f => ({ ...f, sessionDate: e.target.value }))} />
                    <div>
                        <label htmlFor="organos-tipo-de-sesion" className={labelClass}>Tipo de sesión *</label>
                        <select id="organos-tipo-de-sesion" value={minutesForm.sessionType} onChange={(e) => setMinutesForm(f => ({ ...f, sessionType: Number(e.target.value) as SessionType }))} className={`${selectClass} mt-2`}>
                            {Object.entries(SESSION_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <Input type="number" min={0} label="Quórum *" value={minutesForm.quorum} onChange={(e) => setMinutesForm(f => ({ ...f, quorum: Number(e.target.value) }))} />
                    <div>
                        <label htmlFor="organos-asamblea-relacionada" className={labelClass}>Asamblea relacionada</label>
                        <select id="organos-asamblea-relacionada" value={minutesForm.assemblyId ?? ''} onChange={(e) => setMinutesForm(f => ({ ...f, assemblyId: e.target.value || undefined }))} className={`${selectClass} mt-2`}>
                            <option value="">Ninguna</option>
                            {assemblies.map(as => <option key={as.id} value={as.id}>{SESSION_TYPE_LABEL[as.type]} · {formatDate(as.scheduledAt)}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="organos-decisiones" className={labelClass}>Decisiones *</label>
                        <textarea id="organos-decisiones" value={minutesForm.decisions} onChange={(e) => setMinutesForm(f => ({ ...f, decisions: e.target.value }))} className={textareaClass} rows={4} />
                    </div>
                    <Input label="URL de la convocatoria" value={minutesForm.noticeUrl ?? ''} onChange={(e) => setMinutesForm(f => ({ ...f, noticeUrl: e.target.value }))} />
                    <Input label="URL del acta" value={minutesForm.minutesUrl ?? ''} onChange={(e) => setMinutesForm(f => ({ ...f, minutesUrl: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <label htmlFor="organos-notas" className={labelClass}>Notas</label>
                        <textarea id="organos-notas" value={minutesForm.notes ?? ''} onChange={(e) => setMinutesForm(f => ({ ...f, notes: e.target.value }))} className={textareaClass} rows={2} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!minutesDetail}
                onClose={() => setMinutesDetail(null)}
                title="Detalle del Acta"
                icon={<FileText className="text-primary" size={20} />}
                size="lg"
                footer={<Button variant="outline" onClick={() => setMinutesDetail(null)}>Cerrar</Button>}
            >
                {minutesDetail && (
                    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="purple">Sesión {SESSION_TYPE_LABEL[minutesDetail.sessionType] ?? minutesDetail.sessionType}</Badge>
                            <Badge variant="info">Quórum {minutesDetail.quorum}</Badge>
                        </div>
                        <p><span className="font-bold">Fecha:</span> {formatDate(minutesDetail.sessionDate)}</p>
                        <div>
                            <p className="font-bold">Decisiones</p>
                            <p className="whitespace-pre-line">{minutesDetail.decisions}</p>
                        </div>
                        {minutesDetail.notes && (
                            <div>
                                <p className="font-bold">Notas</p>
                                <p className="whitespace-pre-line">{minutesDetail.notes}</p>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                            {minutesDetail.noticeUrl && <a href={minutesDetail.noticeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary font-bold"><ExternalLink size={14} /> Convocatoria</a>}
                            {minutesDetail.minutesUrl && <a href={minutesDetail.minutesUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary font-bold"><ExternalLink size={14} /> Documento del acta</a>}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={conveneOpen}
                onClose={() => setConveneOpen(false)}
                title="Convocar Asamblea"
                icon={<Building2 className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleConvene} disabled={!conveneForm.notice.trim() || !conveneForm.scheduledAt || conveneForm.minimumQuorum < 1}>Convocar</Button>
                        <Button variant="outline" onClick={() => setConveneOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input type="datetime-local" label="Fecha y hora *" value={conveneForm.scheduledAt} onChange={(e) => setConveneForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                    <div>
                        <label htmlFor="organos-tipo-2" className={labelClass}>Tipo *</label>
                        <select id="organos-tipo-2" value={conveneForm.type} onChange={(e) => setConveneForm(f => ({ ...f, type: Number(e.target.value) as SessionType }))} className={`${selectClass} mt-2`}>
                            {Object.entries(SESSION_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <Input type="number" min={1} label="Quórum mínimo *" value={conveneForm.minimumQuorum} onChange={(e) => setConveneForm(f => ({ ...f, minimumQuorum: Number(e.target.value) }))} />
                    <div className="sm:col-span-2">
                        <label htmlFor="organos-convocatoria" className={labelClass}>Convocatoria *</label>
                        <textarea id="organos-convocatoria" value={conveneForm.notice} onChange={(e) => setConveneForm(f => ({ ...f, notice: e.target.value }))} className={textareaClass} rows={4} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!assembly}
                onClose={() => setAssembly(null)}
                title="Detalle de la Asamblea"
                icon={<Building2 className="text-primary" size={20} />}
                size="2xl"
                footer={<Button variant="outline" onClick={() => setAssembly(null)}>Cerrar</Button>}
            >
                {assembly && (
                    <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="purple">{SESSION_TYPE_LABEL[assembly.type] ?? assembly.type}</Badge>
                                <Badge variant={assembly.hasQuorum ? 'success' : 'warning'}>{assembly.hasQuorum ? 'Con quórum' : 'Sin quórum'}</Badge>
                                <Badge variant={assembly.isClosed ? 'default' : 'success'} icon={assembly.isClosed ? Lock : undefined}>
                                    {assembly.isClosed ? `Cerrada ${formatDate(assembly.closedAt)}` : 'Abierta'}
                                </Badge>
                            </div>
                            <p><span className="font-bold">Fecha:</span> {formatDateTime(assembly.scheduledAt)}</p>
                            <p><span className="font-bold">Quórum mínimo:</span> {assembly.minimumQuorum} · <span className="font-bold">Asistentes:</span> {assembly.attendees ?? '—'}</p>
                            <p className="mt-2 whitespace-pre-line">{assembly.notice}</p>
                            {assembly.results && (
                                <div className="mt-2">
                                    <p className="font-bold">Resultados registrados</p>
                                    <p className="whitespace-pre-line">{assembly.results}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <Vote size={16} /> Resultados de votación ({results?.totalVotes ?? 0} votos)
                            </h4>
                            <div className="space-y-3">
                                {resultRows.map(r => (
                                    <div key={r.label}>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span>{r.label}</span>
                                            <span>{r.value}{results && results.totalVotes > 0 ? ` (${Math.round((r.value / results.totalVotes) * 100)}%)` : ''}</span>
                                        </div>
                                        <ProgressBar value={r.value} max={Math.max(results?.totalVotes ?? 0, 1)} variant={r.variant} size="sm" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!assembly.isClosed && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] space-y-3">
                                <h4 className="font-bold text-slate-900 dark:text-white">Votar</h4>
                                {isAdmin && (
                                    <div>
                                        <label htmlFor="organos-votante" className={labelClass}>Votante</label>
                                        <select id="organos-votante" value={voterId} onChange={(e) => handleVoterChange(e.target.value)} className={`${selectClass} mt-2`}>
                                            <option value="">Yo ({user?.name})</option>
                                            {associates.filter(a => a.userId !== user?.id).map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                                        </select>
                                    </div>
                                )}
                                {hasVoted ? (
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        {voterId ? 'Este asociado ya votó en esta asamblea.' : 'Ya registraste tu voto en esta asamblea.'}
                                    </p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {(Object.keys(VOTE_OPTION_LABEL).map(Number) as VoteOption[]).map(opt => (
                                                <Button key={opt} size="sm" variant={voteOption === opt ? 'primary' : 'outline'} onClick={() => setVoteOption(opt)}>
                                                    {VOTE_OPTION_LABEL[opt]}
                                                </Button>
                                            ))}
                                        </div>
                                        <Input label="Observaciones" value={voteNotes} onChange={(e) => setVoteNotes(e.target.value)} />
                                        <Button icon={Vote} onClick={handleVote}>Registrar voto</Button>
                                    </>
                                )}
                            </div>
                        )}

                        {isAdmin && !assembly.isClosed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] space-y-3">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Asistencia</h4>
                                    <Input type="number" min={0} label="Asistentes" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
                                    <Button size="sm" variant="outline" onClick={handleAttendance} disabled={attendees === '' || Number(attendees) < 0}>
                                        Registrar asistencia
                                    </Button>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b22] space-y-3">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Cierre</h4>
                                    <div>
                                        <label htmlFor="organos-resultados" className={labelClass}>Resultados</label>
                                        <textarea id="organos-resultados" value={closeResults} onChange={(e) => setCloseResults(e.target.value)} className={textareaClass} rows={2} />
                                    </div>
                                    <Button size="sm" variant="danger" icon={Lock} onClick={handleClose}>Cerrar asamblea</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
};

