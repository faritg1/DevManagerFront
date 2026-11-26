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
                ? route.fulfill({ status: 400, json: { success: false, message: 'Ya existe un documento con ese código', errors: { Code: ['El código ya está en uso'] } } })
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
