import { expect, test, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const BASE = ['menu.platform', 'menu.platform.activities', 'menu.platform.activities.create'];
const org = (settings?: { showOnProjectDetail: boolean; showMyWorkOnDashboard: boolean }) => ok({
    id: 'o1', name: 'Cooperativa Demo', legalName: null, nit: null, entityType: null, isActive: true, createdAt: '2026-01-01T00:00:00',
    workItemDueSoonDays: 2, workItemOverdueNotice: true, activitiesSettings: settings,
    stats: { users: 1, activeUsers: 1, employees: 0, projects: 1, activeProjects: 1, governingBodies: 0, educationPrograms: 0, associatesByStatus: { applicant: 0, active: 0, suspended: 0, withdrawn: 0 } },
});
const OFF = { showOnProjectDetail: false, showMyWorkOnDashboard: false };

const project = { id: 'p1', code: null, keyPrefix: 'DEV', name: 'Portal', description: null, startDate: null, endDate: null, complexityLevel: 2, status: 3, createdAt: '2026-10-01T00:00:00' };
const summary = ok({ total: 4, done: 1, cancelled: 0, progressPercent: 25, estimateHours: 0, doneEstimateHours: 0, byStatus: { '1': 2, '3': 1, '5': 1 }, overdue: 1, dueSoon: 2 });
const mine = ok([
    { id: 'w1', projectId: 'p1', key: 'DEV-1', number: 1, type: 1, status: 3, title: 'Configurar CI', reporterUserId: 'u1', assigneeUserId: 'u1', priority: 3, dueDate: '2026-10-01T00:00:00', createdAt: '2026-09-01T00:00:00', projectName: 'Portal', projectKeyPrefix: 'DEV', dueState: 'Overdue' },
    { id: 'w2', projectId: 'p2', key: 'OPS-4', number: 4, type: 3, status: 2, title: 'Corregir backup', reporterUserId: 'u1', assigneeUserId: 'u1', priority: 2, dueDate: null, createdAt: '2026-09-01T00:00:00', projectName: 'Operaciones', projectKeyPrefix: 'OPS', dueState: null },
]);

test('project detail shows the activities section with counts and a board link', async ({ page }) => {
    await mockApi(page, { permissions: [...BASE, 'menu.platform.projects'] }, {
        'GET /Config': ok(null),
        'GET /projects/p1': ok(project),
        'GET /projects/p1/work-items/summary': summary,
    });
    await signIn(page);
    await page.goto('/#/projects/p1');

    const section = page.getByRole('region', { name: 'Actividades' });
    await expect(section.getByRole('progressbar', { name: 'Avance del proyecto' })).toHaveAttribute('aria-valuenow', '25');
    await expect(section.getByText('Backlog: 2')).toBeVisible();
    await expect(section.getByText('En progreso: 1')).toBeVisible();
    await expect(section.getByText('Por hacer:')).toHaveCount(0);
    await expect(section.getByText('Vencidas: 1')).toBeVisible();
    await expect(section.getByText('Por vencer: 2')).toBeVisible();
    await section.getByRole('link', { name: 'Ver tablero' }).click();
    await expect(page).toHaveURL(/#\/activities\/p1$/);
});

test('project detail hides the activities section when the organization turns it off', async ({ page }) => {
    await mockApi(page, { permissions: [...BASE, 'menu.platform.projects'] }, {
        'GET /organizations/me': org(OFF),
        'GET /Config': ok(null),
        'GET /projects/p1': ok(project),
        'GET /projects/p1/work-items/summary': summary,
    });
    await signIn(page);
    // Both answers are in before asserting, so an absent section is the setting and not a pending request.
    const loaded = Promise.all([
        page.waitForResponse((r) => r.url().endsWith('/work-items/summary')),
        page.waitForResponse((r) => r.url().endsWith('/organizations/me')),
    ]);
    await page.goto('/#/projects/p1');
    await loaded;
    await expect(page.getByRole('heading', { name: 'Portal' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Actividades' })).toHaveCount(0);
});

test('"Mis actividades" lists my items, flags overdue ones and links to the item', async ({ page }) => {
    await mockApi(page, { permissions: BASE }, { 'GET /work-items/mine': mine });
    await signIn(page);
    await page.goto('/#/my-activities');

    const overdue = page.getByRole('row', { name: /DEV-1/ });
    await expect(overdue.getByText('Vencida')).toBeVisible();
    await expect(page.getByRole('row', { name: /OPS-4/ })).toBeVisible();

    await page.getByLabel('Proyecto').selectOption('p2');
    await expect(page.getByRole('row', { name: /DEV-1/ })).toHaveCount(0);
    await page.getByLabel('Proyecto').selectOption('');

    await page.getByRole('link', { name: 'Configurar CI' }).click();
    await expect(page).toHaveURL(/#\/activities\/p1\?item=w1$/);
});

test('"Mis actividades" shows an empty state when nothing is assigned', async ({ page }) => {
    await mockApi(page, { permissions: BASE }, { 'GET /work-items/mine': ok([]) });
    await signIn(page);
    await page.goto('/#/my-activities');
    await expect(page.getByText('No tienes actividades abiertas asignadas')).toBeVisible();
});

test('dashboard shows the "Mis actividades" widget unless the organization turns it off', async ({ page }) => {
    let settings: typeof OFF | undefined;
    await mockApi(page, { permissions: [...BASE, 'menu.platform.dashboard'] }, {
        'GET /organizations/me': (route: Route) => route.fulfill({ json: org(settings) }),
        'GET /work-items/mine': mine,
    });
    await signIn(page);
    await page.goto('/#/dashboard');

    const widget = page.getByRole('region', { name: 'Mis actividades' });
    await expect(widget.getByText('Configurar CI')).toBeVisible();
    await expect(widget.getByText('Vencida')).toBeVisible();
    await widget.getByRole('link', { name: 'Ver todas' }).click();
    await expect(page).toHaveURL(/#\/my-activities$/);

    settings = OFF;
    await page.goto('/#/dashboard');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Mis actividades' })).toHaveCount(0);
});

test('organization settings send the activities module toggles', async ({ page }) => {
    const sent: { activitiesSettings?: unknown }[] = [];
    await mockApi(page, ADMIN, {
        'GET /organizations/me': org({ showOnProjectDetail: true, showMyWorkOnDashboard: true }),
        'PUT /organizations/me': (route: Route) => {
            const body = route.request().postDataJSON();
            sent.push(body);
            return route.fulfill({ json: org(body.activitiesSettings) });
        },
    });
    await signIn(page);
    await page.goto('/#/organizations');
    await page.getByRole('button', { name: 'Editar organización' }).click();
    await page.getByLabel('Mostrar «Mis actividades» en el dashboard').uncheck();
    await expect(page.getByLabel('Mostrar actividades en el detalle del proyecto')).toBeChecked();
    await expect(page.getByLabel('Habilitar sprints')).not.toBeChecked();
    await page.getByLabel('Habilitar sprints').check();
    await expect(page.getByLabel('Habilitar registro de horas')).not.toBeChecked();
    await page.getByLabel('Habilitar registro de horas').check();
    await expect(page.getByLabel('Habilitar dependencias entre actividades')).not.toBeChecked();
    await page.getByLabel('Habilitar dependencias entre actividades').check();
    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Organización actualizada')).toBeVisible();
    expect(sent[0].activitiesSettings).toEqual({
        showOnProjectDetail: true, showMyWorkOnDashboard: false, sprintsEnabled: true, timeTrackingEnabled: true, dependenciesEnabled: true,
    });
});
