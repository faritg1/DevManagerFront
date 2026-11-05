import { expect, test, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const BASE = ['menu.platform', 'menu.platform.activities'];

const entry = (id: string, userId: string, userName: string, projectId: string, projectName: string, key: string, hours: number, note: string | null) => ({
    id, workDate: '2026-11-03T00:00:00', hours, note, userId, userName, projectId, projectName, workItemId: `w-${id}`, workItemKey: key, workItemTitle: `Tarea ${key}`,
});
const report = ok({
    from: '2026-11-01T00:00:00', to: '2026-11-05T00:00:00', totalHours: 6.5,
    entries: [
        entry('t1', 'u1', 'Ana López', 'p1', 'Portal', 'DEV-1', 2, 'Análisis'),
        entry('t2', 'u2', 'Beto Ruiz', 'p1', 'Portal', 'DEV-2', 3, null),
        entry('t3', 'u1', 'Ana López', 'p2', 'Operaciones', 'OPS-4', 1.5, null),
    ],
    byUser: [{ id: 'u1', name: 'Ana López', hours: 3.5 }, { id: 'u2', name: 'Beto Ruiz', hours: 3 }],
    byProject: [{ id: 'p2', name: 'Operaciones', hours: 1.5 }, { id: 'p1', name: 'Portal', hours: 5 }],
});

test('hours report lists the entries with totals by person and project, and exports the CSV', async ({ page }) => {
    const queries: URLSearchParams[] = [];
    await mockApi(page, { permissions: [...BASE, 'menu.platform.activities.reports'] }, {
        'GET /work-items/time-report': (route: Route, url: URL) => { queries.push(url.searchParams); return route.fulfill({ json: report }); },
        'GET /work-items/time-report/export': (route: Route) =>
            route.fulfill({ body: '﻿Fecha,Persona\r\n', headers: { 'content-type': 'text/csv' } }),
    });
    await signIn(page);
    await page.goto('/#/activities/time-report');

    await expect(page.getByRole('heading', { name: 'Reporte de horas' })).toBeVisible();
    const rows = page.getByRole('table', { name: 'Registros de horas' }).locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText('Ana López');
    await expect(rows.first()).toContainText('DEV-1');
    await expect(rows.first()).toContainText('Análisis');
    await expect(page.getByTestId('time-report-total')).toHaveText('6,5 h');
    await expect(page.getByRole('table', { name: 'Por persona' }).getByRole('row', { name: 'Beto Ruiz 3' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Por proyecto' }).getByRole('row', { name: 'Portal 5' })).toBeVisible();
    expect(queries[0].get('from')).toMatch(/^\d{4}-\d{2}-01$/);

    // The person filter narrows the report through the API
    await page.getByRole('combobox', { name: 'Persona' }).selectOption({ label: 'Beto Ruiz' });
    await expect.poll(() => queries.at(-1)?.get('userId')).toBe('u2');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    expect((await download).suggestedFilename()).toMatch(/^reporte-horas-.*\.csv$/);
});

test('without the reports permission the person filter and totals are hidden', async ({ page }) => {
    await mockApi(page, { permissions: BASE }, { 'GET /work-items/time-report': report });
    await signIn(page);
    await page.goto('/#/activities/time-report');

    await expect(page.getByRole('table', { name: 'Por proyecto' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Persona' })).toHaveCount(0);
    await expect(page.getByRole('table', { name: 'Por persona' })).toHaveCount(0);
});
