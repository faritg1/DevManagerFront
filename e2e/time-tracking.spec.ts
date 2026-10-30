import { expect, test, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const USER = { permissions: ['menu.platform', 'menu.platform.activities', 'menu.platform.activities.comment'] };
const org = (timeTrackingEnabled: boolean) =>
    ok({ id: 'o1', name: 'Cooperativa Demo', activitiesSettings: { showOnProjectDetail: true, showMyWorkOnDashboard: true, sprintsEnabled: false, timeTrackingEnabled } });

const project = { id: 'p1', name: 'Portal', keyPrefix: 'DEV', status: 3 };
const item = {
    id: 'w1', projectId: 'p1', key: 'DEV-1', number: 1, type: 1, status: 2, title: 'Pagos', reporterUserId: 'u1', priority: 2,
    estimateHours: 8, spentHours: 7, createdAt: '2026-10-30T10:00:00',
};
const entry = { id: 't1', workItemId: 'w1', userId: 'u2', userName: 'Luis Pérez', workDate: '2026-10-29T00:00:00', hours: 7, note: 'Diseño', createdAt: '2026-10-29T18:00:00' };

test('hours stay hidden when the organization has time tracking off', async ({ page }) => {
    await mockApi(page, USER, {
        'GET /organizations/me': org(false),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok([item]),
    });
    await signIn(page);
    await page.goto('/#/activities/p1?item=w1');

    await expect(page.getByRole('dialog')).toContainText('DEV-1');
    await expect(page.getByRole('tab', { name: 'Comentarios' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Horas' })).toHaveCount(0);
    await expect(page.getByRole('dialog').getByText('Dedicado')).toHaveCount(0);
});

test('logs time on an item and updates the hours spent', async ({ page }) => {
    const sent: unknown[] = [];
    await mockApi(page, USER, {
        'GET /organizations/me': org(true),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok([item]),
        'GET /work-items/w1/time-entries': ok([entry]),
        'POST /work-items/w1/time-entries': (route: Route) => {
            const body = route.request().postDataJSON();
            sent.push(body);
            return route.fulfill({ status: 201, json: ok({ ...body, id: 't2', workItemId: 'w1', userId: 'u1', userName: 'Ana López', createdAt: '2026-10-30T12:00:00' }) });
        },
    });
    await signIn(page);
    await page.goto('/#/activities/p1?item=w1');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('7 h de 8 h');
    await page.getByRole('tab', { name: 'Horas' }).click();
    await expect(dialog).toContainText('Luis Pérez');
    await expect(dialog.getByRole('button', { name: 'Eliminar' })).toHaveCount(0); // not mine

    const today = new Date().toLocaleDateString('en-CA');
    await expect(page.getByLabel('Fecha')).toHaveValue(today);
    await page.getByLabel('Horas', { exact: true }).fill('2.5');
    await page.getByLabel('Nota').fill('Pruebas');
    await page.getByRole('button', { name: 'Registrar horas' }).click();

    await expect(page.getByText('Horas registradas')).toBeVisible();
    expect(sent).toEqual([{ workDate: today, hours: 2.5, note: 'Pruebas' }]);
    await expect(dialog).toContainText('Pruebas');
    await expect(dialog).toContainText('9.5 h de 8 h');
    await expect(dialog.getByRole('button', { name: 'Eliminar' })).toHaveCount(1);
});
