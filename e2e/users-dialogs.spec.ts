import { expect, test, type Page, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });

const BETO = { id: 'u2', firstName: 'Beto', lastName: 'Ruiz', fullName: 'Beto Ruiz', email: 'beto@coop.co', roleName: 'Asociado', isActive: true, isEmployee: true, createdAt: '2026-01-10T15:00:00Z' };
const ROLES = [
    { id: 'r1', name: 'Asociado', description: 'Acceso básico', permissionCount: 3, userCount: 1 },
    { id: 'r2', name: 'Editor', description: null, permissionCount: 5, userCount: 0 },
];
const EFFECTIVE = ok({
    userId: 'u2', roles: [{ name: 'Asociado' }],
    effectivePermissions: [{ code: 'menu.platform.projects' }],
    directOverrides: [{ permissionCode: 'menu.platform.reports', isGranted: false }],
});

/** Records every body the endpoint receives and answers an empty success. */
const capture = () => {
    const bodies: unknown[] = [];
    const handler = (route: Route) => {
        bodies.push(route.request().postDataJSON());
        return route.fulfill({ json: ok({}) });
    };
    return { bodies, handler };
};

/** Opens the users page as an admin and picks one action of Beto's row. */
async function openAction(page: Page, action: string, overrides: Record<string, unknown>) {
    await mockApi(page, ADMIN, { 'GET /users': ok([BETO]), 'GET /roles': ok(ROLES), 'GET /permissions/user/u2/effective': EFFECTIVE, ...overrides });
    await signIn(page);
    await page.goto('/#/users');
    await page.getByRole('button', { name: 'Acciones de Beto Ruiz' }).click();
    await page.getByText(action, { exact: true }).click();
}

test('the roles dialog checks the roles the user has and assigns or revokes on each change', async ({ page }) => {
    const assign = capture();
    const revoke = capture();
    await openAction(page, 'Gestionar roles', { 'POST /roles/assign-to-user': assign.handler, 'POST /roles/revoke-from-user': revoke.handler });
    const dialog = page.getByRole('dialog', { name: 'Roles — Beto Ruiz' });

    await expect(dialog.getByText('Acceso básico')).toBeVisible();
    await expect(dialog.getByText('5 permisos')).toBeVisible(); // a role without description shows its permission count
    const asociado = dialog.getByRole('checkbox', { name: /Asociado/ });
    const editor = dialog.getByRole('checkbox', { name: /Editor/ });
    await expect(asociado).toBeChecked();
    await expect(editor).not.toBeChecked();

    await editor.click(); // the box follows the API answer, not the click
    await expect(editor).toBeChecked();
    expect(assign.bodies).toEqual([{ userId: 'u2', roleId: 'r2' }]);

    await asociado.click();
    await expect(asociado).not.toBeChecked();
    expect(revoke.bodies).toEqual([{ userId: 'u2', roleId: 'r1' }]);

    await dialog.getByRole('button', { name: 'Cerrar' }).last().click(); // the footer button (the header has its own)
    await expect(dialog).toHaveCount(0);
});

test('the permissions dialog lists roles, permissions and overrides, and applies a new override', async ({ page }) => {
    const override = capture();
    await openAction(page, 'Permisos efectivos', {
        'GET /permissions/grouped': ok([{ module: 'Proyectos', permissions: [{ id: 'p7', code: 'menu.platform.projects.create', name: 'Crear proyectos', module: 'Proyectos' }] }]),
        'POST /permissions/assign-to-user': override.handler,
    });
    const dialog = page.getByRole('dialog', { name: 'Permisos — Beto Ruiz' });

    await expect(dialog.getByText('Asociado', { exact: true })).toBeVisible();
    await expect(dialog.getByText('menu.platform.projects', { exact: true })).toBeVisible();
    await expect(dialog.getByText('DENY')).toBeVisible();
    await expect(dialog.getByText('menu.platform.reports')).toBeVisible();

    await dialog.getByLabel('Permiso *').selectOption('p7');
    await dialog.getByRole('button', { name: 'Denegar' }).click();
    await dialog.getByRole('button', { name: 'Aplicar override' }).click();
    await expect.poll(() => override.bodies).toEqual([{ userId: 'u2', permissionId: 'p7', isGranted: false }]);
    await expect(dialog.getByLabel('Permiso *')).toHaveValue(''); // the picker resets after saving
});

test('the skills dialog validates a skill at its level or at an adjusted one', async ({ page }) => {
    const validate = capture();
    await openAction(page, 'Skills / Validar', {
        'GET /employees/u2/skills': ok([{
            id: 's1', userId: 'u2', skillId: 'k1', skillName: 'React', level: 3, evidenceUrl: null,
            experienceDescription: 'Dos años en el portal', lastValidatedAt: null, validatedByUserId: null, validatedByName: null,
        }]),
        'PUT /employees/skills/s1/validate': validate.handler,
    });
    const dialog = page.getByRole('dialog', { name: 'Skills — Beto Ruiz' });

    await expect(dialog.getByText('React')).toBeVisible();
    await expect(dialog.getByText('Dos años en el portal')).toBeVisible();
    await expect(dialog.getByText('Pendiente')).toBeVisible();

    await dialog.getByRole('button', { name: 'Validar (nivel actual)' }).click();
    await expect.poll(() => validate.bodies).toEqual([{ newLevel: null }]);

    await dialog.getByRole('button', { name: 'Ajustar nivel' }).click();
    await dialog.getByRole('button', { name: 'Subir nivel' }).click();
    await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click();
    await expect.poll(() => validate.bodies).toEqual([{ newLevel: null }, { newLevel: 4 }]);
    await expect(dialog.getByRole('button', { name: 'Ajustar nivel' })).toBeVisible(); // the adjuster closes after saving
});
