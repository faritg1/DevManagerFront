import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

test('login lands on the dashboard', async ({ page }) => {
    await mockApi(page);
    await page.goto('/#/');
    await page.getByLabel('Email Corporativo').fill('ana@coop.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/#\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
});

const ASSOCIATE = { permissions: ['menu.platform', 'menu.platform.dashboard', 'menu.solidarity', 'menu.solidarity.associates'] };

test('sidebar shows only the items the user holds', async ({ page }) => {
    await mockApi(page, ASSOCIATE);
    await signIn(page);
    await page.goto('/#/dashboard');
    const menu = page.getByRole('navigation', { name: 'Menú principal' }).first();
    await expect(menu.getByRole('link', { name: 'Asociados' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    for (const hidden of ['Nómina', 'SST', 'Proyectos', 'Usuarios', 'Plataforma']) {
        await expect(menu.getByRole('link', { name: hidden })).toHaveCount(0);
    }
});

test('a route without permission is not shown', async ({ page }) => {
    await mockApi(page, ASSOCIATE);
    await signIn(page);
    await page.goto('/#/nomina');
    // PermissionGuard denies the screen and sends the user to the first screen they may open.
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Nómina' })).toHaveCount(0);
});

test('command palette opens with Ctrl+K and navigates', async ({ page }) => {
    await mockApi(page, ASSOCIATE);
    await signIn(page);
    await page.goto('/#/dashboard');
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Ir a…' });
    await expect(dialog).toBeVisible();
    const box = dialog.getByRole('combobox');
    await expect(box).toBeFocused();
    // Only permitted screens are offered.
    await box.fill('nomina');
    await expect(dialog.getByText('Sin resultados')).toBeVisible();
    await box.fill('asoc');
    await expect(dialog.getByRole('option').first()).toHaveText(/Asociados/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/associates$/);
    await expect(dialog).toBeHidden();
});

test('export downloads the filtered rows as an Excel CSV', async ({ page }) => {
    const associates = [
        { userId: 'a1', fullName: 'Ana López', documentType: 1, documentNumber: '123', status: 2, role: 1, currentAdmissionDate: '2026-01-15' },
        { userId: 'a2', fullName: 'Bruno "Beto" Díaz', documentType: 1, documentNumber: '=SUM(1)', status: 2, role: 1, currentAdmissionDate: null },
        { userId: 'a3', fullName: 'Carla Ruiz', documentType: 1, documentNumber: '789', status: 2, role: 1, currentAdmissionDate: null },
    ];
    await mockApi(page, ADMIN, { 'GET /associates': { success: true, data: associates } });
    await signIn(page);
    await page.goto('/#/associates');
    await page.getByRole('searchbox', { name: 'Buscar por nombre o documento' }).fill('b');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()]);
    expect(download.suggestedFilename()).toMatch(/^asociados-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = (await (await download.createReadStream()).toArray()).join('');
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Nombre;Tipo de documento;Documento;Estado;Rol;Ingreso vigente');
    // "b" matches Bruno only (search is on name/document); quotes escaped, formula neutralized.
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Bruno ""Beto"" Díaz"');
    expect(lines[1]).toContain(";'=SUM(1);");
});

test('impersonation banner shows for an impersonated session', async ({ page }) => {
    await mockApi(page);
    await signIn(page, {
        impersonator_token: 'super-token',
        impersonator_user: JSON.stringify({ id: 's1', name: 'Super', email: 's@p.co', role: 'Admin' }),
        impersonation: JSON.stringify({ targetName: 'Ana López', organizationName: 'Cooperativa Demo', expiresAt: new Date(Date.now() + 3600_000).toISOString() }),
    });
    await page.goto('/#/dashboard');
    await expect(page.getByText(/Estás actuando como/)).toContainText('Ana López');
    await expect(page.getByRole('button', { name: 'Salir de la suplantación' })).toBeVisible();
});
