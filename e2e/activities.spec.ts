import { expect, test } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const USER = { permissions: ['menu.platform', 'menu.platform.activities', 'menu.platform.activities.create'] };
const ok = (data: unknown) => ({ success: true, message: '', data });

const project = { id: 'p1', name: 'Portal', keyPrefix: 'DEV', status: 3 };
const item = {
    id: 'w1', projectId: 'p1', key: 'DEV-1', number: 1, type: 1, status: 1, title: 'Configurar CI',
    assigneeUserId: 'u2', reporterUserId: 'u1', priority: 3, createdAt: '2026-10-30T10:00:00',
};

test('activities list shows the items of a project and creates a new one', async ({ page }) => {
    const created: unknown[] = [];
    await mockApi(page, USER, {
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok([item]),
        'GET /assignments': ok([{ id: 'a1', projectId: 'p1', userId: 'u2', userName: 'Luis Pérez', status: 1 }]),
        'POST /projects/p1/work-items': (route: { request: () => { postDataJSON: () => unknown }; fulfill: (r: object) => Promise<void> }) => {
            created.push(route.request().postDataJSON());
            return route.fulfill({ status: 201, json: { success: true, message: '', data: { ...item, id: 'w2', key: 'DEV-2', number: 2, title: 'Nueva' } } });
        },
    });
    await signIn(page);
    await page.goto('/#/activities');
    await page.getByLabel('Proyecto').selectOption('p1');

    await expect(page.getByRole('cell', { name: 'DEV-1' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Luis Pérez' })).toBeVisible();

    await page.getByRole('button', { name: 'Nueva actividad' }).click();
    await page.getByLabel('Título').fill('Nueva');
    await page.getByRole('button', { name: 'Crear actividad' }).click();

    await expect(page.getByRole('cell', { name: 'DEV-2' })).toBeVisible();
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ title: 'Nueva', type: 1, parentId: null });
});

test('board moves a card with the "Mover a" menu and rolls back when the API refuses', async ({ page }) => {
    const moves: unknown[] = [];
    let refuse = false;
    await mockApi(page, { permissions: [...USER.permissions, 'menu.platform.activities.move'] }, {
        'GET /projects': ok([project]),
        'GET /projects/p1/work-items': ok([item]),
        'POST /work-items/w1/move': (route: { request: () => { postDataJSON: () => { status: number } }; fulfill: (r: object) => Promise<void> }) => {
            const body = route.request().postDataJSON();
            moves.push(body);
            return refuse
                ? route.fulfill({ status: 409, json: { success: false, message: 'Proyecto cerrado' } })
                : route.fulfill({ json: { success: true, message: '', data: { ...item, status: body.status } } });
        },
    });
    await signIn(page);
    await page.goto('/#/activities/p1');
    await page.getByRole('tab', { name: 'Tablero' }).click();

    const todo = page.getByRole('region', { name: /^Por hacer/ });
    await page.getByRole('button', { name: 'Acciones de DEV-1' }).click();
    await page.getByRole('menuitem', { name: 'Mover a Por hacer' }).click();
    await expect(todo.getByText('DEV-1')).toBeVisible();
    expect(moves[0]).toMatchObject({ status: 2 });

    refuse = true;
    await page.getByRole('button', { name: 'Acciones de DEV-1' }).click();
    await page.getByRole('menuitem', { name: 'Mover a Hecho' }).click();
    await expect(page.getByText('No se pudo mover la actividad')).toBeVisible();
    await expect(todo.getByText('DEV-1')).toBeVisible();
});
