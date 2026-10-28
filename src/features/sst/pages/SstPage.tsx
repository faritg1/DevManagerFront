import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, AlertCircle, FileText, Plus, Stethoscope, ClipboardCheck } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, StatCard } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin } from '../../../shared/hooks';
import { sstService, associatesService } from '../../../shared/api';
import type {
    AssociateDto,
    CreateRiskRequest,
    ExamResult,
    InvestigateAccidentRequest,
    MedicalExamDto,
    RiskDto,
    WorkAccidentDto,
} from '../../../shared/api/types';

const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const today = () => new Date().toISOString().slice(0, 10);

const EXAM_TYPE_LABEL: Record<number, string> = { 1: 'Ingreso', 2: 'Periódico', 3: 'Retiro' };
const EXAM_RESULT_LABEL: Record<number, string> = { 1: 'Apto', 2: 'Apto con restricciones', 3: 'No apto' };
const SEVERITY_LABEL: Record<number, string> = { 1: 'Leve', 2: 'Grave', 3: 'Mortal' };
const RISK_LEVEL_LABEL: Record<number, string> = { 1: 'Bajo', 2: 'Medio', 3: 'Alto', 4: 'Muy alto', 5: 'Crítico' };

const textareaClass = 'w-full rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-1 focus:ring-primary mt-2';
const selectClass = 'w-full h-12 rounded-xl border border-slate-300 dark:border-[#233948] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white px-4 outline-none mt-2';

const emptyRisk = (): CreateRiskRequest => ({ level: 1, factor: '', description: '' });
const emptyInvestigation = (): InvestigateAccidentRequest => ({ investigationDate: today(), conclusions: '', causes: '', correctiveMeasures: '' });

export const SstPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();

    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [exams, setExams] = useState<MedicalExamDto[]>([]);
    const [risks, setRisks] = useState<RiskDto[]>([]);
    const [accidents, setAccidents] = useState<WorkAccidentDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [recording, setRecording] = useState<MedicalExamDto | null>(null);
    const [examResult, setExamResult] = useState<ExamResult>(1);
    const [examNotes, setExamNotes] = useState('');

    const [riskOpen, setRiskOpen] = useState(false);
    const [riskForm, setRiskForm] = useState<CreateRiskRequest>(emptyRisk);

    const [investigating, setInvestigating] = useState<WorkAccidentDto | null>(null);
    const [invForm, setInvForm] = useState<InvestigateAccidentRequest>(emptyInvestigation);

    const nameOf = (userId: string) => associates.find(a => a.userId === userId)?.fullName || (userId === user?.id ? user?.name : userId);

    const loadAll = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const [exRes, riRes, acRes] = await Promise.all([
                isAdmin ? sstService.getPendingExams() : sstService.getExamsByUser(user.id),
                sstService.getRisks(),
                isAdmin ? sstService.getAccidents() : Promise.resolve(null),
            ]);
            setExams(exRes.success && exRes.data ? exRes.data : []);
            setRisks(riRes.success && riRes.data ? riRes.data : []);
            setAccidents(acRes?.success && acRes.data ? acRes.data : []);
        } catch {
            // el listener global muestra el error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        if (isAdmin) {
            associatesService.getAll().then(res => setAssociates(res.success && res.data ? res.data : [])).catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, user?.id]);

    const handleRecordExam = async () => {
        if (!recording) return;
        try {
            const res = await sstService.recordExam(recording.id, examResult, examNotes.trim() || undefined);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Resultado de examen registrado' });
                setRecording(null);
                loadAll();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleCreateRisk = async () => {
        try {
            const res = await sstService.createRisk({
                level: riskForm.level,
                factor: riskForm.factor.trim(),
                description: riskForm.description.trim(),
                ...(riskForm.controls?.trim() ? { controls: riskForm.controls.trim() } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Riesgo agregado a la matriz' });
                setRiskOpen(false);
                setRiskForm(emptyRisk());
                loadAll();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const handleInvestigate = async () => {
        if (!investigating) return;
        try {
            const res = await sstService.investigateAccident(investigating.id, invForm);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Investigación registrada' });
                setInvestigating(null);
                loadAll();
            }
        } catch {
            // el listener global muestra el error
        }
    };

    const pendingInvestigation = accidents.filter(a => !a.investigationCompleted);
    const invValid = invForm.conclusions.trim() && invForm.causes.trim() && invForm.correctiveMeasures.trim();

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Seguridad y Salud en el Trabajo (SST)
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Exámenes médicos, matriz de riesgos y accidentes de trabajo (FURAT).
                    </p>
                </div>
                {isAdmin && (
                    <Button icon={Plus} onClick={() => { setRiskForm(emptyRisk()); setRiskOpen(true); }}>
                        Agregar Riesgo
                    </Button>
                )}
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 mb-6`}>
                <StatCard title={isAdmin ? 'Exámenes pendientes' : 'Mis exámenes'} value={exams.length} icon={Stethoscope} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Riesgos" value={risks.length} icon={ShieldAlert} iconColor="text-orange-500" iconBgColor="bg-orange-100 dark:bg-orange-500/10" />
                {isAdmin && <StatCard title="Accidentes sin investigar" value={pendingInvestigation.length} icon={AlertCircle} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Stethoscope className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isAdmin ? 'Exámenes Médicos Pendientes' : 'Mis Exámenes Médicos'}</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : exams.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin exámenes.</p>
                    ) : (
                        <div className="space-y-3">
                            {exams.map(e => (
                                <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22] flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Examen de {EXAM_TYPE_LABEL[e.examType] ?? e.examType}</p>
                                        <p className="text-xs text-slate-500">
                                            Programado: {formatDate(e.scheduledDate)}{isAdmin && <> · {nameOf(e.userId)}</>}
                                        </p>
                                        {e.performed && e.result && (
                                            <p className="text-xs text-slate-500">Resultado: {EXAM_RESULT_LABEL[e.result]} ({formatDate(e.performedAt)})</p>
                                        )}
                                    </div>
                                    {isAdmin && !e.performed && (
                                        <Button size="sm" onClick={() => { setRecording(e); setExamResult(1); setExamNotes(''); }}>Registrar</Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="text-orange-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Matriz de Riesgos</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : risks.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin riesgos registrados.</p>
                    ) : (
                        <div className="space-y-3">
                            {risks.map(r => (
                                <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b22]">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900 dark:text-white">{r.factor}</p>
                                        <Badge variant={r.level >= 3 ? 'danger' : r.level === 2 ? 'warning' : 'success'}>
                                            {RISK_LEVEL_LABEL[r.level] ?? `Nivel ${r.level}`}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                                    {r.controls && <p className="text-xs text-slate-500 mt-1"><ClipboardCheck size={12} className="inline" /> {r.controls}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {isAdmin && (
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="text-rose-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Accidentes de Trabajo (FURAT)</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : accidents.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin accidentes registrados.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-[#111b22] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#233948]">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Fecha</th>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Asociado</th>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tipo</th>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Gravedad</th>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">ARL</th>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Estado</th>
                                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-[#233948]">
                                    {accidents.map(a => (
                                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-[#233948]/50">
                                            <td className="px-6 py-4 text-slate-500">{formatDate(a.occurredAt)}</td>
                                            <td className="px-6 py-4 text-slate-500">{nameOf(a.userId)}</td>
                                            <td className="px-6 py-4 text-slate-500">{a.accidentType}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={a.severity >= 2 ? 'danger' : 'warning'}>{SEVERITY_LABEL[a.severity] ?? a.severity}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{a.arl}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={a.investigationCompleted ? 'success' : 'warning'} dot>
                                                    {a.investigationCompleted ? 'Investigado' : 'Pendiente'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {!a.investigationCompleted && (
                                                    <Button size="sm" variant="outline" onClick={() => { setInvestigating(a); setInvForm(emptyInvestigation()); }}>
                                                        Investigar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            <Modal
                isOpen={!!recording}
                onClose={() => setRecording(null)}
                title="Registrar Resultado de Examen"
                icon={<Stethoscope className="text-blue-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button onClick={handleRecordExam}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRecording(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Resultado *</label>
                        <select value={examResult} onChange={(e) => setExamResult(Number(e.target.value) as ExamResult)} className={selectClass}>
                            {Object.entries(EXAM_RESULT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <Input label="Observaciones" value={examNotes} onChange={(e) => setExamNotes(e.target.value)} />
                </div>
            </Modal>

            <Modal
                isOpen={riskOpen}
                onClose={() => setRiskOpen(false)}
                title="Agregar Riesgo"
                icon={<ShieldAlert className="text-orange-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleCreateRisk} disabled={!riskForm.factor.trim() || !riskForm.description.trim()}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRiskOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Nivel de riesgo *</label>
                        <select value={riskForm.level} onChange={(e) => setRiskForm(f => ({ ...f, level: Number(e.target.value) }))} className={selectClass}>
                            {Object.entries(RISK_LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <Input label="Factor *" value={riskForm.factor} onChange={(e) => setRiskForm(f => ({ ...f, factor: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Descripción *</label>
                        <textarea value={riskForm.description} onChange={(e) => setRiskForm(f => ({ ...f, description: e.target.value }))} className={textareaClass} rows={3} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-slate-700 dark:text-white text-sm font-bold">Controles</label>
                        <textarea value={riskForm.controls || ''} onChange={(e) => setRiskForm(f => ({ ...f, controls: e.target.value }))} className={textareaClass} rows={3} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!investigating}
                onClose={() => setInvestigating(null)}
                title="Investigar Accidente"
                icon={<ClipboardCheck className="text-rose-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button onClick={handleInvestigate} disabled={!invValid}>Guardar Investigación</Button>
                        <Button variant="outline" onClick={() => setInvestigating(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input type="date" label="Fecha de investigación *" value={invForm.investigationDate} onChange={(e) => setInvForm(f => ({ ...f, investigationDate: e.target.value }))} />
                    <Input label="Conclusiones *" value={invForm.conclusions} onChange={(e) => setInvForm(f => ({ ...f, conclusions: e.target.value }))} />
                    <Input label="Causas *" value={invForm.causes} onChange={(e) => setInvForm(f => ({ ...f, causes: e.target.value }))} />
                    <Input label="Medidas correctivas *" value={invForm.correctiveMeasures} onChange={(e) => setInvForm(f => ({ ...f, correctiveMeasures: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
};

export default SstPage;
