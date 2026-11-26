import { expect, test, type Page, type Route } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const USERS = [{ id: 'u1', firstName: 'Ana', lastName: 'López', email: 'ana@coop.co', isActive: true }];
const DISCARD_MESSAGE = 'Tienes cambios sin guardar. ¿Quieres descartarlos?';

/** Opens "Nuevo documento": the reference form every other FormPanel copies. */
const open = async (page: Page, overrides: Record<string, unknown> = {}) => {
    await mockApi(page, { permissions: ['menu.documents', 'menu.documents.master_list', 'menu.documents.master_list.create'] }, { 'GET /users': ok(USERS), ...overrides });
    await signIn(page);
    await page.goto('/#/documentos');
    await page.getByRole('button', { name: 'Nuevo documento' }).click();
    const panel = page.getByRole('dialog', { name: 'Nuevo documento' });
    await expect(panel).toBeVisible();
    return panel;
};

const fillRequired = async (panel: ReturnType<Page['getByRole']>) => {
    await panel.getByLabel('Código').fill('pro-002');
    await panel.getByLabel('Título').fill('Procedimiento');
    await panel.getByLabel('Tipo').fill('Procedimiento');
    await panel.getByLabel('Proceso').fill('Compras');
    await panel.getByLabel('Responsable').selectOption('u1');
};

test.describe('form panel', () => {
    test('opens as a full-height panel docked to the right, with its title and required marks', async ({ page }) => {
        const panel = await open(page);
        await expect(panel).toHaveAttribute('aria-modal', 'true');
        const view = page.viewportSize()!;
        // It slides in: wait until it docks.
        await expect.poll(async () => Math.round((await panel.boundingBox())!.x + (await panel.boundingBox())!.width)).toBe(view.width);
        const box = (await panel.boundingBox())!;
        expect(box.height).toBe(view.height);
        expect(box.width).toBeLessThan(view.width);
        // A required field marks its label; the mark is hidden from assistive tech, so the name stays clean.
        const mark = (label: string) => panel.locator('label', { hasText: label }).locator('xpath=following-sibling::*[@aria-hidden="true"]');
        await expect(mark('Código')).toHaveText('*');
        await expect(mark('Responsable')).toHaveText('*');
        await expect(mark('Fecha de revisión')).toHaveCount(0);
        await expect(panel.getByLabel('Código', { exact: true })).toBeVisible();
        await expect(panel.getByRole('button', { name: 'Guardar' })).toBeVisible();
        await expect(panel.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    });

    test('an empty required field shows its message, takes the focus and sends nothing', async ({ page }) => {
        let posts = 0;
        const panel = await open(page, { 'POST /documents': (route: Route) => { posts++; return route.fulfill({ json: ok({}) }); } });
        await panel.getByLabel('Título').fill('Procedimiento');
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel.getByText('Este campo es obligatorio').first()).toBeVisible();
        await expect(panel.getByLabel('Código')).toBeFocused();
        await expect(panel).toBeVisible();
        expect(posts).toBe(0);
    });

    test('a 400 from the API shows in the panel alert only, with its field errors, and the panel stays open', async ({ page }) => {
        let fail = true;
        const panel = await open(page, {
            'POST /documents': (route: Route) => fail
                // No control is named `storage`, so the entry stays in the alert.
                ? route.fulfill({ status: 400, json: { success: false, message: 'Ya existe un documento con ese código', errors: { storage: ['El código ya está en uso'] } } })
                : route.fulfill({ json: ok({}) }),
        });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();

        const alert = panel.getByRole('alert');
        await expect(alert).toContainText('No se pudo guardar');
        await expect(alert).toContainText('Ya existe un documento con ese código');
        await expect(alert.getByRole('listitem')).toHaveText(['El código ya está en uso']);
        await expect(alert).toBeFocused();
        await expect(panel).toBeVisible();
        // The global toast does not repeat a 4xx the panel already shows.
        await expect(page.getByText('Ya existe un documento con ese código')).toHaveCount(1);
        await expect(page.getByText('Error en Servidor (400)')).toHaveCount(0);
        await expect(panel.getByLabel('Código')).toHaveValue('pro-002');

        // Sending again clears the alert; a saved form closes without asking.
        fail = false;
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel).toHaveCount(0);
        await expect(page.getByText(DISCARD_MESSAGE)).toHaveCount(0);
    });

    const fieldError = (errors: Record<string, string[]>, message = 'Ya existe un documento con ese código') =>
        (route: Route) => route.fulfill({ status: 400, json: { success: false, message, errorCode: 'VALIDATION_ERROR', errors } });

    test('a field error from the API shows under its field, which takes the focus, and leaves the alert list', async ({ page }) => {
        const panel = await open(page, { 'POST /documents': fieldError({ code: ['El código ya está en uso'] }) });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();

        const code = panel.getByLabel('Código');
        await expect(code).toHaveAccessibleDescription('El código ya está en uso');
        await expect(code).toHaveAttribute('aria-invalid', 'true');
        await expect(code).toBeFocused();
        const alert = panel.getByRole('alert');
        await expect(alert).toContainText('Revisa los campos marcados');
        await expect(alert).not.toContainText('Ya existe un documento con ese código');
        await expect(alert.getByRole('listitem')).toHaveCount(0);
        await expect(panel.getByText('El código ya está en uso')).toHaveCount(1);
    });

    test('a field error matches the control name without case and by the last segment; one with no control stays in the alert', async ({ page }) => {
        const panel = await open(page, {
            'POST /documents': fieldError({ Title: ['El título ya existe'], 'document.reviewDate': ['La fecha ya pasó'], storage: ['No hay espacio'] }),
        });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();

        await expect(panel.getByLabel('Título')).toHaveAccessibleDescription('El título ya existe');
        await expect(panel.getByLabel('Título')).toBeFocused();
        await expect(panel.getByLabel('Fecha de revisión')).toHaveAccessibleDescription('La fecha ya pasó');
        const alert = panel.getByRole('alert');
        await expect(alert).toContainText('Ya existe un documento con ese código');
        await expect(alert.getByRole('listitem')).toHaveText(['No hay espacio']);
    });

    test('editing the field clears its API error, and saving again sends the new value', async ({ page }) => {
        const bodies: unknown[] = [];
        const panel = await open(page, {
            'POST /documents': (route: Route) => {
                bodies.push(route.request().postDataJSON());
                return bodies.length === 1 ? fieldError({ code: ['El código ya está en uso'] })(route) : route.fulfill({ json: ok({}) });
            },
        });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();
        const code = panel.getByLabel('Código');
        await expect(code).toHaveAccessibleDescription('El código ya está en uso');

        await code.fill('pro-003');
        await expect(panel.getByText('El código ya está en uso')).toHaveCount(0);
        await expect(code).not.toHaveAttribute('aria-invalid', 'true');

        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel).toHaveCount(0);
        expect(bodies).toHaveLength(2);
        expect(bodies[1]).toMatchObject({ code: 'pro-003', title: 'Procedimiento' });
    });

    test('an API field error never blocks saving again, even without editing the field', async ({ page }) => {
        let posts = 0;
        const panel = await open(page, {
            'POST /documents': (route: Route) => (++posts === 1 ? fieldError({ code: ['El código ya está en uso'] })(route) : route.fulfill({ json: ok({}) })),
        });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel.getByLabel('Código')).toHaveAccessibleDescription('El código ya está en uso');
        await panel.getByLabel('Título').press('Enter');
        await expect(panel).toHaveCount(0);
        expect(posts).toBe(2);
    });

    test('a required text field with only spaces shows its message and sends nothing', async ({ page }) => {
        let posts = 0;
        const panel = await open(page, { 'POST /documents': (route: Route) => { posts++; return route.fulfill({ json: ok({}) }); } });
        await fillRequired(panel);
        await panel.getByLabel('Título').fill('   ');
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel.getByLabel('Título')).toHaveAccessibleDescription('Este campo es obligatorio');
        await expect(panel.getByLabel('Título')).toBeFocused();
        await expect(panel).toBeVisible();
        expect(posts).toBe(0);

        // Real text clears it and the form saves.
        await panel.getByLabel('Título').fill('Procedimiento');
        await expect(panel.getByText('Este campo es obligatorio')).toHaveCount(0);
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel).toHaveCount(0);
        expect(posts).toBe(1);
    });

    test('a 400 in the ProblemDetails shape of ASP.NET still shows its messages', async ({ page }) => {
        const panel = await open(page, {
            'POST /documents': (route: Route) => route.fulfill({
                status: 400,
                json: { type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1', title: 'One or more validation errors occurred.', status: 400, errors: { Code: ['The Code field is required.'], '$.ownerUserId': ['The JSON value could not be converted.'], '$': ['The body is not valid.'] } },
            }),
        });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel.getByLabel('Código')).toHaveAccessibleDescription('The Code field is required.');
        await expect(panel.getByLabel('Responsable')).toHaveAccessibleDescription('The JSON value could not be converted.');
        const alert = panel.getByRole('alert');
        await expect(alert).toContainText('No se pudo guardar');
        await expect(alert.getByRole('listitem')).toHaveText(['The body is not valid.']);
        await expect(panel).toBeVisible();
    });

    test('a 500 shows in the panel alert and also in the global toast', async ({ page }) => {
        const panel = await open(page, { 'POST /documents': (route: Route) => route.fulfill({ status: 500, json: { success: false, message: 'Fallo interno' } }) });
        await fillRequired(panel);
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expect(panel.getByRole('alert')).toContainText('Fallo interno');
        await expect(page.getByText('Error en Servidor (500)')).toBeVisible();
        await expect(panel).toBeVisible();
    });

    test('while saving, the footer is disabled, it cannot be closed and it does not send twice', async ({ page }) => {
        let posts = 0;
        let release = () => {};
        const held = new Promise<void>((resolve) => { release = resolve; });
        const panel = await open(page, { 'POST /documents': async (route: Route) => { posts++; await held; return route.fulfill({ json: ok({}) }); } });
        await fillRequired(panel);
        await panel.getByLabel('Título').press('Enter');
        await expect(panel.getByRole('button', { name: 'Guardar' })).toBeDisabled();
        await expect(panel.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
        await panel.getByLabel('Título').press('Enter');
        await page.keyboard.press('Escape');
        await expect(panel).toBeVisible();
        await expect(page.getByText(DISCARD_MESSAGE)).toHaveCount(0);
        release();
        await expect(panel).toHaveCount(0);
        expect(posts).toBe(1);
    });

    test('with changes, every way of closing asks first; without changes it closes directly', async ({ page }) => {
        const panel = await open(page);
        const confirm = page.getByRole('dialog', { name: 'Cambios sin guardar' });

        // Untouched: Cancelar closes directly.
        await panel.getByRole('button', { name: 'Cancelar' }).click();
        await expect(panel).toHaveCount(0);
        await expect(confirm).toHaveCount(0);

        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        await panel.getByLabel('Título').fill('Borrador');

        // Cancelar asks; "Seguir editando" keeps what was typed.
        await panel.getByRole('button', { name: 'Cancelar' }).click();
        await expect(confirm.getByText(DISCARD_MESSAGE)).toBeVisible();
        await confirm.getByRole('button', { name: 'Seguir editando' }).click();
        await expect(confirm).toHaveCount(0);
        await expect(panel.getByLabel('Título')).toHaveValue('Borrador');

        // Escape asks, and a second Escape acts on the confirmation, not on the panel.
        await page.keyboard.press('Escape');
        await expect(confirm).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(confirm).toHaveCount(0);
        await expect(panel.getByLabel('Título')).toHaveValue('Borrador');

        // The X asks.
        await panel.getByRole('button', { name: 'Cerrar' }).click();
        await expect(confirm).toBeVisible();
        await confirm.getByRole('button', { name: 'Seguir editando' }).click();

        // A click on the backdrop asks; "Descartar" closes.
        await page.mouse.click(10, 300);
        await expect(confirm).toBeVisible();
        await confirm.getByRole('button', { name: 'Descartar' }).click();
        await expect(confirm).toHaveCount(0);
        await expect(panel).toHaveCount(0);

        // Reopened, it starts clean.
        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        await expect(panel.getByLabel('Título')).toHaveValue('');
        await page.keyboard.press('Escape');
        await expect(panel).toHaveCount(0);
        await expect(confirm).toHaveCount(0);
    });

    test('Ampliar and Reducir switch between the normal width and the full screen', async ({ page }) => {
        const panel = await open(page);
        const view = page.viewportSize()!;
        const width = async () => Math.round((await panel.boundingBox())!.width);
        const normal = await width();
        expect(normal).toBeLessThan(view.width);

        await panel.getByRole('button', { name: 'Ampliar' }).click();
        await expect(panel.getByRole('button', { name: 'Reducir' })).toBeVisible();
        await expect(panel.getByRole('button', { name: 'Ampliar' })).toHaveCount(0);
        expect(await width()).toBe(view.width);

        await panel.getByRole('button', { name: 'Reducir' }).click();
        await expect(panel.getByRole('button', { name: 'Ampliar' })).toBeVisible();
        expect(await width()).toBe(normal);
    });
});

test.describe('phone width', () => {
    test.use({ viewport: { width: 375, height: 700 } });

    test('the panel fills the screen without horizontal scroll and its footer stays in view', async ({ page }) => {
        const panel = await open(page);
        await expect.poll(async () => (await panel.boundingBox())!.x).toBe(0);
        const box = (await panel.boundingBox())!;
        expect(box.width).toBe(375);
        expect(box.height).toBe(700);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        await expect(panel.getByRole('button', { name: 'Guardar' })).toBeInViewport();
        await expect(panel.getByRole('button', { name: 'Cancelar' })).toBeInViewport();
    });
});
