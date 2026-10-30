import { expect, test, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const USER = { permissions: ['menu.platform', 'menu.platform.activities', 'menu.platform.activities.edit', 'menu.platform.activities.move'] };
const org = (dependenciesEnabled: boolean) =>
    ok({ id: 'o1', name: 'Cooperativa Demo', activitiesSettings: { showOnProjectDetail: true, showMyWorkOnDashboard: true, sprintsEnabled: false, timeTrackingEnabled: false, dependenciesEnabled } });

const project = { id: 'p1', name: 'Portal', keyPrefix: 'DEV', status: 3 };
const base = { projectId: 'p1', type: 1, reporterUserId: 'u1', priority: 2, createdAt: '2026-10-30T10:00:00' };
const blocker = { ...base, id: 'w1', key: 'DEV-1', number: 1, status: 3, title: 'API de pagos', blockedByOpenCount: 0 };
const blocked = { ...base, id: 'w3', key: 'DEV-3', number: 3, status: 2, title: 'Pantalla de pagos', blockedByOpenCount: 0 };

test('dependencies stay hidden when the organization has them off', async ({ page }) => {
    await mockApi(page, USER, {
        'GET /organizations/me': org(false),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok([blocker, { ...blocked, blockedByOpenCount: 1 }]),
    });
    await signIn(page);
    await page.goto('/#/activities/p1?item=w3');

    await expect(page.getByRole('dialog')).toContainText('DEV-3');
    await expect(page.getByRole('tab', { name: 'Comentarios' })).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Dependencias')).toHaveCount(0);
    await expect(page.getByText('Bloqueada', { exact: true })).toHaveCount(0);
});

test('adds a "blocked by" dependency, shows it and the "Bloqueada" badge', async ({ page }) => {
    const sent: unknown[] = [];
    let linked = false;
    await mockApi(page, USER, {
        'GET /organizations/me': org(true),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': (route: Route) => route.fulfill({ json: ok([blocker, { ...blocked, blockedByOpenCount: linked ? 1 : 0 }]) }),
        'GET /work-items/w3/links': ok({ blocks: [], blockedBy: [] }),
        'POST /work-items/w3/links': (route: Route) => {
            sent.push(route.request().postDataJSON());
            linked = true;
            return route.fulfill({
                status: 201,
                json: ok({ blocks: [], blockedBy: [{ linkId: 'l1', itemId: 'w1', key: 'DEV-1', title: 'API de pagos', status: 3 }] }),
            });
        },
    });
    await signIn(page);
    await page.goto('/#/activities/p1?item=w3');

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Dependencias' })).toBeVisible();
    await expect(dialog).toContainText('Sin dependencias');
    await dialog.getByLabel('Relación').selectOption('blockedBy');
    await dialog.getByLabel('Actividad', { exact: true }).selectOption('w1');
    await dialog.getByRole('button', { name: 'Agregar dependencia' }).click();

    await expect(page.getByText('Dependencia agregada')).toBeVisible();
    expect(sent).toEqual([{ blockerItemId: 'w1' }]);
    await expect(dialog.getByRole('button', { name: 'DEV-1 API de pagos' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Quitar dependencia con DEV-1' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('row', { name: /DEV-3/ }).getByText('Bloqueada', { exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /DEV-1/ }).getByText('Bloqueada', { exact: true })).toHaveCount(0);
});

test('moving a blocked card warns about its open dependencies and still moves it', async ({ page }) => {
    const moves: unknown[] = [];
    await mockApi(page, USER, {
        'GET /organizations/me': org(true),
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok([blocker, { ...blocked, blockedByOpenCount: 2 }]),
        'POST /work-items/w3/move': (route: Route) => {
            const body = route.request().postDataJSON();
            moves.push(body);
            return route.fulfill({ json: ok({ ...blocked, status: body.status, blockedByOpenCount: 2 }) });
        },
    });
    await signIn(page);
    await page.goto('/#/activities/p1');
    await page.getByRole('tab', { name: 'Tablero' }).click();

    await expect(page.getByRole('region', { name: /^Por hacer/ }).getByText('Bloqueada', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Acciones de DEV-3' }).click();
    await page.getByRole('menuitem', { name: 'Mover a En progreso' }).click();

    await expect(page.getByText('DEV-3 tiene 2 dependencias abiertas')).toBeVisible();
    await expect(page.getByRole('region', { name: /^En progreso/ }).getByText('DEV-3')).toBeVisible();
    expect(moves).toEqual([expect.objectContaining({ status: 3 })]);
});
