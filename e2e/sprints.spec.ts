import { expect, test, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const USER = { permissions: ['menu.platform', 'menu.platform.activities', 'menu.platform.activities.create', 'menu.platform.activities.edit'] };
const org = (sprintsEnabled: boolean) =>
    ok({ id: 'o1', name: 'Cooperativa Demo', activitiesSettings: { showOnProjectDetail: true, showMyWorkOnDashboard: true, sprintsEnabled } });

const project = { id: 'p1', name: 'Portal', keyPrefix: 'DEV', status: 3 };
const base = { projectId: 'p1', type: 1, status: 1, reporterUserId: 'u1', priority: 2, createdAt: '2026-10-30T10:00:00' };
const items = [
    { ...base, id: 'w1', key: 'DEV-1', number: 1, title: 'En sprint', sprintId: 's1', estimateHours: 4 },
    { ...base, id: 'w2', key: 'DEV-2', number: 2, title: 'Suelta', sprintId: null },
];
const sprint = {
    id: 's1', projectId: 'p1', name: 'Sprint 1', goal: null, startDate: '2026-11-02T00:00:00', endDate: '2026-11-13T00:00:00', status: 2,
    total: 1, done: 0, cancelled: 0, progressPercent: 0, estimateHours: 4, doneEstimateHours: 0,
};

test('sprints stay hidden when the organization has them off', async ({ page }) => {
    await mockApi(page, USER, {
        'GET /organizations/me': org(false),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok(items),
    });
    await signIn(page);
    await page.goto('/#/activities/p1');

    await expect(page.getByRole('cell', { name: 'DEV-2', exact: true })).toBeVisible();
    await expect(page.getByLabel('Sprint', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Nuevo sprint' })).toHaveCount(0);
});

test('filters the backlog by sprint and creates a sprint', async ({ page }) => {
    const created: unknown[] = [];
    await mockApi(page, USER, {
        'GET /organizations/me': org(true),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok(items),
        'GET /projects/p1/sprints': ok([sprint]),
        'POST /projects/p1/sprints': (route: Route) => {
            const body = route.request().postDataJSON();
            created.push(body);
            return route.fulfill({ status: 201, json: ok({ ...sprint, ...body, id: 's2', status: 1, total: 0, progressPercent: null, estimateHours: 0 }) });
        },
    });
    await signIn(page);
    await page.goto('/#/activities/p1');

    const filter = page.getByLabel('Sprint', { exact: true });
    await filter.selectOption({ label: 'Sin sprint' });
    await expect(page.getByRole('cell', { name: 'DEV-2', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DEV-1', exact: true })).toHaveCount(0);

    await filter.selectOption('s1');
    await expect(page.getByRole('cell', { name: 'DEV-1', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DEV-2', exact: true })).toHaveCount(0);
    const bar = page.getByRole('region', { name: 'Sprint seleccionado' });
    await expect(bar).toContainText('0 de 1 hechas');
    await expect(bar.getByRole('button', { name: 'Cerrar sprint' })).toBeVisible();

    await page.getByRole('button', { name: 'Nuevo sprint' }).click();
    await page.getByLabel('Nombre').fill('Sprint 2');
    await page.getByLabel('Inicio').fill('2026-11-16');
    await page.getByLabel('Fin').fill('2026-11-27');
    await page.getByRole('button', { name: 'Crear sprint' }).click();

    await expect(page.getByText('Sprint creado')).toBeVisible();
    expect(created).toEqual([{ name: 'Sprint 2', goal: null, startDate: '2026-11-16', endDate: '2026-11-27' }]);
    await expect(filter.locator('option', { hasText: 'Sprint 2' })).toHaveCount(1);
});
