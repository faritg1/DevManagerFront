import { expect, test, type Page, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });

const SUPER_ADMIN = { permissions: [], isAdmin: true, isSuperAdmin: true };
const STATUS = 'GET /platform/demo';
const CHANGE = 'PUT /platform/demo';
const OFF = { enabled: false, organizations: 3, users: 12 };
const ON = { enabled: true, organizations: 3, users: 12 };
const PASSWORD = 'Clave-demo-2026';

/** Opens the platform screen with a demo access the PUT really flips; returns the bodies it received. */
async function openPlatform(page: Page, initial: typeof OFF, change?: (route: Route) => unknown) {
    let status = initial;
    const sent: unknown[] = [];
    await mockApi(page, SUPER_ADMIN, {
        [STATUS]: (route: Route) => route.fulfill({ json: ok(status) }),
        [CHANGE]: (route: Route) => {
            sent.push(route.request().postDataJSON());
            if (change) return change(route);
            status = { ...status, enabled: route.request().postDataJSON().enabled };
            return route.fulfill({ json: ok(null) });
        },
    });
    await signIn(page);
    await page.goto('/#/superadmin');
    await expect(page.getByRole('heading', { name: 'Acceso demo' })).toBeVisible();
    return sent;
}

const card = (page: Page) => page.getByRole('region', { name: 'Acceso demo' });

test('the demo access card shows the state and how many demo organizations and users exist', async ({ page }) => {
    await openPlatform(page, OFF);
    await expect(card(page).getByText('Apagado', { exact: true })).toBeVisible();
    await expect(card(page).getByText('3 organizaciones demo · 12 usuarios demo')).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Encender acceso demo' })).toBeEnabled();
    await expect(card(page).getByRole('button', { name: 'Apagar acceso demo' })).toHaveCount(0);
});

test('with the access on the card offers to turn it off', async ({ page }) => {
    await openPlatform(page, ON);
    await expect(card(page).getByText('Encendido', { exact: true })).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Apagar acceso demo' })).toBeEnabled();
    await expect(card(page).getByRole('button', { name: 'Encender acceso demo' })).toHaveCount(0);
});

test('turning it on asks for the demo password twice and sends exactly the switch and the password', async ({ page }) => {
    const sent = await openPlatform(page, OFF);
    await card(page).getByRole('button', { name: 'Encender acceso demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Encender acceso demo' });
    const password = dialog.getByLabel('Contraseña de las cuentas demo', { exact: true });
    const repeat = dialog.getByLabel('Confirmar contraseña', { exact: true });
    await expect(password).toHaveAttribute('type', 'password');
    await expect(repeat).toHaveAttribute('type', 'password');

    // A different confirmation never reaches the API.
    await password.fill(PASSWORD);
    await repeat.fill('otra-clave');
    await dialog.getByRole('button', { name: 'Encender', exact: true }).click();
    await expect(dialog.getByText('Las contraseñas no coinciden')).toBeVisible();
    expect(sent).toEqual([]);

    await repeat.fill(PASSWORD);
    await dialog.getByRole('button', { name: 'Encender', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(sent).toEqual([{ enabled: true, password: PASSWORD }]);
    await expect(card(page).getByText('Encendido', { exact: true })).toBeVisible();
    await expect(page.getByText(PASSWORD)).toHaveCount(0);
});

test('turning it off warns that the demo sessions are closed and sends only the switch', async ({ page }) => {
    const sent = await openPlatform(page, ON);
    await card(page).getByRole('button', { name: 'Apagar acceso demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Apagar acceso demo' });
    await expect(dialog.getByText(/cierra las sesiones/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    expect(sent).toEqual([]);

    await card(page).getByRole('button', { name: 'Apagar acceso demo' }).click();
    await dialog.getByRole('button', { name: 'Apagar', exact: true }).click();
    await expect(card(page).getByText('Apagado', { exact: true })).toBeVisible();
    expect(sent).toEqual([{ enabled: false }]);
});

test('without demo organizations the card says so and does not let it be turned on', async ({ page }) => {
    await openPlatform(page, { enabled: false, organizations: 0, users: 0 });
    await expect(card(page).getByText('No hay organizaciones demo cargadas')).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Encender acceso demo' })).toBeDisabled();
});

test('the message of the API is shown when it refuses the password, and the typed password is dropped', async ({ page }) => {
    const refusal = 'La contraseña debe incluir al menos una mayúscula y un número';
    const sent = await openPlatform(page, OFF, (route) => route.fulfill({ status: 400, json: { success: false, message: refusal } }));
    await card(page).getByRole('button', { name: 'Encender acceso demo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Encender acceso demo' });
    await dialog.getByLabel('Contraseña de las cuentas demo', { exact: true }).fill('debil');
    await dialog.getByLabel('Confirmar contraseña', { exact: true }).fill('debil');
    await dialog.getByRole('button', { name: 'Encender', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: refusal })).toBeVisible();
    expect(sent).toEqual([{ enabled: true, password: 'debil' }]);
    // Still off, and the dialog stays open with both fields empty.
    await expect(dialog.getByLabel('Contraseña de las cuentas demo', { exact: true })).toHaveValue('');
    await expect(dialog.getByLabel('Confirmar contraseña', { exact: true })).toHaveValue('');
    await expect(card(page).getByText('Apagado', { exact: true })).toBeVisible();
});

test.describe('phone width', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('the card and its dialog fit without horizontal scroll, in both themes', async ({ page }) => {
        const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        await openPlatform(page, OFF);
        for (const theme of ['light', 'dark']) {
            await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
            await page.reload();
            await expect(card(page).getByText('3 organizaciones demo · 12 usuarios demo')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(theme === 'dark');
            expect(await noSideScroll()).toBe(true);
            await card(page).getByRole('button', { name: 'Encender acceso demo' }).click();
            await expect(page.getByRole('dialog').getByLabel('Confirmar contraseña', { exact: true })).toBeVisible();
            expect(await noSideScroll()).toBe(true);
        }
    });
});
