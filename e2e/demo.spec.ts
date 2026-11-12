import { expect, test, type Page, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });

// The demo access is a switch the API answers (GET /demo); mockApi leaves it off by default.
const ON = { 'GET /demo': ok({ enabled: true }) };

/** Starts signed in as a persona of the demo catalog (src/features/demo/catalog.ts). */
const signInAsPersona = (page: Page, email = 'calidad@coopdemo.example') =>
    signIn(page, { auth_user: JSON.stringify({ id: 'u1', name: 'Ana López', email, role: 'Admin', organizationName: 'Cooperativa Demo Los Andes' }) });

test('entry page lists the three organizations and the four personas', async ({ page }) => {
    await mockApi(page, undefined, ON);
    await page.goto('/#/demo');
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
    await mockApi(page, undefined, ON);
    await page.goto('/#/demo');
    await page.getByLabel('Entidad', { exact: true }).selectOption({ label: 'Fondo de Empleados Demo Salud' });
    await page.getByRole('radio', { name: /Calidad/ }).check();
    await page.getByLabel('Contraseña', { exact: true }).fill('typed-by-the-presenter');
    const login = page.waitForRequest((r) => r.url().endsWith('/auth/login') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Iniciar sesión demo' }).click();
    expect((await login).postDataJSON()).toEqual({ email: 'calidad@fondodemo.example', password: 'typed-by-the-presenter' });
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
});

test('with the switch on the login screen links to the demo entry', async ({ page }) => {
    await mockApi(page, undefined, ON);
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver demostración' }).click();
    await expect(page).toHaveURL(/#\/demo$/);
    await expect(page.getByRole('heading', { name: 'Modo demo' })).toBeVisible();
});

test('the script control shows the script of the current module', async ({ page }) => {
    await mockApi(page, undefined, ON);
    await signInAsPersona(page);
    await page.goto('/#/documentos');
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
    await mockApi(page, undefined, ON);
    await signInAsPersona(page, 'gerencia@mutualdemo.example');
    await page.goto('/#/expedientes/x1');
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
    await mockApi(page, { permissions: ['menu.platform', 'menu.platform.dashboard', 'menu.documents', 'menu.documents.master_list'] }, ON);
    await signInAsPersona(page, 'colaborador@fondodemo.example');
    await page.goto('/#/dashboard');
    await page.getByRole('button', { name: 'Guion de demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Guion de demo' });
    await expect(dialog.getByRole('link', { name: 'Control documental' })).toBeVisible();
    await expect(dialog.getByRole('link')).toHaveCount(2); // the one module plus "Cambiar de persona"
    await expect(dialog.getByText('Proyectos y sprints')).toHaveCount(0);
});

test('with the switch on a user outside the demo catalog gets no script bar', async ({ page }) => {
    await mockApi(page, undefined, ON);
    const asked = page.waitForResponse((r) => r.url().endsWith('/api/demo'));
    await signIn(page); // ana@coop.co, a real user
    await page.goto('/#/dashboard');
    await asked;
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guion de demo' })).toHaveCount(0);
    await expect(page.getByText('Modo demo')).toHaveCount(0);
});

test('with the switch off there is no demo route, no login link and no script bar', async ({ page }) => {
    await mockApi(page);
    await page.goto('/#/demo');
    // Unknown route for a visitor: the protected catch-all sends them to the login.
    await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
    await expect(page.getByText(/demostración|modo demo/i)).toHaveCount(0);

    // Even a catalog persona with a session still open sees nothing of the demo.
    await signInAsPersona(page);
    await page.reload(); // the sign-in init script runs on a full load; the login then opens the dashboard
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guion de demo' })).toHaveCount(0);
    await page.goto('/#/demo');
    await expect(page.getByRole('main').getByText('Página no encontrada')).toBeVisible();
    await expect(page.getByText(/demostración|modo demo/i)).toHaveCount(0);
});

const FAILURES: Record<string, (route: Route) => unknown> = {
    'answers 500': (route) => route.fulfill({ status: 500, json: { success: false, message: 'Error interno' } }),
    'cannot be reached': (route) => route.abort(),
    'never answers': () => undefined,
};

for (const [name, handler] of Object.entries(FAILURES)) {
    test(`when the switch request ${name} the demo stays off and nothing is reported`, async ({ page }) => {
        await mockApi(page, undefined, { 'GET /demo': handler });
        await page.goto('/#/demo');
        // "never answers" waits for the request to be given up.
        await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/demostración|modo demo/i)).toHaveCount(0);
        await expect(page.getByRole('alert')).toHaveCount(0);
    });
}

test('the switch is asked once per page load, not on every navigation', async ({ page }) => {
    let asked = 0;
    await mockApi(page, undefined, { 'GET /demo': (route: Route) => { asked++; return route.fulfill({ json: ok({ enabled: true }) }); } });
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver demostración' }).click();
    await expect(page.getByRole('heading', { name: 'Modo demo' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('link', { name: 'Ver demostración' })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'Modo demo' })).toBeVisible();
    expect(asked).toBe(1);
});
