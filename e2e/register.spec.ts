import { expect, test, type Page, type Route } from '@playwright/test';
import { mockApi } from './mockApi';

const PENDING = 'Solicitud recibida. La entidad queda pendiente de aprobación';
const storedToken = (page: Page) => page.evaluate(() => localStorage.getItem('auth_token'));

test('registering sends the body the API takes, shows the pending message and does not sign in', async ({ page }) => {
    const sent: unknown[] = [];
    await mockApi(page, undefined, {
        'POST /auth/register-organization': (route: Route) => {
            sent.push(route.request().postDataJSON());
            return route.fulfill({ status: 201, json: { success: true, message: PENDING, data: { organizationId: 'o5', adminUserId: 'u5' } } });
        },
    });
    await page.goto('/#/register');
    await page.getByLabel('Nombre de la Organización', { exact: true }).fill('Fondo Nuevo');
    await page.getByLabel('Razón social (opcional)', { exact: true }).fill('Fondo Nuevo de Empleados');
    await page.getByLabel('NIT (opcional)', { exact: true }).fill('900123456');
    await page.getByLabel('Tipo de entidad (opcional)', { exact: true }).selectOption({ label: 'Fondo de empleados' });
    await page.getByLabel('Nombre', { exact: true }).fill('Juan');
    await page.getByLabel('Apellido', { exact: true }).fill('Pérez');
    await page.getByLabel('Email Corporativo', { exact: true }).fill('juan@fondo.co');
    await page.getByLabel('Teléfono (opcional)', { exact: true }).fill('3001234567');
    await page.getByLabel('Contraseña', { exact: true }).fill('Clave-2026');
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Clave-2026');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByRole('status')).toHaveText(PENDING);
    expect(sent).toEqual([{
        organizationName: 'Fondo Nuevo', legalName: 'Fondo Nuevo de Empleados', nit: '900123456', entityType: 5,
        firstName: 'Juan', lastName: 'Pérez', email: 'juan@fondo.co', phone: '3001234567', password: 'Clave-2026',
    }]);
    // Not signed in: no token, still outside the app, and the way on is the login.
    expect(await storedToken(page)).toBeNull();
    await expect(page).toHaveURL(/#\/register$/);
    await page.getByRole('link', { name: 'Volver al inicio de sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
});

test('the optional fields left empty are not sent', async ({ page }) => {
    const sent: unknown[] = [];
    await mockApi(page, undefined, {
        'POST /auth/register-organization': (route: Route) => {
            sent.push(route.request().postDataJSON());
            return route.fulfill({ status: 201, json: { success: true, message: PENDING, data: { organizationId: 'o5', adminUserId: 'u5' } } });
        },
    });
    await page.goto('/#/register');
    await page.getByLabel('Nombre de la Organización', { exact: true }).fill('Fondo Nuevo');
    await page.getByLabel('Nombre', { exact: true }).fill('Juan');
    await page.getByLabel('Apellido', { exact: true }).fill('Pérez');
    await page.getByLabel('Email Corporativo', { exact: true }).fill('juan@fondo.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('Clave-2026');
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Clave-2026');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await expect(page.getByRole('status')).toHaveText(PENDING);
    expect(sent).toEqual([{ organizationName: 'Fondo Nuevo', firstName: 'Juan', lastName: 'Pérez', email: 'juan@fondo.co', password: 'Clave-2026' }]);
});

test('the login shows the message of the API when the organization is still pending', async ({ page }) => {
    const refusal = 'La entidad está pendiente de aprobación';
    await mockApi(page, undefined, { 'POST /auth/login': (route: Route) => route.fulfill({ status: 403, json: { success: false, message: refusal } }) });
    await page.goto('/');
    await page.getByLabel('Email Corporativo', { exact: true }).fill('juan@fondo.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('Clave-2026');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page.locator('form').getByRole('alert')).toHaveText(refusal);
    expect(await storedToken(page)).toBeNull();
    await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
});

test('a wrong password keeps its own message on the login', async ({ page }) => {
    await mockApi(page, undefined, { 'POST /auth/login': (route: Route) => route.fulfill({ status: 401, json: { success: false, message: 'Credenciales inválidas' } }) });
    await page.goto('/');
    await page.getByLabel('Email Corporativo', { exact: true }).fill('juan@fondo.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('mala');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page.locator('form').getByRole('alert')).toHaveText('Credenciales inválidas. Intenta de nuevo.');
});
