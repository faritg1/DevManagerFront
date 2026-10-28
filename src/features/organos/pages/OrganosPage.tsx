import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, Users, FileText, Building2, ChevronLeft } from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { organosService, usersService } from '../../../shared/api';
import {
    TipoOrgano,
    type AsambleaDto,
    type CreateOrganoDto,
    type MiembroOrganoDto,
    type ActaDto,
    type OrganoDto,
    type ResultadoVotacionDto,
} from '../../../shared/api/types';

const tipoOrganoLabel: Record<number, string> = {
    [TipoOrgano.AsambleaGeneral]: 'Asamblea General',
    [TipoOrgano.ConsejoAdministracion]: 'Consejo de Administración',
    [TipoOrgano.JuntaVigilancia]: 'Junta de Vigilancia',
    [TipoOrgano.RevisorFiscal]: 'Revisor Fiscal',
    [TipoOrgano.Comite]: 'Comité',
    [TipoOrgano.Otros]: 'Otros',
};

const formatDate = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const OrganosPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const orgId = user?.organizationId ?? '';

    const [organos, setOrganos] = useState<OrganoDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateOrganoDto>({
        tipo: TipoOrgano.ConsejoAdministracion,
        nombre: '',
        organizationId: orgId,
        fechaConstitucion: new Date().toISOString().slice(0, 10),
    });

    // Detalle
    const [selected, setSelected] = useState<OrganoDto | null>(null);
    const [miembros, setMiembros] = useState<MiembroOrganoDto[]>([]);
    const [actas, setActas] = useState<ActaDto[]>([]);
    const [asambleas, setAsambleas] = useState<AsambleaDto[]>([]);
    const [resultados, setResultados] = useState<ResultadoVotacionDto | null>(null);
    const [asociados, setAsociados] = useState<{ id: string; fullName: string }[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Asignar miembro
    const [memberOpen, setMemberOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ asociadoId: '', cargo: '', fechaInicio: new Date().toISOString().slice(0, 10) });

    const loadOrganos = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await organosService.getOrganosByOrganization(orgId);
            setOrganos(data);
        } catch (e) {
            console.error(e);
            setError('Error de conexión al cargar órganos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrganos();
        usersService.getAll().then(res => {
            if (res.success && res.data) setAsociados(res.data);
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const handleCreate = async () => {
        try {
            const created = await organosService.createOrgano(createForm);
            showNotification({ type: 'success', message: 'Órgano creado' });
            setCreateOpen(false);
            setCreateForm(f => ({ ...f, nombre: '' }));
            await loadOrganos();
            setSelected(created);
        } catch (e) {
            console.error(e);
            showNotification({ type: 'error', message: 'Error al crear órgano' });
        }
    };

    const openDetail = async (organo: OrganoDto) => {
        setSelected(organo);
        setDetailLoading(true);
        try {
            const [m, a, asamb] = await Promise.all([
                organosService.getMiembrosByOrgano(organo.id),
                organosService.getActasByOrgano(organo.id),
                organosService.getAsambleasByOrganization(orgId),
            ]);
            setMiembros(m);
            setActas(a);
            setAsambleas(asamb.filter(x => x.organoId === organo.id || x.organoId === null));
            setResultados(null);
        } catch (e) {
            console.error(e);
            setMiembros([]); setActas([]); setAsambleas([]);
            showNotification({ type: 'error', message: 'Error al cargar detalle' });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!selected || !memberForm.asociadoId) return;
        try {
            await organosService.asignarMiembro({
                organoId: selected.id,
                asociadoId: memberForm.asociadoId,
                cargo: memberForm.cargo,
                fechaInicio: memberForm.fechaInicio,
            });
            showNotification({ type: 'success', message: 'Miembro asignado' });
            setMemberOpen(false);
            setMemberForm({ asociadoId: '', cargo: '', fechaInicio: new Date().toISOString().slice(0, 10) });
            const m = await organosService.getMiembrosByOrgano(selected.id);
            setMiembros(m);
            const updated = await organosService.getOrganoById(selected.id);
            setSelected(updated);
        } catch (e) {
            console.error(e);
            showNotification({ type: 'error', message: 'Error al asignar miembro' });
        }
    };

    const handleVerResultados = async (asambleaId: string) => {
        try {
            const r = await organosService.getResultados(asambleaId);
            setResultados(r);
        } catch (e) {
            console.error(e);
            showNotification({ type: 'error', message: 'Error al consultar resultados' });
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
                <Button variant="outline" onClick={loadOrganos}>Reintentar</Button>
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
                <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                    Crear Órgano
                </Button>
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
                        <Badge variant="purple">{tipoOrganoLabel[selected.tipo] || selected.tipoNombre}</Badge>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{selected.nombre}</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Constituido: {formatDate(selected.fechaConstitucion)}
                    </p>

                    {detailLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Miembros */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={16} /> Miembros</h3>
                                    <Button size="sm" variant="outline" icon={Plus} onClick={() => setMemberOpen(true)}>Asignar</Button>
                                </div>
                                <div className="space-y-2">
                                    {miembros.length === 0 && <p className="text-sm text-slate-500">Sin miembros.</p>}
                                    {miembros.map(m => (
                                        <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                                {asociados.find(a => a.id === m.asociadoId)?.fullName || m.asociadoId}
                                            </p>
                                            <p className="text-xs text-slate-500">{m.cargo} · {formatDate(m.fechaInicio)}</p>
                                            <Badge variant={m.activo ? 'success' : 'default'}>{m.activo ? 'Activo' : 'Inactivo'}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actas */}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3"><FileText size={16} /> Actas</h3>
                                <div className="space-y-2">
                                    {actas.length === 0 && <p className="text-sm text-slate-500">Sin actas.</p>}
                                    {actas.map(ac => (
                                        <div key={ac.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{ac.tipoSesion}</p>
                                            <p className="text-xs text-slate-500">{formatDate(ac.fecha)} · Quórum {ac.quorum}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Asambleas */}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3"><Building2 size={16} /> Asambleas</h3>
                                <div className="space-y-2">
                                    {asambleas.length === 0 && <p className="text-sm text-slate-500">Sin asambleas.</p>}
                                    {asambleas.map(as => (
                                        <div key={as.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{as.tipoNombre}</p>
                                            <p className="text-xs text-slate-500">{formatDate(as.fecha)} · Quórum {as.quorumMinimo} · Votos {as.votosCount}</p>
                                            <Button size="sm" variant="ghost" className="mt-1" onClick={() => handleVerResultados(as.id)}>
                                                Ver resultados
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {resultados && (
                                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs">
                                        <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Resultados de votación</p>
                                        <p>Aprobados: {resultados.aprobados} · Rechazados: {resultados.rechazados} · Abstenciones: {resultados.abstenciones} · Blancos: {resultados.blancos}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organos.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-500">
                            No hay órganos registrados para esta organización.
                        </div>
                    )}
                    {organos.map(o => (
                        <Card key={o.id} hoverable onClick={() => openDetail(o)}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <Badge variant="purple">{tipoOrganoLabel[o.tipo] || o.tipoNombre}</Badge>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{o.nombre}</h3>
                                </div>
                            </div>
                            {o.descripcion && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{o.descripcion}</p>}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-[#233948] text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Users size={13} /> {o.miembrosCount} miembros</span>
                                <span className="flex items-center gap-1"><FileText size={13} /> {o.actasCount} actas</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create organo modal */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Crear Órgano"
                icon={<Plus className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreate}>Guardar</Button>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Nombre *" value={createForm.nombre} onChange={(e) => setCreateForm(f => ({ ...f, nombre: e.target.value }))} />
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Tipo *</label>
                        <select
                            value={createForm.tipo}
                            onChange={(e) => setCreateForm(f => ({ ...f, tipo: Number(e.target.value) as TipoOrgano }))}
                            className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2"
                        >
                            {Object.entries(tipoOrganoLabel).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <Input type="date" label="Fecha de constitución" value={createForm.fechaConstitucion} onChange={(e) => setCreateForm(f => ({ ...f, fechaConstitucion: e.target.value }))} />
                </div>
            </Modal>

            {/* Assign member modal */}
            <Modal
                isOpen={memberOpen}
                onClose={() => setMemberOpen(false)}
                title="Asignar Miembro"
                icon={<Users className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleAddMember}>Asignar</Button>
                        <Button variant="outline" onClick={() => setMemberOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <select
                        value={memberForm.asociadoId}
                        onChange={(e) => setMemberForm(f => ({ ...f, asociadoId: e.target.value }))}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none"
                    >
                        <option value="">Asociado *</option>
                        {asociados.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                    </select>
                    <Input label="Cargo *" value={memberForm.cargo} onChange={(e) => setMemberForm(f => ({ ...f, cargo: e.target.value }))} />
                    <Input type="date" label="Fecha de inicio" value={memberForm.fechaInicio} onChange={(e) => setMemberForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
};

export default OrganosPage;
