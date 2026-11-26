import { expect, test, type Page, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown, message = '') => ({ success: true, message, data });

const SUPER_ADMIN = { permissions: [], isAdmin: true, isSuperAdmin: true };
const ORGANIZATIONS = [{ id: 'o9', name: 'Coop Uno', nit: '900', isActive: true, userCount: 4 }];
const LOAD = 'GET /platform/organizations/o9/providers';
const SAVE = 'PUT /platform/organizations/o9/providers';
const CURRENT = { storageProfile: 's3-coop', emailProfile: null, storageProfiles: ['local', 's3-coop'], emailProfiles: ['Brevo', 'Smtp'] };
const HOSTING_DEFAULT = 'Por defecto del hosting';

/** Opens the providers dialog of the only organization; returns the bodies the PUT received. */
async function openProviders(page: Page, save?: (route: Route) => unknown) {
    const sent: unknown[] = [];
    await mockApi(page, SUPER_ADMIN, {
        'GET /platform/organizations': ok(ORGANIZATIONS),
        [LOAD]: ok(CURRENT),
        [SAVE]: (route: Route) => {
            sent.push(route.request().postDataJSON());
            return save ? save(route) : route.fulfill({ json: ok({ ...CURRENT, ...route.request().postDataJSON() }, 'Proveedores actualizados') });
        },
    });
    await signIn(page);
    await page.goto('/#/superadmin');
    await page.getByRole('button', { name: 'Proveedores de Coop Uno' }).click();
    const dialog = page.getByRole('dialog', { name: 'Proveedores' });
    const storage = dialog.getByLabel('Almacenamiento', { exact: true });
    const email = dialog.getByLabel('Correo', { exact: true });
    await expect(storage).toBeVisible();
    return { sent, dialog, storage, email };
}

test('the dialog shows the stored profiles and offers the hosting default plus the profiles of the hosting', async ({ page }) => {
    const { storage, email } = await openProviders(page);
    await expect(storage).toHaveValue('s3-coop');
    await expect(storage.getByRole('option')).toHaveText([HOSTING_DEFAULT, 'local', 's3-coop']);
    // Nothing stored is the hosting default.
    await expect(email.locator('option:checked')).toHaveText(HOSTING_DEFAULT);
    await expect(email.getByRole('option')).toHaveText([HOSTING_DEFAULT, 'Brevo', 'Smtp']);
});

test('saving sends both profiles, shows the message of the API and closes', async ({ page }) => {
    const { sent, dialog, storage, email } = await openProviders(page);
    await storage.selectOption({ label: 'local' });
    await email.selectOption({ label: 'Brevo' });
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Proveedores actualizados')).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(sent).toEqual([{ storageProfile: 'local', emailProfile: 'Brevo' }]);
});

test('going back to the hosting default sends null', async ({ page }) => {
    const { sent, dialog, storage } = await openProviders(page);
    await storage.selectOption({ label: HOSTING_DEFAULT });
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();
    expect(sent).toEqual([{ storageProfile: null, emailProfile: null }]);
});

test('the message of the API is shown when it answers 400, and the dialog stays open', async ({ page }) => {
    const refusal = 'El perfil de almacenamiento «s3-coop» no está definido en el hosting';
    const { sent, dialog } = await openProviders(page, (route) => route.fulfill({ status: 400, json: { success: false, message: refusal } }));
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: refusal })).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(sent).toEqual([{ storageProfile: 's3-coop', emailProfile: null }]);
});

test('during an impersonation the action is not offered', async ({ page }) => {
    await mockApi(page, SUPER_ADMIN, { 'GET /platform/organizations': ok(ORGANIZATIONS) });
    await signIn(page, {
        impersonator_token: 'root-token',
        impersonator_user: '{}',
        impersonation: JSON.stringify({ targetName: 'Ana López', organizationName: 'Cooperativa Demo', expiresAt: '2030-01-01T00:00:00Z' }),
    });
    await page.goto('/#/superadmin');
    await expect(page.getByText('Coop Uno')).toBeVisible();
    await expect(page.getByRole('button', { name: /Proveedores/ })).toHaveCount(0);
});
