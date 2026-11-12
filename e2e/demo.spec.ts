import { spawn, type ChildProcess } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

// VITE_DEMO_MODE is read when Vite starts, so the flag-on tests use their own dev server;
// the flag-off test uses the shared one from playwright.config.ts.
const DEMO_PORT = 4174;
const DEMO = `http://localhost:${DEMO_PORT}`;
let server: ChildProcess | undefined;

const isUp = () => fetch(DEMO).then((r) => r.ok, () => false);

// One worker for the whole file: a single demo server on a fixed port.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
    test.setTimeout(120_000);
    if (await isUp()) return;
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(DEMO_PORT), '--strictPort'], {
        env: { ...process.env, VITE_DEMO_MODE: 'true', VITE_API_URL: 'http://api.mock/api' },
        stdio: 'ignore',
    });
    await expect.poll(isUp, { timeout: 100_000 }).toBe(true);
});

test.afterAll(() => { server?.kill(); });

test('entry page lists the three organizations and the four personas', async ({ page }) => {
    await mockApi(page);
    await page.goto(`${DEMO}/#/demo`);
    await expect(page.getByRole('heading', { name: 'Modo demo' })).toBeVisible();
    await expect(page.getByLabel('Entidad', { exact: true }).getByRole('option')).toHaveText([
        'Cooperativa Demo Los Andes', 'Fondo de Empleados Demo Salud', 'Mutual Demo Familia',
    ]);
    const personas = page.getByRole('radiogroup', { name: 'Persona' }).getByRole('radio');
    await expect(personas).toHaveCount(4);
    for (const email of ['gerencia', 'talento', 'calidad', 'colaborador']) {
        await expect(page.getByText(`${email}@coopdemo.example`)).toBeVisible();
    }
});

test('choosing a persona and typing a password signs in through the existing login', async ({ page }) => {
    await mockApi(page);
    await page.goto(`${DEMO}/#/demo`);
    await page.getByLabel('Entidad', { exact: true }).selectOption({ label: 'Fondo de Empleados Demo Salud' });
    await page.getByRole('radio', { name: /Calidad/ }).check();
    await page.getByLabel('Contraseña', { exact: true }).fill('typed-by-the-presenter');
    const login = page.waitForRequest((r) => r.url().endsWith('/auth/login') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Iniciar sesión demo' }).click();
    expect((await login).postDataJSON()).toEqual({ email: 'calidad@fondodemo.example', password: 'typed-by-the-presenter' });
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
});

test('the script control shows the script of the current module', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await page.goto(`${DEMO}/#/documentos`);
    await page.getByRole('button', { name: 'Guion de demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Guion de demo' });
    await expect(dialog.getByRole('heading', { name: 'Control documental' })).toBeVisible();
    expect(await dialog.getByRole('list', { name: 'Pasos' }).getByRole('listitem').count()).toBeGreaterThanOrEqual(3);
    // The module list is a shortcut to every other script.
    await dialog.getByRole('link', { name: 'Educación cooperativa' }).click();
    await expect(page).toHaveURL(/#\/education$/);
    await expect(dialog.getByRole('heading', { name: 'Educación cooperativa' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
});

test('the classification chart and the dossiers have their own script, also on a dossier detail', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await page.goto(`${DEMO}/#/expedientes/x1`);
    await page.getByRole('button', { name: 'Guion de demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Guion de demo' });
    await expect(dialog.getByRole('heading', { name: 'Expedientes' })).toBeVisible();
    expect(await dialog.getByRole('list', { name: 'Pasos' }).getByRole('listitem').count()).toBeGreaterThanOrEqual(3);
    await dialog.getByRole('link', { name: 'Cuadro de clasificación' }).click();
    await expect(page).toHaveURL(/#\/cuadro-clasificacion$/);
    await expect(dialog.getByRole('heading', { name: 'Cuadro de clasificación' })).toBeVisible();
    expect(await dialog.getByRole('list', { name: 'Pasos' }).getByRole('listitem').count()).toBeGreaterThanOrEqual(3);
    // The earlier modules keep their script.
    for (const title of ['Proyectos y sprints', 'Actividades y horas', 'Reportes y analítica', 'Educación cooperativa', 'Habeas Data (ARCO)', 'Asistente IA', 'Control documental']) {
        await expect(dialog.getByRole('link', { name: title })).toBeVisible();
    }
});

test('a persona without the permission does not see that module script', async ({ page }) => {
    await mockApi(page, { permissions: ['menu.platform', 'menu.platform.dashboard', 'menu.documents', 'menu.documents.master_list'] });
    await signIn(page);
    await page.goto(`${DEMO}/#/dashboard`);
    await page.getByRole('button', { name: 'Guion de demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Guion de demo' });
    await expect(dialog.getByRole('link', { name: 'Control documental' })).toBeVisible();
    await expect(dialog.getByRole('link')).toHaveCount(2); // the one module plus "Cambiar de persona"
    await expect(dialog.getByText('Proyectos y sprints')).toHaveCount(0);
});

test('with the flag off there is no demo route and no script control', async ({ page }) => {
    await mockApi(page);
    await page.goto('/#/demo');
    // Unknown route for a visitor: the protected catch-all sends them to the login.
    await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modo demo' })).toHaveCount(0);

    await signIn(page);
    await page.reload(); // the sign-in init script runs on a full load; the login then opens the dashboard
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guion de demo' })).toHaveCount(0);
});
