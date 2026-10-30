import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, FileText, Plus, Stethoscope, ClipboardCheck, CalendarPlus, Siren } from 'lucide-react';
import { Card, Badge, Button, Input, Select, Textarea, Modal, StatCard, PageContainer, PageHeader, LoadingBlock, EmptyState, Pager, SearchInput, SELECT_CLASS, TABLE_CLASS, THEAD_CLASS, TH_CLASS, TBODY_CLASS, TD_CLASS, TH_ACTIONS_CLASS, TR_CLASS, TableActions, ExportButton } from '../../../shared/ui';
import { useNotification, useAuth } from '../../../shared/context';
import { useIsAdmin, usePagedFilter, usePermission } from '../../../shared/hooks';
import { sstService, associatesService } from '../../../shared/api';
import type {
    AccidentSeverity,
    AssociateDto,
    CreateRiskRequest,
    ExamResult,
    ExamType,
    InvestigateAccidentRequest,
    MedicalExamDto,
    ReportAccidentRequest,
    RiskDto,
    WorkAccidentDto,
} from '../../../shared/api/types';
import { formatDate, today } from '../../../shared/format';
import { AskAiButton } from '../../ai/AskAiButton';
import type { CsvColumn } from '../../../shared/export';

/** yyyy-MM-ddTHH:mm en hora local, para inputs datetime-local */
const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const EXAM_TYPE_LABEL: Record<number, string> = { 1: 'Ingreso', 2: 'Periódico', 3: 'Retiro' };
const EXAM_RESULT_LABEL: Record<number, string> = { 1: 'Apto', 2: 'Apto con restricciones', 3: 'No apto' };
const SEVERITY_LABEL: Record<number, string> = { 1: 'Leve', 2: 'Grave', 3: 'Mortal' };
const RISK_LEVEL_LABEL: Record<number, string> = { 1: 'Bajo', 2: 'Medio', 3: 'Alto', 4: 'Muy alto', 5: 'Crítico' };

const emptyRisk = (): CreateRiskRequest => ({ level: 1, factor: '', description: '' });
const emptyInvestigation = (): InvestigateAccidentRequest => ({ investigationDate: today(), conclusions: '', causes: '', correctiveMeasures: '' });
const emptySchedule = () => ({ userId: '', examType: 1 as ExamType, scheduledDate: today() });
const emptyAccident = (): ReportAccidentRequest => ({ userId: '', occurredAt: nowLocal(), accidentType: '', severity: 1, arl: '', description: '' });

const isConflict = (err: unknown) => (err as { status?: number })?.status === 409;

export const SstPage: React.FC = () => {
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const { has } = usePermission();
    const canExams = has('menu.solidarity.sst.exams');
    const canAccidents = has('menu.solidarity.sst.accidents');
    const canRisks = has('menu.solidarity.sst.risks');

    const [associates, setAssociates] = useState<AssociateDto[]>([]);
    const [exams, setExams] = useState<MedicalExamDto[]>([]);
    const [risks, setRisks] = useState<RiskDto[]>([]);
    const [accidents, setAccidents] = useState<WorkAccidentDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /** Admin: '' = pendientes de la organización; un userId = exámenes de ese asociado */
    const [examScope, setExamScope] = useState('');
    const [onlyPendingAccidents, setOnlyPendingAccidents] = useState(false);

    const [recording, setRecording] = useState<MedicalExamDto | null>(null);
    const [examResult, setExamResult] = useState<ExamResult>(1);
    const [examNotes, setExamNotes] = useState('');
    const [examFileUrl, setExamFileUrl] = useState('');

    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduleForm, setScheduleForm] = useState(emptySchedule);

    const [accidentOpen, setAccidentOpen] = useState(false);
    const [accidentForm, setAccidentForm] = useState<ReportAccidentRequest>(emptyAccident);

    const [riskOpen, setRiskOpen] = useState(false);
    const [riskForm, setRiskForm] = useState<CreateRiskRequest>(emptyRisk);

    const [investigating, setInvestigating] = useState<WorkAccidentDto | null>(null);
    const [invForm, setInvForm] = useState<InvestigateAccidentRequest>(emptyInvestigation);
    const [saving, setSaving] = useState(false);

    /** Runs a modal submit with the button in loading state, ignoring repeat submits. */
    const submitting = (fn: () => Promise<void>) => async () => {
        if (saving) return;
        setSaving(true);
        try { await fn(); } finally { setSaving(false); }
    };

    const nameOf = (userId: string) => associates.find(a => a.userId === userId)?.fullName || (userId === user?.id ? user?.name : 'Asociado no disponible');
    const accidentColumns: CsvColumn<WorkAccidentDto>[] = [
        { header: 'Fecha', value: (a) => formatDate(a.occurredAt, undefined, '') },
        { header: 'Asociado', value: (a) => nameOf(a.userId) },
        { header: 'Tipo', value: (a) => a.accidentType },
        { header: 'Gravedad', value: (a) => SEVERITY_LABEL[a.severity] ?? a.severity },
        { header: 'ARL', value: (a) => a.arl },
        { header: 'FURAT', value: (a) => a.furatNumber },
        { header: 'Estado', value: (a) => (a.investigationCompleted ? 'Investigado' : 'Pendiente') },
        { header: 'Fecha de investigación', value: (a) => formatDate(a.investigationDate, undefined, '') },
        { header: 'Descripción', value: (a) => a.description },
    ];

    const loadAll = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const [exRes, riRes, acRes] = await Promise.all([
                canExams
                    ? (examScope ? sstService.getExamsByUser(examScope) : sstService.getPendingExams())
                    : sstService.getExamsByUser(user.id),
                sstService.getRisks(),
                canAccidents
                    ? (onlyPendingAccidents ? sstService.getAccidentsPendingInvestigation() : sstService.getAccidents())
                    : Promise.resolve(null),
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canExams, canAccidents, user?.id, examScope, onlyPendingAccidents]);

    useEffect(() => {
        if (isAdmin || canExams || canAccidents) {
            associatesService.getAll().then(res => setAssociates(res.success && res.data ? res.data : [])).catch(() => {});
        }
    }, [isAdmin, canExams, canAccidents]);

    const handleRecordExam = submitting(async () => {
        if (!recording) return;
        try {
            const res = await sstService.recordExam(recording.id, examResult, examNotes.trim() || undefined, examFileUrl.trim() || undefined);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Resultado de examen registrado' });
                setRecording(null);
                loadAll();
            }
        } catch (err) {
            // el listener global muestra el mensaje del 409 (resultado ya registrado)
            if (isConflict(err)) {
                setRecording(null);
                loadAll();
            }
        }
    });


    const handleSchedule = submitting(async () => {
        try {
            const res = await sstService.scheduleExam(scheduleForm.userId, scheduleForm.examType, scheduleForm.scheduledDate);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Examen médico programado' });
                setScheduleOpen(false);
                loadAll();
            }
        } catch {
            // el listener global muestra el error
        }
    });


    const handleReportAccident = submitting(async () => {
        if (!accidentValid) return;
        try {
            const res = await sstService.reportAccident({
                userId: accidentForm.userId,
                occurredAt: new Date(accidentForm.occurredAt).toISOString(),
                accidentType: accidentForm.accidentType.trim(),
                severity: accidentForm.severity,
                arl: accidentForm.arl.trim(),
                description: accidentForm.description.trim(),
                ...(accidentForm.furatNumber?.trim() ? { furatNumber: accidentForm.furatNumber.trim() } : {}),
            });
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Accidente de trabajo reportado' });
                setAccidentOpen(false);
                loadAll();
            }
        } catch {
            // el listener global muestra el error
        }
    });


    const handleCreateRisk = submitting(async () => {
        if (!riskForm.factor.trim() || !riskForm.description.trim()) return;
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
    });


    const handleInvestigate = submitting(async () => {
        if (!investigating || !invValid) return;
        try {
            const res = await sstService.investigateAccident(investigating.id, invForm);
            if (res.success && res.data) {
                showNotification({ type: 'success', message: 'Investigación registrada' });
                setInvestigating(null);
                loadAll();
            }
        } catch (err) {
            // el listener global muestra el mensaje del 409 (investigación única)
            if (isConflict(err)) {
                setInvestigating(null);
                loadAll();
            }
        }
    });


    const pendingInvestigation = accidents.filter(a => !a.investigationCompleted);
    const invValid = invForm.conclusions.trim() && invForm.causes.trim() && invForm.correctiveMeasures.trim();
    const accidentInFuture = accidentForm.occurredAt > nowLocal();
    const accidentValid = accidentForm.userId && accidentForm.occurredAt && !accidentInFuture
        && accidentForm.accidentType.trim() && accidentForm.arl.trim() && accidentForm.description.trim();

    const associatePicker = (value: string, onChange: (v: string) => void) => (
        <Select label="Asociado *" required value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Seleccione un asociado</option>
            {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
        </Select>
    );

    const accidentPager = usePagedFilter(accidents, { searchFields: a => [nameOf(a.userId), a.accidentType, a.arl, a.furatNumber] });

    return (
        <PageContainer>
            <PageHeader
                title="Seguridad y Salud en el Trabajo (SST)"
                description="Exámenes médicos, matriz de riesgos y accidentes de trabajo (FURAT)."
                actions={<><AskAiButton moduleKey="sst" />{(canExams || canAccidents || canRisks) && (
                    <div className="flex flex-wrap gap-2">
                        {canExams && <Button icon={CalendarPlus} variant="outline" onClick={() => { setScheduleForm(emptySchedule()); setScheduleOpen(true); }}>
                            Programar Examen
                        </Button>}
                        {canAccidents && <Button icon={Siren} variant="outline" onClick={() => { setAccidentForm(emptyAccident()); setAccidentOpen(true); }}>
                            Reportar Accidente
                        </Button>}
                        {canRisks && <Button icon={Plus} onClick={() => { setRiskForm(emptyRisk()); setRiskOpen(true); }}>
                            Agregar Riesgo
                        </Button>}
                    </div>
                )}</>}
            />

            <div className={`grid grid-cols-1 ${canAccidents ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 mb-6`}>
                <StatCard title={canExams ? (examScope ? 'Exámenes del asociado' : 'Exámenes pendientes') : 'Mis exámenes'} value={exams.length} icon={Stethoscope} iconColor="text-blue-500" iconBgColor="bg-blue-100 dark:bg-blue-500/10" />
                <StatCard title="Riesgos" value={risks.length} icon={ShieldAlert} iconColor="text-orange-500" iconBgColor="bg-orange-100 dark:bg-orange-500/10" />
                {canAccidents && <StatCard title="Accidentes sin investigar" value={pendingInvestigation.length} icon={AlertCircle} iconColor="text-rose-500" iconBgColor="bg-rose-100 dark:bg-rose-500/10" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Stethoscope className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {canExams ? (examScope ? 'Exámenes del Asociado' : 'Exámenes Médicos Pendientes') : 'Mis Exámenes Médicos'}
                        </h2>
                    </div>
                    {isAdmin && (
                        <select aria-label="Exámenes a mostrar" value={examScope} onChange={(e) => setExamScope(e.target.value)} className={`${SELECT_CLASS} w-full mb-4`}>
                            <option value="">Pendientes de toda la organización</option>
                            {associates.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
                        </select>
                    )}
                    {isLoading ? (
                        <LoadingBlock />
                    ) : exams.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin exámenes.</p>
                    ) : (
                        <div className="space-y-3">
                            {exams.map(e => (
                                <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-background-dark flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Examen de {EXAM_TYPE_LABEL[e.examType] ?? e.examType}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Programado: {formatDate(e.scheduledDate)}{canExams && <> · {nameOf(e.userId)}</>}
                                        </p>
                                        {e.performed && e.result && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Resultado: {EXAM_RESULT_LABEL[e.result]} ({formatDate(e.performedAt)})</p>
                                        )}
                                        {e.notes && <p className="text-xs text-slate-500 dark:text-slate-400">{e.notes}</p>}
                                        {e.fileUrl && <a href={e.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold">Ver soporte</a>}
                                    </div>
                                    {e.performed ? (
                                        <Badge variant="success">Realizado</Badge>
                                    ) : canExams ? (
                                        <Button size="sm" onClick={() => { setRecording(e); setExamResult(1); setExamNotes(''); setExamFileUrl(''); }}>Registrar</Button>
                                    ) : (
                                        <Badge variant="warning">Pendiente</Badge>
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
                        <LoadingBlock />
                    ) : risks.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin riesgos registrados.</p>
                    ) : (
                        <div className="space-y-3">
                            {risks.map(r => (
                                <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-background-dark">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900 dark:text-white">{r.factor}</p>
                                        <Badge variant={r.level >= 3 ? 'danger' : r.level === 2 ? 'warning' : 'success'}>
                                            {RISK_LEVEL_LABEL[r.level] ?? `Nivel ${r.level}`}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{r.description}</p>
                                    {r.controls && <p className="text-xs text-slate-500 mt-1 dark:text-slate-400"><ClipboardCheck size={12} className="inline" /> {r.controls}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {canAccidents && (
                <Card>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <FileText className="text-rose-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Accidentes de Trabajo (FURAT)</h2>
                        <SearchInput pager={accidentPager} label="Buscar accidente" className="sm:ml-auto sm:max-w-xs" />
                        <ExportButton rows={accidentPager.filtered} columns={accidentColumns} filename="accidentes-sst" />
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input type="checkbox" checked={onlyPendingAccidents} onChange={(e) => setOnlyPendingAccidents(e.target.checked)} />
                            Solo pendientes de investigación
                        </label>
                    </div>
                    {isLoading ? (
                        <LoadingBlock />
                    ) : accidentPager.total === 0 ? (
                        <EmptyState title={accidentPager.query ? 'Ningún accidente coincide con la búsqueda' : 'Sin accidentes registrados'} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={TABLE_CLASS}>
                                <thead className={THEAD_CLASS}>
                                    <tr>
                                        <th className={TH_CLASS}>Fecha</th>
                                        <th className={TH_CLASS}>Asociado</th>
                                        <th className={TH_CLASS}>Tipo</th>
                                        <th className={TH_CLASS}>Gravedad</th>
                                        <th className={TH_CLASS}>ARL</th>
                                        <th className={TH_CLASS}>FURAT</th>
                                        <th className={TH_CLASS}>Estado</th>
                                        <th className={TH_ACTIONS_CLASS}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className={TBODY_CLASS}>
                                    {accidentPager.pageItems.map(a => (
                                        <tr key={a.id} className={TR_CLASS}>
                                            <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{formatDate(a.occurredAt)}</td>
                                            <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{nameOf(a.userId)}</td>
                                            <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{a.accidentType}</td>
                                            <td className={TD_CLASS}>
                                                <Badge variant={a.severity >= 2 ? 'danger' : 'warning'}>{SEVERITY_LABEL[a.severity] ?? a.severity}</Badge>
                                            </td>
                                            <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{a.arl}</td>
                                            <td className={`${TD_CLASS} text-slate-500 dark:text-slate-400`}>{a.furatNumber || '—'}</td>
                                            <td className={TD_CLASS}>
                                                <Badge variant={a.investigationCompleted ? 'success' : 'warning'} dot>
                                                    {a.investigationCompleted ? `Investigado (${formatDate(a.investigationDate)})` : 'Pendiente'}
                                                </Badge>
                                            </td>
                                            <TableActions>
                                                {!a.investigationCompleted && (
                                                    <Button size="sm" variant="outline" onClick={() => { setInvestigating(a); setInvForm(emptyInvestigation()); }}>
                                                        Investigar
                                                    </Button>
                                                )}
                                            </TableActions>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Pager pager={accidentPager} />
                        </div>
                    )}
                </Card>
            )}

            <Modal
                isOpen={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                onSubmit={handleSchedule}
                title="Programar Examen Médico"
                icon={<CalendarPlus className="text-blue-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Programar</Button>
                        <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    {associatePicker(scheduleForm.userId, v => setScheduleForm(f => ({ ...f, userId: v })))}
                    <Select label="Tipo de examen *" required value={scheduleForm.examType} onChange={(e) => setScheduleForm(f => ({ ...f, examType: Number(e.target.value) as ExamType }))}>
                        {Object.entries(EXAM_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    <Input type="date" label="Fecha programada *" required value={scheduleForm.scheduledDate} onChange={(e) => setScheduleForm(f => ({ ...f, scheduledDate: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={!!recording}
                onClose={() => setRecording(null)}
                onSubmit={handleRecordExam}
                title="Registrar Resultado de Examen"
                icon={<Stethoscope className="text-blue-500" size={20} />}
                size="md"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRecording(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <Select label="Resultado *" required value={examResult} onChange={(e) => setExamResult(Number(e.target.value) as ExamResult)}>
                        {Object.entries(EXAM_RESULT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    <Input label="URL del soporte" value={examFileUrl} onChange={(e) => setExamFileUrl(e.target.value)} />
                    <Input label="Observaciones" value={examNotes} onChange={(e) => setExamNotes(e.target.value)} />
                </div>
            </Modal>

            <Modal
                isOpen={accidentOpen}
                onClose={() => setAccidentOpen(false)}
                onSubmit={handleReportAccident}
                title="Reportar Accidente de Trabajo"
                icon={<Siren className="text-rose-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Reportar</Button>
                        <Button variant="outline" onClick={() => setAccidentOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        {associatePicker(accidentForm.userId, v => setAccidentForm(f => ({ ...f, userId: v })))}
                    </div>
                    <Input
                        type="datetime-local"
                        label="Fecha y hora *"
                        required
                        max={nowLocal()}
                        value={accidentForm.occurredAt}
                        onChange={(e) => setAccidentForm(f => ({ ...f, occurredAt: e.target.value }))}
                        error={accidentInFuture ? 'No puede ser una fecha futura' : undefined}
                    />
                    <Select label="Gravedad *" required value={accidentForm.severity} onChange={(e) => setAccidentForm(f => ({ ...f, severity: Number(e.target.value) as AccidentSeverity }))}>
                        {Object.entries(SEVERITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    <Input label="Tipo de accidente *" required value={accidentForm.accidentType} onChange={(e) => setAccidentForm(f => ({ ...f, accidentType: e.target.value }))} />
                    <Input label="ARL *" required value={accidentForm.arl} onChange={(e) => setAccidentForm(f => ({ ...f, arl: e.target.value }))} />
                    <Input label="Número FURAT" value={accidentForm.furatNumber || ''} onChange={(e) => setAccidentForm(f => ({ ...f, furatNumber: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <Textarea label="Descripción *" required value={accidentForm.description} onChange={(e) => setAccidentForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={riskOpen}
                onClose={() => setRiskOpen(false)}
                onSubmit={handleCreateRisk}
                title="Agregar Riesgo"
                icon={<ShieldAlert className="text-orange-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Guardar</Button>
                        <Button variant="outline" onClick={() => setRiskOpen(false)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Nivel de riesgo *" required value={riskForm.level} onChange={(e) => setRiskForm(f => ({ ...f, level: Number(e.target.value) }))}>
                        {Object.entries(RISK_LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    <Input label="Factor *" required value={riskForm.factor} onChange={(e) => setRiskForm(f => ({ ...f, factor: e.target.value }))} />
                    <div className="sm:col-span-2">
                        <Textarea label="Descripción *" required value={riskForm.description} onChange={(e) => setRiskForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                    </div>
                    <div className="sm:col-span-2">
                        <Textarea label="Controles" value={riskForm.controls || ''} onChange={(e) => setRiskForm(f => ({ ...f, controls: e.target.value }))} rows={3} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!investigating}
                onClose={() => setInvestigating(null)}
                onSubmit={handleInvestigate}
                title="Investigar Accidente"
                icon={<ClipboardCheck className="text-rose-500" size={20} />}
                size="lg"
                footer={
                    <>
                        <Button type="submit" isLoading={saving}>Guardar Investigación</Button>
                        <Button variant="outline" onClick={() => setInvestigating(null)}>Cancelar</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">La investigación se registra una sola vez y no puede modificarse.</p>
                    <Input type="date" label="Fecha de investigación *" required max={today()} value={invForm.investigationDate} onChange={(e) => setInvForm(f => ({ ...f, investigationDate: e.target.value }))} />
                    <Textarea label="Conclusiones *" required value={invForm.conclusions} onChange={(e) => setInvForm(f => ({ ...f, conclusions: e.target.value }))} rows={2} />
                    <Textarea label="Causas *" required value={invForm.causes} onChange={(e) => setInvForm(f => ({ ...f, causes: e.target.value }))} rows={2} />
                    <Textarea label="Medidas correctivas *" required value={invForm.correctiveMeasures} onChange={(e) => setInvForm(f => ({ ...f, correctiveMeasures: e.target.value }))} rows={2} />
                </div>
            </Modal>
        </PageContainer>
    );
};

