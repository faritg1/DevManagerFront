import { expect, test, type Page, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });

/** Answers like the API when a field of the request is wrong (400 or 409). */
const fieldError = (errors: Record<string, string[]>, status = 400) =>
    (route: Route) => route.fulfill({ status, json: { success: false, message: 'Revisa los campos marcados', errorCode: 'VALIDATION_ERROR', errors } });

/** Records every body the endpoint receives and answers with `reply` (an empty success by default). */
const capture = (reply: (route: Route) => unknown = (route) => route.fulfill({ json: ok({}) })) => {
    const bodies: unknown[] = [];
    const handler = (route: Route) => {
        bodies.push(route.request().postDataJSON());
        return reply(route);
    };
    return { bodies, handler };
};

async function openPage(page: Page, path: string, overrides: Record<string, unknown>) {
    await mockApi(page, ADMIN, overrides);
    await signIn(page);
    await page.goto(`/#${path}`);
}

/** The API error sits under the field and the alert only points to the fields. */
async function expectFieldError(panel: ReturnType<Page['getByRole']>, field: ReturnType<Page['getByRole']>, message: string) {
    await expect(field).toHaveAccessibleDescription(message);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(panel.getByRole('alert')).toContainText('Revisa los campos marcados');
    await expect(panel.getByRole('alert').getByRole('listitem')).toHaveCount(0);
    await expect(panel).toBeVisible();
}

test.describe('roles', () => {
    const openForm = async (page: Page, post: unknown) => {
        await openPage(page, '/roles', { 'POST /roles': post });
        await page.getByRole('button', { name: 'Crear Nuevo Rol' }).click();
        return page.getByRole('dialog', { name: 'Nuevo Rol' });
    };

    test('the role form sends the name and the description', async ({ page }) => {
        const post = capture();
        const panel = await openForm(page, post.handler);
        await panel.getByLabel('Nombre del Rol').fill('Editor');
        await panel.getByLabel('Descripción').fill('Edita contenido');
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel).toHaveCount(0);
        expect(post.bodies).toEqual([{ name: 'Editor', description: 'Edita contenido' }]);
    });

    test('a role name the API rejects shows under the name', async ({ page }) => {
        const panel = await openForm(page, fieldError({ name: ['Ya existe un rol con ese nombre'] }, 409));
        await panel.getByLabel('Nombre del Rol').fill('Editor');
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expectFieldError(panel, panel.getByLabel('Nombre del Rol'), 'Ya existe un rol con ese nombre');
    });
});

test.describe('supersolidaria reports', () => {
    const openForm = async (page: Page, post: unknown) => {
        await openPage(page, '/reportes-supersolidaria', { 'POST /reportes/supersolidaria/generar': post });
        await page.getByRole('button', { name: 'Generar Reporte' }).click();
        return page.getByRole('dialog', { name: 'Generar Reporte Supersolidaria' });
    };

    test('the report form sends the period, the type and the notes', async ({ page }) => {
        const post = capture();
        const panel = await openForm(page, post.handler);
        await panel.getByLabel('Inicio del período').fill('2026-01-01');
        await panel.getByLabel('Tipo de reporte').selectOption('2');
        await panel.getByLabel('Observaciones').fill(' Cierre anual ');
        await panel.getByRole('button', { name: 'Generar', exact: true }).click();
        await expect(panel).toHaveCount(0);
        expect(post.bodies).toEqual([{ period: '2026-01-01', reportType: 2, notes: 'Cierre anual' }]);
    });

    test('a period the API rejects shows under the period', async ({ page }) => {
        const panel = await openForm(page, fieldError({ period: ['El período debe iniciar el primer día de un trimestre'] }));
        await panel.getByLabel('Inicio del período').fill('2026-02-10');
        await panel.getByRole('button', { name: 'Generar', exact: true }).click();
        await expectFieldError(panel, panel.getByLabel('Inicio del período'), 'El período debe iniciar el primer día de un trimestre');
    });
});

test.describe('skills', () => {
    const openForm = async (page: Page, post: unknown) => {
        await openPage(page, '/skills', { 'POST /skills': post });
        await page.getByRole('button', { name: 'Nueva Habilidad' }).first().click();
        return page.getByRole('dialog', { name: 'Nueva Habilidad' });
    };

    test('the skill form sends the name, the new category and the type', async ({ page }) => {
        const post = capture((route) => route.fulfill({ json: ok('s1') }));
        const panel = await openForm(page, post.handler);
        await panel.getByLabel('Nombre de la habilidad').fill(' Docker ');
        await panel.getByLabel('Categoría').selectOption('__custom__');
        await panel.getByLabel('Nombre de la nueva categoría').fill('Nube');
        await panel.getByRole('button', { name: /Global/ }).click();
        await panel.getByRole('button', { name: 'Crear habilidad' }).click();
        await expect(panel).toHaveCount(0);
        expect(post.bodies).toEqual([{ name: 'Docker', category: 'Nube', skillType: 0 }]);
    });

    test('a skill name and a category the API reject show under each field', async ({ page }) => {
        const panel = await openForm(page, fieldError({ name: ['Ya existe una habilidad con ese nombre'], category: ['La categoría no es válida'] }, 409));
        await panel.getByLabel('Nombre de la habilidad').fill('Docker');
        await panel.getByLabel('Categoría').selectOption('__custom__');
        await panel.getByLabel('Nombre de la nueva categoría').fill('Nube');
        await panel.getByRole('button', { name: 'Crear habilidad' }).click();
        await expect(panel.getByLabel('Nombre de la nueva categoría')).toHaveAccessibleDescription('La categoría no es válida');
        await expectFieldError(panel, panel.getByLabel('Nombre de la habilidad'), 'Ya existe una habilidad con ese nombre');
    });
});

test.describe('sst', () => {
    const openForm = async (page: Page, post: unknown) => {
        await openPage(page, '/sst', { 'POST /sst/riesgos': post });
        await page.getByRole('button', { name: 'Agregar Riesgo' }).click();
        return page.getByRole('dialog', { name: 'Agregar Riesgo' });
    };

    test('the risk form sends the level, the factor, the description and the controls', async ({ page }) => {
        const post = capture();
        const panel = await openForm(page, post.handler);
        await panel.getByLabel('Nivel de riesgo').selectOption('3');
        await panel.getByLabel('Factor').fill('Ergonómico');
        await panel.getByLabel('Descripción').fill('Posturas prolongadas');
        await panel.getByLabel('Controles').fill('Pausas activas');
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel).toHaveCount(0);
        expect(post.bodies).toEqual([{ level: 3, factor: 'Ergonómico', description: 'Posturas prolongadas', controls: 'Pausas activas' }]);
    });

    test('a risk factor the API rejects shows under the factor', async ({ page }) => {
        const panel = await openForm(page, fieldError({ factor: ['Ya existe un riesgo con ese factor'] }));
        await panel.getByLabel('Factor').fill('Ergonómico');
        await panel.getByLabel('Descripción').fill('Posturas prolongadas');
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expectFieldError(panel, panel.getByLabel('Factor'), 'Ya existe un riesgo con ese factor');
    });
});

test.describe('users', () => {
    const BETO = { id: 'u2', firstName: 'Beto', lastName: 'Ruiz', email: 'beto@coop.co', phone: '300', roleName: 'Asociado', isActive: true, isEmployee: true, createdAt: '2026-01-10T15:00:00Z' };

    const openCreate = async (page: Page, overrides: Record<string, unknown>) => {
        await openPage(page, '/users', { 'GET /users': ok([BETO]), 'GET /roles': ok([{ id: 'r2', name: 'Editor' }]), ...overrides });
        await page.getByRole('button', { name: 'Invitar Usuario' }).click();
        return page.getByRole('dialog', { name: 'Invitar Usuario' });
    };

    const fillCreate = async (panel: ReturnType<Page['getByRole']>) => {
        await panel.getByLabel('Nombres').fill('Juan');
        await panel.getByLabel('Apellidos').fill('Pérez');
        await panel.getByLabel('Email').fill('juan@coop.co');
        await panel.getByLabel('Contraseña *').fill('Clave-2026');
    };

    test('the create form sends the user and then assigns the chosen role', async ({ page }) => {
        const post = capture((route) => route.fulfill({ json: ok({ id: 'u9', firstName: 'Juan', lastName: 'Pérez' }) }));
        const assign = capture();
        const panel = await openCreate(page, { 'POST /users': post.handler, 'POST /roles/assign-to-user': assign.handler });
        await fillCreate(panel);
        await panel.getByLabel('Teléfono').fill('3001234567');
        await panel.getByLabel('Es empleado (vinculación laboral)').uncheck();
        await panel.getByLabel('Rol').selectOption('r2');
        await panel.getByRole('button', { name: 'Crear Usuario' }).click();
        await expect(panel).toHaveCount(0);
        expect(post.bodies).toEqual([{ firstName: 'Juan', lastName: 'Pérez', email: 'juan@coop.co', password: 'Clave-2026', phone: '3001234567', isEmployee: false }]);
        expect(assign.bodies).toEqual([{ userId: 'u9', roleId: 'r2' }]);
    });

    test('an email the API rejects shows under the email', async ({ page }) => {
        const panel = await openCreate(page, { 'POST /users': fieldError({ email: ['Ya existe un usuario con ese correo'] }, 409) });
        await fillCreate(panel);
        await panel.getByRole('button', { name: 'Crear Usuario' }).click();
        await expectFieldError(panel, panel.getByLabel('Email'), 'Ya existe un usuario con ese correo');
    });

    test('a short password shows its message under the field and sends nothing', async ({ page }) => {
        const post = capture();
        const panel = await openCreate(page, { 'POST /users': post.handler });
        await fillCreate(panel);
        const password = panel.getByLabel('Contraseña *');
        await password.fill('corta');
        await panel.getByRole('button', { name: 'Crear Usuario' }).click();
        await expect(password).toHaveAccessibleDescription('La contraseña debe tener mínimo 8 caracteres');
        await expect(panel).toBeVisible();
        expect(post.bodies).toHaveLength(0);

        await password.fill('Clave-2026');
        await expect(panel.getByText('La contraseña debe tener mínimo 8 caracteres')).toHaveCount(0);
        await panel.getByRole('button', { name: 'Crear Usuario' }).click();
        await expect(panel).toHaveCount(0);
        expect(post.bodies).toHaveLength(1);
    });

    test('the create form with empty names shows the required message under each and sends nothing', async ({ page }) => {
        const post = capture();
        const panel = await openCreate(page, { 'POST /users': post.handler });
        await panel.getByLabel('Apellidos').fill('   ');
        await panel.getByLabel('Email').fill('juan@coop.co');
        await panel.getByLabel('Contraseña *').fill('Clave-2026');
        await panel.getByRole('button', { name: 'Crear Usuario' }).click();
        await expect(panel.getByLabel('Nombres')).toHaveAccessibleDescription('Este campo es obligatorio');
        await expect(panel.getByLabel('Apellidos')).toHaveAccessibleDescription('Este campo es obligatorio');
        expect(post.bodies).toHaveLength(0);
    });

    test('the edit form refuses an empty name under the field, then sends the user', async ({ page }) => {
        const put = capture();
        await openPage(page, '/users', { 'GET /users': ok([BETO]), 'PUT /users/u2': put.handler });
        await page.getByRole('button', { name: 'Acciones de Beto Ruiz' }).click();
        await page.getByText('Editar', { exact: true }).click();
        const panel = page.getByRole('dialog', { name: 'Editar Usuario' });
        await panel.getByLabel('Nombres').fill('');
        await panel.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(panel.getByLabel('Nombres')).toHaveAccessibleDescription('Este campo es obligatorio');
        expect(put.bodies).toHaveLength(0);

        await panel.getByLabel('Nombres').fill('Alberto');
        await panel.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(panel).toHaveCount(0);
        expect(put.bodies).toEqual([{ firstName: 'Alberto', lastName: 'Ruiz', phone: '300', isActive: true, isEmployee: true }]);
    });
});
