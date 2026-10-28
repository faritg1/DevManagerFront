import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, UserRound } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, LevelSelector, PageContainer, PageHeader, LoadingBlock, SELECT_CLASS, TABLE_CLASS, THEAD_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TR_CLASS } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { gestionHumanaService, associatesService } from '../../../shared/api';
import type { AssociateDto, CompetencyDto, CreateCompetencyRequest } from '../../../shared/api/types';
import { formatDate, SKILL_LEVELS, skillLevelLabel } from '../../../shared/format';

const selectClass = `${SELECT_CLASS} w-full mt-2`;
const textareaClass = 'w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2';
const thClass = TH_CLASS;

const emptyForm = (): CreateCompetencyRequest => ({ userId: '', name: '', level: 1 });

/** Competencias cooperativas: búsqueda por competencia y registro por asociado (escrituras solo Admin). */
export const CompetenciasPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [associates, setAssociates] = useState<AssociateDto[]>([]);

    const [query, setQuery] = useState('');
    const [onlyAvailable, setOnlyAvailable] = useState(true);
    const [searchResults, setSearchResults] = useState<CompetencyDto[] | null>(null);
    const [searching, setSearching] = useState(false);

    /** Admin elige el asociado; el asociado ve las suyas */
    const [ownerId, setOwnerId] = useState('');
    const [owned, setOwned] = useState<CompetencyDto[]>([]);
    const [ownedLoading, setOwnedLoading] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState<CreateCompetencyRequest>(emptyForm);

    const targetUserId = isAdmin ? ownerId : user?.id ?? '';

    const loadOwned = async (userId: string) => {
        if (!userId) { setOwned([]); return; }
        setOwnedLoading(true);
        try {
            const res = await gestionHumanaService.getByUser(userId);
            setOwned(res.success && res.data ? res.data : []);
        } catch {
            setOwned([]);
        } finally {
            setOwnedLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            associatesService.getAll().then(res => setAssociates(res.success && res.data ? res.data : [])).catch(() => setAssociates([]));
        }
    }, [isAdmin]);

    useEffect(() => {
        loadOwned(targetUserId);
    }, [targetUserId]);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const res = await gestionHumanaService.search(query.trim(), onlyAvailable);
            setSearchResults(res.success && res.data ? res.data : []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await gestionHumanaService.create({
                userId: form.userId,
                name: form.name.trim(),
                level: form.level,
                ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Competencia registrada' });
                setCreateOpen(false);
                if (form.userId === targetUserId) loadOwned(targetUserId);
                else setOwnerId(form.userId);
            }
        } catch {
            // el listener global muestra el error (409 si el asociado está retirado o ya la tiene)
        }
    };

    const handleToggle = async (c: CompetencyDto) => {
        try {
            const res = await gestionHumanaService.setAvailability(c.id, !c.isAvailable);
            if (res.success && res.data) {
                const updated = res.data;
                const swap = (list: CompetencyDto[]) => list.map(x => (x.id === updated.id ? updated : x));
                setOwned(swap);
                setSearchResults(r => (r ? swap(r) : r));
                showNotification({ type: 'success', message: updated.isAvailable ? 'Competencia disponible' : 'Competencia no disponible' });
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const availabilityCell = (c: CompetencyDto) => (
        <div className="flex items-center gap-2">
            <Badge variant={c.isAvailable ? 'success' : 'default'} dot>{c.isAvailable ? 'Disponible' : 'No disponible'}</Badge>
            {isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => handleToggle(c)}>
                    {c.isAvailable ? 'Desactivar' : 'Activar'}
                </Button>
            )}
        </div>
    );

    const table = (rows: CompetencyDto[], showOwner: boolean) => (
        <div className="overflow-x-auto">
            <table className={TABLE_CLASS}>
                <thead className={THEAD_CLASS}>
                    <tr>
                        {showOwner && <th className={thClass}>Asociado</th>}
                        <th className={thClass}>Competencia</th>
                        <th className={thClass}>Nivel</th>
                        <th className={thClass}>Disponibilidad</th>
                        <th className={thClass}>Actualizada</th>
                    </tr>
                </thead>
                <tbody className={TBODY_CLASS}>
                    {rows.map(c => (
                        <tr key={c.id} className={TR_CLASS}>
                            {showOwner && <td className={`${TD_CLASS} font-bold text-slate-900 dark:text-white`}>{c.fullName}</td>}
                            <td className={`${TD_CLASS} text-slate-700 dark:text-slate-300`}>
                                <p className="font-bold">{c.name}</p>
                                {c.notes && <p className="text-xs text-slate-500 whitespace-normal dark:text-slate-400">{c.notes}</p>}
                            </td>
                            <td className={TD_CLASS}><Badge variant="purple">{skillLevelLabel(c.level)}</Badge></td>
                            <td className={TD_CLASS}>{availabilityCell(c)}</td>
                            <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{formatDate(c.updatedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <PageContainer>
            <PageHeader
                title="Competencias"
                description="Competencias cooperativas de los asociados disponibles para el servicio solidario."
                actions={isAdmin && (
                    <Button icon={Plus} onClick={() => { setForm({ ...emptyForm(), userId: ownerId }); setCreateOpen(true); }}>
                        Registrar Competencia
                    </Button>
                )}
            />

            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Search className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Buscar por Competencia</h2>
                </div>
                <form
                    className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4"
                    onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                >
                    <div className="flex-1">
                        <Input label="Competencia" placeholder="Ej: contabilidad" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 h-12">
                        <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
                        Solo disponibles
                    </label>
                    <Button type="submit" icon={Search} disabled={!query.trim()} isLoading={searching}>Buscar</Button>
                </form>
                {searchResults === null ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Escribe una competencia para encontrar asociados.</p>
                ) : searchResults.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin resultados.</p>
                ) : table(searchResults, true)}
            </Card>

            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <UserRound className="text-orange-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {isAdmin ? 'Competencias por Asociado' : 'Mis Competencias'}
                    </h2>
                </div>
                {isAdmin && (
                    <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={`${selectClass} mb-4`}>
                        <option value="">Seleccione un asociado</option>
                        {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                    </select>
                )}
                {ownedLoading ? (
                    <LoadingBlock />
                ) : !targetUserId ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Seleccione un asociado para ver sus competencias.</p>
                ) : owned.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin competencias registradas.</p>
                ) : table(owned, false)}
            </Card>

            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Registrar Competencia"
                icon={<Award className="text-primary" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreate} disabled={!form.userId || !form.name.trim()}>Guardar</Button>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="competencias-asociado" className="text-slate-700 dark:text-white text-sm font-bold">Asociado *</label>
                        <select id="competencias-asociado" value={form.userId} onChange={(e) => setForm(f => ({ ...f, userId: e.target.value }))} className={selectClass}>
                            <option value="">Seleccione un asociado</option>
                            {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                        </select>
                    </div>
                    <Input label="Competencia *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                    <div role="group" aria-labelledby="competencias-nivel">
                        <p id="competencias-nivel" className="text-slate-700 dark:text-white text-sm font-bold">Nivel *</p>
                        <LevelSelector levels={SKILL_LEVELS} selectedId={form.level} onSelect={(id) => setForm(f => ({ ...f, level: id }))} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="competencias-notas" className="text-slate-700 dark:text-white text-sm font-bold">Notas</label>
                        <textarea id="competencias-notas" value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className={textareaClass} rows={2} />
                    </div>
                </div>
            </Modal>
        </PageContainer>
    );
};

