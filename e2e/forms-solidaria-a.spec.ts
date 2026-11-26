import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const USERS = [{ id: 'u2', firstName: 'Luis', lastName: 'Pérez', email: 'luis@coop.co', isActive: true }];
const ASSOCIATES = [{ userId: 'u2', fullName: 'Luis Pérez', status: 2, role: 1 }];

interface FormCase {
    module: string;
    path: string;
    /** Button of the page that opens the panel. */
    opens: string;
    /** Title of the panel. */
    title: string;
    /** Primary button of the panel. */
    submit: string;
    /** "METHOD /path" the form saves to. */
    saves: string;
    /** What the page needs loaded before the form can be filled. */
    mocks?: Record<string, unknown>;
    /** `data` of the successful answer, when the page reads it. */
    saved?: unknown;
    fill: (panel: Locator) => Promise<void>;
    /** The request body the filled form must send. */
    body: Record<string, unknown>;
    /** A field of that body, the label of its control and the message the API answers for it. */
    error: { field: string; label: string; message: string };
}

const CASES: FormCase[] = [
    {
        module: 'associates', path: '/#/associates', opens: 'Nuevo asociado', title: 'Nuevo asociado', submit: 'Crear', saves: 'POST /associates',
        mocks: { 'GET /users': ok(USERS) },
        fill: async (panel) => {
            await panel.getByLabel('Usuario existente').selectOption('u2');
            await panel.getByLabel('Fecha de solicitud').fill('2026-11-01');
        },
        body: { userId: 'u2', applicationDate: '2026-11-01' },
        error: { field: 'applicationDate', label: 'Fecha de solicitud', message: 'La fecha de solicitud no puede ser futura' },
    },
    {
        module: 'associates (data policies)', path: '/#/data-policies', opens: 'Publicar nueva versión', title: 'Publicar política', submit: 'Publicar', saves: 'POST /data-policies',
        fill: async (panel) => {
            await panel.getByLabel('Versión').fill(' 2.0 ');
            await panel.getByLabel('Finalidad').fill('Tratamiento de datos');
            await panel.getByLabel('Texto').fill('Texto de la política');
        },
        body: { version: '2.0', purpose: 'Tratamiento de datos', text: 'Texto de la política' },
        error: { field: 'version', label: 'Versión', message: 'Ya existe una política con esa versión' },
    },
    {
        module: 'bienestar', path: '/#/bienestar', opens: 'Nuevo Programa', title: 'Nuevo Programa de Bienestar', submit: 'Guardar', saves: 'POST /bienestar/programas',
        fill: async (panel) => {
            await panel.getByLabel('Nombre').fill(' Fondo funerario ');
            await panel.getByLabel('Presupuesto').fill('1000');
            await panel.getByLabel('Fecha inicio').fill('2026-12-01');
        },
        body: { name: 'Fondo funerario', budget: 1000, startDate: '2026-12-01' },
        error: { field: 'budget', label: 'Presupuesto', message: 'El presupuesto supera el saldo del fondo' },
    },
    {
        module: 'competencias', path: '/#/competencias', opens: 'Registrar Competencia', title: 'Registrar Competencia', submit: 'Guardar', saves: 'POST /gestion-humana/competencias',
        mocks: { 'GET /associates': ok(ASSOCIATES) },
        fill: async (panel) => {
            await panel.getByLabel('Asociado').selectOption('u2');
            await panel.getByLabel('Competencia').fill(' Contabilidad ');
        },
        body: { userId: 'u2', name: 'Contabilidad', level: 1 },
        error: { field: 'name', label: 'Competencia', message: 'El asociado ya tiene esa competencia' },
    },
    {
        module: 'education', path: '/#/education', opens: 'Nuevo programa', title: 'Nuevo programa', submit: 'Guardar', saves: 'POST /education/programs',
        fill: async (panel) => {
            await panel.getByLabel('Nombre').fill(' Curso básico ');
            await panel.getByLabel('Horas requeridas').fill('20');
        },
        body: { name: 'Curso básico', type: 1, requiredHours: 20 },
        error: { field: 'requiredHours', label: 'Horas requeridas', message: 'Debe estar entre 0,5 y 1000' },
    },
    {
        module: 'excedentes', path: '/#/excedentes', opens: 'Calcular Distribución', title: 'Calcular Distribución de Excedentes', submit: 'Calcular', saves: 'POST /excedentes/calcular',
        fill: async (panel) => {
            await panel.getByLabel('Período').fill('2025-12-31');
            await panel.getByLabel('Total excedentes').fill('5000');
        },
        body: { period: '2025-12-31', totalSurplus: 5000 },
        error: { field: 'period', label: 'Período', message: 'Ya existe una distribución para ese período' },
    },
    {
        module: 'habeas-data', path: '/#/habeas-data', opens: 'Crear Solicitud ARCO', title: 'Crear Solicitud ARCO', submit: 'Guardar', saves: 'POST /habeas-data/arco',
        saved: { filingNumber: 'ARCO-0001' },
        fill: async (panel) => {
            await panel.getByLabel('Tipo').selectOption('2');
            await panel.getByLabel('Descripción').fill(' Corregir mi dirección ');
        },
        body: { type: 2, description: 'Corregir mi dirección' },
        error: { field: 'description', label: 'Descripción', message: 'Debe tener máximo 500 caracteres' },
    },
    {
        module: 'nomina', path: '/#/nomina', opens: 'Nueva Compensación', title: 'Nueva Compensación', submit: 'Guardar', saves: 'POST /nomina/compensacion',
        mocks: { 'GET /associates': ok(ASSOCIATES) },
        fill: async (panel) => {
            await panel.getByLabel('Asociado').selectOption('u2');
            await panel.getByLabel('Período').fill('2026-10-01');
            await panel.getByLabel('Días trabajados').fill('10');
            await panel.getByLabel('Tarifa diaria').fill('50000');
        },
        body: { userId: 'u2', period: '2026-10-01', model: 1, baseValue: 10, dailyRate: 50000 },
        error: { field: 'dailyRate', label: 'Tarifa diaria', message: 'La tarifa diaria debe ser mayor que cero' },
    },
];

const open = async (page: Page, form: FormCase, save: (route: Route) => unknown) => {
    await mockApi(page, ADMIN, { ...form.mocks, [form.saves]: save });
    await signIn(page);
    await page.goto(form.path);
    await page.getByRole('button', { name: form.opens, exact: true }).click();
    const panel = page.getByRole('dialog', { name: form.title });
    await expect(panel).toBeVisible();
    return panel;
};

for (const form of CASES) {
    test.describe(form.module, () => {
        test(`"${form.title}" saves and sends the body of the form`, async ({ page }) => {
            const bodies: unknown[] = [];
            const panel = await open(page, form, (route) => {
                bodies.push(route.request().postDataJSON());
                return route.fulfill({ json: ok(form.saved ?? {}) });
            });
            await form.fill(panel);
            await panel.getByRole('button', { name: form.submit, exact: true }).click();

            await expect(panel).toHaveCount(0);
            expect(bodies).toEqual([form.body]);
        });

        test(`"${form.title}" shows an API error under its field`, async ({ page }) => {
            const { field, label, message } = form.error;
            const panel = await open(page, form, (route) => route.fulfill({
                status: 400,
                json: { success: false, message: 'Revisa los campos marcados', errorCode: 'VALIDATION_ERROR', errors: { [field]: [message] } },
            }));
            await form.fill(panel);
            await panel.getByRole('button', { name: form.submit, exact: true }).click();

            const control = panel.getByLabel(label);
            await expect(control).toHaveAccessibleDescription(message);
            await expect(control).toHaveAttribute('aria-invalid', 'true');
            await expect(control).toBeFocused();
            // The message left the alert: it shows once, under its field.
            await expect(panel.getByRole('alert').getByRole('listitem')).toHaveCount(0);
            await expect(panel.getByText(message)).toHaveCount(1);
            await expect(panel).toBeVisible();
        });
    });
}

test('a required field with only spaces shows its message and sends nothing (data policies)', async ({ page }) => {
    const form = CASES[1];
    const bodies: unknown[] = [];
    const panel = await open(page, form, (route) => {
        bodies.push(route.request().postDataJSON());
        return route.fulfill({ json: ok({}) });
    });
    await form.fill(panel);
    await panel.getByLabel('Finalidad').fill('   ');
    await panel.getByRole('button', { name: 'Publicar', exact: true }).click();

    await expect(panel.getByLabel('Finalidad')).toHaveAccessibleDescription('Este campo es obligatorio');
    await expect(panel.getByLabel('Finalidad')).toBeFocused();
    await expect(panel).toBeVisible();
    expect(bodies).toHaveLength(0);

    await panel.getByLabel('Finalidad').fill('Tratamiento de datos');
    await panel.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(panel).toHaveCount(0);
    expect(bodies).toEqual([form.body]);
});
