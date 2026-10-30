import { expect, test } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const AUDITOR = { permissions: ['menu.admin', 'menu.admin.audit'] };

const entry = {
    id: 'c1', createdAt: '2026-10-29T15:30:00', organizationId: 'o1',
    actorUserId: 'u1', actorName: 'Ana López', impersonatorUserId: 'sa1', impersonatorName: 'Root Admin',
    entityType: 'Associate', entityTypeName: 'Asociado', entityId: '3f2b9c1e-0000-4000-8000-000000000001', action: 'Updated',
    changes: [{ field: 'Status', old: 'Activo', new: 'Retirado' }],
};

test('audit page lists a change and expands its diff', async ({ page }) => {
    const queries: URLSearchParams[] = [];
    await mockApi(page, AUDITOR, {
        'GET /audit/changes': (route: { fulfill: (r: object) => Promise<void> }, url: URL) => {
            queries.push(url.searchParams);
            return route.fulfill({ json: { success: true, data: { items: [entry], total: 1, page: 1, pageSize: 20 } } });
        },
    });
    await signIn(page);
    await page.goto('/#/audit');
    await expect(page.getByRole('heading', { name: 'Auditoría' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Asociado' })).toBeVisible();
    await expect(page.getByText('vía suplantación por Root Admin')).toBeVisible();
    await expect(page.getByText('Actualizado')).toBeVisible();

    await page.getByRole('button', { name: 'Ver 1 campo' }).click();
    await expect(page.getByText('Activo')).toBeVisible();
    await expect(page.getByText('Retirado')).toBeVisible();

    // Date-only filters become Colombian day boundaries in UTC (to is exclusive).
    await page.getByLabel('Desde').fill('2026-10-01');
    await page.getByLabel('Hasta').fill('2026-10-29');
    await expect.poll(() => queries.at(-1)?.get('to')).toBe('2026-10-30T05:00:00.000Z');
    expect(queries.at(-1)?.get('from')).toBe('2026-10-01T05:00:00.000Z');
});
