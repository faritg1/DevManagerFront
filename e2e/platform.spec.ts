import { expect, test, type Page, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

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

test.describe('creating, approving and rejecting organizations', () => {
    const IMPERSONATING = {
        impersonator_token: 'root-token',
        impersonator_user: '{}',
        impersonation: JSON.stringify({ targetName: 'Ana López', organizationName: 'Cooperativa Demo', expiresAt: '2030-01-01T00:00:00Z' }),
    };
    const refuse = (status: number, message: string) => (route: Route) => route.fulfill({ status, json: { success: false, message } });

    /** Opens the platform screen with an active and a pending organization; the POSTs really change the list. */
    async function openOrganizations(page: Page, overrides: Record<string, unknown> = {}, storage: Record<string, string> = {}) {
        let list = [
            { id: 'o9', name: 'Coop Uno', nit: '900', isActive: true, userCount: 4 },
            { id: 'o10', name: 'Fondo Nuevo', nit: null, isActive: false, userCount: 1 },
        ];
        const sent: unknown[] = [];
        const calls: string[] = [];
        const answer = (key: string, status: number, message: string, change: () => void, data: unknown = null) => (route: Route) => {
            calls.push(key);
            change();
            return route.fulfill({ status, json: { success: true, message, data } });
        };
        await mockApi(page, SUPER_ADMIN, {
            'GET /platform/organizations': (route: Route) => route.fulfill({ json: ok(list) }),
            'POST /platform/organizations': (route: Route) => {
                sent.push(route.request().postDataJSON());
                list = [...list, { id: 'o11', name: route.request().postDataJSON().organizationName, nit: null, isActive: true, userCount: 1 }];
                return route.fulfill({ status: 201, json: { success: true, message: 'Entidad creada', data: { organizationId: 'o11', adminUserId: 'u11' } } });
            },
            'POST /platform/organizations/o10/approve': answer('approve', 200, 'Entidad aprobada', () => { list = list.map((o) => ({ ...o, isActive: true })); }),
            'POST /platform/organizations/o10/reject': answer('reject', 200, 'Solicitud rechazada', () => { list = list.filter((o) => o.id !== 'o10'); }),
            ...overrides,
        });
        await signIn(page, storage);
        await page.goto('/#/superadmin');
        await expect(page.getByText('Fondo Nuevo')).toBeVisible();
        return { sent, calls };
    }

    test('creating an organization sends the fields of the dialog, shows the message and reloads the list', async ({ page }) => {
        const { sent } = await openOrganizations(page);
        await page.getByRole('button', { name: 'Crear entidad' }).click();
        const dialog = page.getByRole('dialog', { name: 'Crear entidad' });
        await dialog.getByLabel('Nombre de la Organización', { exact: true }).fill('Mutual Tres');
        await dialog.getByLabel('Razón social (opcional)', { exact: true }).fill('Mutual Tres Ltda');
        await dialog.getByLabel('NIT (opcional)', { exact: true }).fill('901555');
        await dialog.getByLabel('Tipo de entidad (opcional)', { exact: true }).selectOption({ label: 'Mutual' });
        await dialog.getByLabel('Nombre', { exact: true }).fill('Luz');
        await dialog.getByLabel('Apellido', { exact: true }).fill('Mora');
        await dialog.getByLabel('Email Corporativo', { exact: true }).fill('luz@mutual.co');
        await dialog.getByLabel('Teléfono (opcional)', { exact: true }).fill('3009876543');
        await dialog.getByLabel('Contraseña', { exact: true }).fill('Clave-2026');
        await dialog.getByRole('button', { name: 'Guardar' }).click();

        await expect(page.getByText('Entidad creada')).toBeVisible();
        await expect(dialog).toBeHidden();
        expect(sent).toEqual([{
            organizationName: 'Mutual Tres', legalName: 'Mutual Tres Ltda', nit: '901555', entityType: 4,
            firstName: 'Luz', lastName: 'Mora', email: 'luz@mutual.co', phone: '3009876543', password: 'Clave-2026',
        }]);
        await expect(page.getByText('Mutual Tres')).toBeVisible();
    });

    test('only a pending organization shows the label and its two actions; approving shows the message and reloads', async ({ page }) => {
        const { calls } = await openOrganizations(page);
        await expect(page.getByText('Pendiente', { exact: true })).toHaveCount(1);
        await expect(page.getByRole('button', { name: /^(Aprobar|Rechazar) Coop Uno$/ })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Rechazar Fondo Nuevo' })).toBeVisible();

        await page.getByRole('button', { name: 'Aprobar Fondo Nuevo' }).click();
        await expect(page.getByText('Entidad aprobada')).toBeVisible();
        expect(calls).toEqual(['approve']);
        await expect(page.getByText('Pendiente', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Aprobar Fondo Nuevo' })).toHaveCount(0);
    });

    test('rejecting asks for confirmation first, then shows the message and reloads', async ({ page }) => {
        const { calls } = await openOrganizations(page);
        await page.getByRole('button', { name: 'Rechazar Fondo Nuevo' }).click();
        const dialog = page.getByRole('dialog', { name: 'Rechazar solicitud' });
        await dialog.getByRole('button', { name: 'Cancelar' }).click();
        await expect(dialog).toBeHidden();
        expect(calls).toEqual([]);

        await page.getByRole('button', { name: 'Rechazar Fondo Nuevo' }).click();
        await dialog.getByRole('button', { name: 'Rechazar', exact: true }).click();
        await expect(page.getByText('Solicitud rechazada')).toBeVisible();
        expect(calls).toEqual(['reject']);
        await expect(page.getByText('Fondo Nuevo')).toHaveCount(0);
        await expect(page.getByText('Coop Uno')).toBeVisible();
    });

    test('the message of the API is shown when it answers 409', async ({ page }) => {
        const refusal = 'La entidad ya está activa';
        await openOrganizations(page, { 'POST /platform/organizations/o10/approve': refuse(409, refusal) });
        await page.getByRole('button', { name: 'Aprobar Fondo Nuevo' }).click();
        await expect(page.getByRole('alert').filter({ hasText: refusal })).toBeVisible();
        await expect(page.getByText('Entidad aprobada')).toHaveCount(0);
    });

    test('the message of the API is shown when it refuses the new organization, and the dialog stays open', async ({ page }) => {
        const refusal = 'Ya existe una entidad con ese NIT';
        await openOrganizations(page, { 'POST /platform/organizations': refuse(409, refusal) });
        await page.getByRole('button', { name: 'Crear entidad' }).click();
        const dialog = page.getByRole('dialog', { name: 'Crear entidad' });
        await dialog.getByLabel('Nombre de la Organización', { exact: true }).fill('Mutual Tres');
        await dialog.getByLabel('Nombre', { exact: true }).fill('Luz');
        await dialog.getByLabel('Apellido', { exact: true }).fill('Mora');
        await dialog.getByLabel('Email Corporativo', { exact: true }).fill('luz@mutual.co');
        await dialog.getByLabel('Contraseña', { exact: true }).fill('Clave-2026');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByRole('alert').filter({ hasText: refusal })).toBeVisible();
        await expect(dialog).toBeVisible();
    });

    test('during an impersonation none of it is offered', async ({ page }) => {
        await openOrganizations(page, {}, IMPERSONATING);
        await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: /Crear entidad|Aprobar|Rechazar/ })).toHaveCount(0);
    });
});

test.describe('plan and modules of an organization', () => {
    const GB = 1024 ** 3;
    const PLAN = 'GET /platform/organizations/o9/plan';
    const SAVE = 'PUT /platform/organizations/o9/plan';
    const node = (code: string, name: string, children: unknown[] = []) => ({ id: code, code, name, module: 'menu', children });
    const TREE = [
        node('menu.admin', 'Administración', [node('menu.admin.users', 'Usuarios')]),
        node('menu.documents', 'Documentos', [
            node('menu.documents.inbox', 'Radicados', [node('menu.documents.inbox.create', 'Crear radicado')]),
            node('menu.documents.dossiers', 'Expedientes'),
        ]),
    ];
    const CURRENT = { disabledModules: [], maxUsers: null, maxStorageBytes: null, activeUsers: 4, usedStorageBytes: 1.5 * GB };

    /** Opens the dialog of the only organization; returns the bodies the PUT received. */
    async function openPlan(page: Page, save?: (route: Route) => unknown) {
        const sent: unknown[] = [];
        await mockApi(page, SUPER_ADMIN, {
            'GET /platform/organizations': ok([{ id: 'o9', name: 'Coop Uno', nit: '900', isActive: true, userCount: 4 }]),
            'GET /permissions/tree': ok(TREE),
            [PLAN]: ok(CURRENT),
            [SAVE]: (route: Route) => {
                sent.push(route.request().postDataJSON());
                return save ? save(route) : route.fulfill({ json: ok({ ...CURRENT, ...route.request().postDataJSON() }) });
            },
        });
        await signIn(page);
        await page.goto('/#/superadmin');
        await page.getByRole('button', { name: 'Plan y módulos de Coop Uno' }).click();
        const dialog = page.getByRole('dialog', { name: 'Plan y módulos' });
        await expect(dialog.getByText('4 usuarios activos')).toBeVisible();
        return { sent, dialog };
    }

    test('turning a section off and setting a cap sends the codes, the users and the storage in bytes', async ({ page }) => {
        const { sent, dialog } = await openPlan(page);
        await expect(dialog.getByText('1,5 GB usados')).toBeVisible();
        // Two levels only, and Administración is locked on.
        await expect(dialog.getByRole('switch')).toHaveCount(5);
        await expect(dialog.getByRole('switch', { name: 'Administración' })).toBeDisabled();
        await expect(dialog.getByRole('switch', { name: 'Usuarios' })).toBeDisabled();
        await expect(dialog.getByRole('switch', { name: 'Usuarios' })).toBeChecked();

        await dialog.getByRole('switch', { name: 'Documentos' }).click();
        await expect(dialog.getByRole('switch', { name: 'Radicados' })).toBeDisabled();
        await expect(dialog.getByRole('switch', { name: 'Radicados' })).not.toBeChecked();
        await dialog.getByLabel('Tope de usuarios', { exact: true }).fill('5');
        await dialog.getByLabel('Tope de almacenamiento (GB)', { exact: true }).fill('2');
        await dialog.getByRole('button', { name: 'Guardar' }).click();

        await expect(page.getByText('Plan actualizado')).toBeVisible();
        await expect(dialog).toBeHidden();
        expect(sent).toEqual([{ disabledModules: ['menu.documents'], maxUsers: 5, maxStorageBytes: 2 * GB }]);
    });

    test('the message of the API is shown when it refuses the plan, and the dialog stays open', async ({ page }) => {
        const refusal = 'El tope debe ser mayor que cero';
        const { sent, dialog } = await openPlan(page, (route) => route.fulfill({ status: 400, json: { success: false, message: refusal } }));
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByRole('alert').filter({ hasText: refusal })).toBeVisible();
        await expect(dialog).toBeVisible();
        // Empty caps travel as null: no cap.
        expect(sent).toEqual([{ disabledModules: [], maxUsers: null, maxStorageBytes: null }]);
    });

    test('someone who is not the super admin never gets the action', async ({ page }) => {
        await mockApi(page, ADMIN, { 'GET /platform/organizations': ok([{ id: 'o9', name: 'Coop Uno', nit: '900', isActive: true, userCount: 4 }]) });
        await signIn(page);
        await page.goto('/#/superadmin');
        await expect(page).not.toHaveURL(/superadmin/);
        await expect(page.getByRole('button', { name: /Plan y módulos/ })).toHaveCount(0);
    });
});
