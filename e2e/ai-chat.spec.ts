import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const sse = (events: [string, unknown][]) => events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');

test('AI drawer streams tool chips, a markdown table and sources', async ({ page }) => {
    await mockApi(page, ADMIN, {
        'GET /ai/capabilities': { success: true, data: { allowed: [{ key: 'associates', name: 'Asociados', suggestions: [] }], denied: [] } },
        'GET /ai/usage': { success: true, data: null },
        'POST /ai/chat': (route: { fulfill: (r: object) => Promise<void> }) => route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: sse([
                ['meta', { conversationId: 'c1', messageId: 'm1', modules: ['associates'] }],
                ['tool', { name: 'list', module: 'associates', status: 'started' }],
                ['tool', { name: 'list', module: 'associates', status: 'done', rows: 2 }],
                ['delta', { text: '| Nombre | Estado |\n|---|---|\n| Ana | Activo |\n| Bruno | Retirado |' }],
                ['done', { messageId: 'm1', sources: [{ module: 'associates', label: 'Asociados' }], usage: { in: 1, out: 1 } }],
            ]),
        }),
    });
    await signIn(page);
    await page.goto('/#/associates');
    await page.getByRole('button', { name: 'Preguntar a la IA' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Pregunta para el asistente' }).fill('¿Quiénes son los asociados?');
    await page.keyboard.press('Enter');
    await expect(dialog.getByText('Asociados · 2 registros')).toBeVisible();
    // GFM table rendered as a real table, not pipes.
    await expect(dialog.getByRole('table')).toBeVisible();
    await expect(dialog.getByRole('cell', { name: 'Bruno' })).toBeVisible();
    await expect(dialog.getByText('Fuentes:')).toBeVisible();
});

test('AI drawer survives an unexpected /ai/usage shape and hides the quota hint', async ({ page }) => {
    await mockApi(page, ADMIN, {
        'GET /ai/capabilities': { success: true, data: { allowed: [{ key: 'associates', name: 'Asociados', suggestions: [] }], denied: [] } },
        'GET /ai/usage': { success: true, data: [] },
    });
    await signIn(page);
    await page.goto('/#/associates');
    await page.getByRole('button', { name: 'Preguntar a la IA' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Pregunta para el asistente' })).toBeVisible();
    await expect(dialog.getByText('Cuota de IA')).toHaveCount(0);
});

test('chat shows a confirm card for an AI activities proposal and rejects it', async ({ page }) => {
    const proposal = {
        actionId: 'a1', projectId: 'p1', status: 'PENDING_APPROVAL', requestedByUserId: 'u1', createdAt: '2026-10-30T10:00:00',
        expiresAt: '2026-11-06T10:00:00', expired: false, requirement: 'Portal', truncated: false,
        items: [{ index: 0, type: 'Task', title: 'Crear login', priority: 'Medium', parentIndex: null, assigneeUserId: null, assigneeName: null }],
    };
    let rejected = 0;
    await mockApi(page, ADMIN, {
        'GET /ai/capabilities': { success: true, data: { allowed: [{ key: 'associates', name: 'Asociados', suggestions: [] }, { key: 'activities', name: 'Actividades', suggestions: [] }], denied: [] } },
        'GET /ai/usage': { success: true, data: null },
        'GET /work-items/proposals/a1': { success: true, data: proposal },
        'POST /work-items/proposals/a1/reject': (route: { fulfill: (r: object) => Promise<void> }) => { rejected++; return route.fulfill({ status: 204 }); },
        'POST /ai/chat': (route: { fulfill: (r: object) => Promise<void> }) => route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: sse([
                ['meta', { conversationId: 'c1', messageId: 'm1', modules: ['activities'] }],
                ['tool', { name: 'activities_propose_items', module: 'activities', status: 'done', rows: 1 }],
                ['action', { actionId: 'a1', type: 'WORK_ITEM_PROPOSAL', projectId: 'p1' }],
                ['delta', { text: 'Listo, revisa la propuesta.' }],
                ['done', { messageId: 'm1', sources: [], usage: { in: 1, out: 1 } }],
            ]),
        }),
    });
    await signIn(page);
    await page.goto('/#/associates');
    await page.getByRole('button', { name: 'Preguntar a la IA' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Pregunta para el asistente' }).fill('Propón actividades');
    await page.keyboard.press('Enter');

    const card = dialog.getByRole('group', { name: 'Propuesta de actividades' });
    await expect(card.getByText('Crear login')).toBeVisible();
    await expect(card.getByRole('link', { name: /Abrir en Actividades/ })).toHaveAttribute('href', /#\/activities\/p1$/);
    await card.getByRole('button', { name: 'Rechazar' }).click();
    await expect(card.getByText('Propuesta rechazada.')).toBeVisible();
    expect(rejected).toBe(1);
});
