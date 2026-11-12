import { expect, test, type Page, type Route } from '@playwright/test';
import { CLASSIFICATION_TREE, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const BASE = ['menu.documents', 'menu.documents.master_list'];
const VIEW = [...BASE, 'menu.documents.classification'];
const MANAGE = [...VIEW, 'menu.documents.classification.manage'];
const TREE = 'GET /document-classification';
const NODES = 'POST /document-classification/nodes';
const NOTICE = 'Los tiempos los define la entidad. DevManager no valida su cumplimiento legal.';

const json = (status: number, message: string) => (route: Route) => route.fulfill({ status, json: { success: false, message } });

/** Records the body of each call so a test can assert what the screen really sent. */
const recorder = (status = 200) => {
    const bodies: unknown[] = [];
    const handler = (route: Route) => {
        bodies.push(route.request().postDataJSON());
        return route.fulfill({ status, json: ok({ id: 'new' }) });
    };
    return { bodies, handler };
};

/** The list item of one node: the deepest one that shows that code. */
const nodeItem = (page: Page, code: string) => page.getByRole('main').getByRole('listitem').filter({ has: page.getByText(code, { exact: true }) }).last();

const open = async (page: Page, permissions: string[], overrides: Record<string, unknown> = {}) => {
    await mockApi(page, { permissions }, { [TREE]: ok(CLASSIFICATION_TREE), ...overrides });
    await signIn(page);
    await page.goto('/#/cuadro-clasificacion');
    await expect(page.getByRole('heading', { name: 'Cuadro de clasificación', level: 1 })).toBeVisible();
};

test.describe('classification chart', () => {
    test('the menu entry and its route need menu.documents.classification', async ({ page }) => {
        const menu = page.getByRole('navigation', { name: 'Menú principal' }).first();
        await open(page, VIEW);
        await expect(menu.getByRole('link', { name: 'Cuadro de clasificación', exact: true })).toHaveAttribute('aria-current', 'page');

        await mockApi(page, { permissions: BASE });
        await page.reload();
        await expect(page).toHaveURL(/#\/gestion-documental$/);
        await expect(menu.getByRole('link', { name: 'Cuadro de clasificación', exact: true })).toHaveCount(0);
    });

    test('shows the tree with the retention that applies, the types and the legal notice', async ({ page }) => {
        await open(page, VIEW);
        await expect(page.getByText(NOTICE)).toBeVisible();
        await expect(nodeItem(page, 'ADM')).toContainText('=Administración');
        await expect(nodeItem(page, 'ACT')).toContainText('Gestión 2 años · Central 8 años · Eliminación');
        await expect(nodeItem(page, 'ACT')).toContainText('Acta de asamblea');
        await expect(nodeItem(page, 'ACT')).toContainText('Citación');
        await expect(nodeItem(page, 'ACT-01')).toContainText('Gestión 2 años · Central 8 años · Eliminación');
        await expect(nodeItem(page, 'ACT-01')).toContainText('Heredada de la serie');
        await expect(nodeItem(page, 'ACT-02')).toContainText('Gestión 1 año · Central 0 años · Conservación total');
        await expect(nodeItem(page, 'ACT-02')).toContainText('Inactiva');
        await expect(nodeItem(page, 'ACT-02')).not.toContainText('Heredada de la serie');
        await expect(nodeItem(page, 'CON')).toContainText('Sin retención definida');
        await expect(nodeItem(page, 'FIN')).toContainText('Inactiva');
    });

    test('without .manage it only reads and exports', async ({ page }) => {
        await open(page, VIEW);
        await expect(nodeItem(page, 'ACT')).toBeVisible();
        for (const name of ['Nueva sección', 'Editar ACT', 'Nueva serie en ADM', 'Nueva subserie en ACT', 'Agregar tipo a ACT', 'Quitar tipo Citación de ACT']) {
            await expect(page.getByRole('button', { name })).toHaveCount(0);
        }
        await expect(page.getByRole('button', { name: 'Exportar' })).toBeEnabled();
    });

    test('shows its empty and error states', async ({ page }) => {
        await open(page, MANAGE, { [TREE]: ok([]) });
        await expect(page.getByText('Aún no hay cuadro de clasificación')).toBeVisible();
        await expect(page.getByText(NOTICE)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nueva sección' })).toBeVisible();

        await mockApi(page, { permissions: VIEW }, { [TREE]: json(500, 'Fallo') });
        await page.reload();
        await expect(page.getByText('No se pudo cargar el cuadro de clasificación')).toBeVisible();
    });

    test('creates a section without retention and a series with it, then reloads the tree', async ({ page }) => {
        const created = recorder(201);
        let loads = 0;
        await open(page, MANAGE, {
            [TREE]: (route: Route) => { loads++; return route.fulfill({ json: ok(CLASSIFICATION_TREE) }); },
            [NODES]: created.handler,
        });
        const dialog = page.getByRole('dialog');

        await page.getByRole('button', { name: 'Nueva sección' }).click();
        await expect(dialog.getByLabel('Disposición final')).toHaveCount(0);
        await dialog.getByLabel('Código').fill('th');
        await dialog.getByLabel('Nombre').fill('Talento humano');
        const before = loads;
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(created.bodies[0]).toEqual({ level: 1, parentId: null, code: 'th', name: 'Talento humano', isActive: true });
        await expect.poll(() => loads).toBeGreaterThan(before);

        await page.getByRole('button', { name: 'Nueva serie en ADM' }).click();
        await dialog.getByLabel('Código').fill('NOM');
        await dialog.getByLabel('Nombre').fill('Nómina');
        await dialog.getByLabel('Tiempo en gestión (años)').fill('2');
        await dialog.getByLabel('Tiempo en central (años)').fill('8');
        await dialog.getByLabel('Disposición final').selectOption({ label: 'Eliminación' });
        await dialog.getByLabel('Procedimiento').fill('Picar el papel');
        await dialog.getByLabel('Soporte legal').fill('Acuerdo 01');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(created.bodies[1]).toEqual({
            level: 2, parentId: 's1', code: 'NOM', name: 'Nómina', isActive: true,
            managementYears: 2, centralYears: 8, finalDisposition: 2, procedure: 'Picar el papel', legalBasis: 'Acuerdo 01',
        });

        await page.getByRole('button', { name: 'Nueva subserie en ACT' }).click();
        await dialog.getByLabel('Código').fill('ACT-03');
        await dialog.getByLabel('Nombre').fill('Actas de comité');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(created.bodies[2]).toEqual({
            level: 3, parentId: 'n1', code: 'ACT-03', name: 'Actas de comité', isActive: true,
            managementYears: null, centralYears: null, finalDisposition: null, procedure: null, legalBasis: null,
        });
    });

    test('editing always sends the whole node, with its own retention and not the inherited one', async ({ page }) => {
        const series = recorder();
        const subseries = recorder();
        await open(page, MANAGE, {
            'PUT /document-classification/nodes/n1': series.handler,
            'PUT /document-classification/nodes/n2': subseries.handler,
        });
        const dialog = page.getByRole('dialog');

        await page.getByRole('button', { name: 'Editar ACT', exact: true }).click();
        await expect(dialog.getByLabel('Tiempo en gestión (años)')).toHaveValue('2');
        await dialog.getByLabel('Nombre').fill('Actas y acuerdos');
        await dialog.getByLabel('Activo').uncheck();
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(series.bodies[0]).toEqual({
            code: 'ACT', name: 'Actas y acuerdos', isActive: false,
            managementYears: 2, centralYears: 8, finalDisposition: 2, procedure: 'Microfilmar', legalBasis: 'Acuerdo interno 01',
        });

        await page.getByRole('button', { name: 'Editar ACT-01' }).click();
        await expect(dialog.getByLabel('Tiempo en gestión (años)')).toHaveValue('');
        await expect(dialog.getByText('Si no indicas retención, hereda la de su serie.')).toBeVisible();
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(subseries.bodies[0]).toEqual({
            code: 'ACT-01', name: 'Actas de junta', isActive: true,
            managementYears: null, centralYears: null, finalDisposition: null, procedure: null, legalBasis: null,
        });
    });

    test('an API error keeps the form open with the message as the API sent it', async ({ page }) => {
        await open(page, MANAGE, {
            [NODES]: json(409, 'Ya existe un elemento con ese código en este nivel'),
            'PUT /document-classification/nodes/n1': json(409, 'Desactive primero sus series o subseries'),
        });
        const dialog = page.getByRole('dialog');

        await page.getByRole('button', { name: 'Nueva sección' }).click();
        await dialog.getByLabel('Código').fill('ADM');
        await dialog.getByLabel('Nombre').fill('Otra');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Ya existe un elemento con ese código en este nivel')).toBeVisible();
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Cancelar' }).click();

        await page.getByRole('button', { name: 'Editar ACT', exact: true }).click();
        await dialog.getByLabel('Activo').uncheck();
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Desactive primero sus series o subseries')).toBeVisible();
        await expect(dialog).toBeVisible();
    });

    test('adds and removes document types of a series', async ({ page }) => {
        const added = recorder(201);
        const removed: string[] = [];
        await open(page, MANAGE, {
            'POST /document-classification/nodes/n1/types': added.handler,
            'POST /document-classification/nodes/n4/types': json(409, 'Ese tipo documental ya existe en la serie'),
            'DELETE /document-classification/nodes/n1/types/t2': (route: Route, url: URL) => { removed.push(url.pathname); return route.fulfill({ json: ok(null) }); },
        });
        const dialog = page.getByRole('dialog');
        // Types belong to a series or subseries, never to a section.
        await expect(page.getByRole('button', { name: 'Agregar tipo a ADM' })).toHaveCount(0);

        await page.getByRole('button', { name: 'Agregar tipo a ACT', exact: true }).click();
        await dialog.getByLabel('Nombre').fill('Convocatoria');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(added.bodies[0]).toEqual({ name: 'Convocatoria' });

        await page.getByRole('button', { name: 'Agregar tipo a CON' }).click();
        await dialog.getByLabel('Nombre').fill('Contrato');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Ese tipo documental ya existe en la serie')).toBeVisible();
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Cancelar' }).click();

        await page.getByRole('button', { name: 'Quitar tipo Citación de ACT' }).click();
        await expect.poll(() => removed).toEqual(['/api/document-classification/nodes/n1/types/t2']);
    });

    test('exports the retention table with its columns and neutralizes formulas', async ({ page }) => {
        await open(page, VIEW);
        await expect(nodeItem(page, 'ACT')).toBeVisible();
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()]);
        expect(download.suggestedFilename()).toMatch(/^cuadro-clasificacion-\d{4}-\d{2}-\d{2}\.csv$/);
        const lines = (await (await download.createReadStream()).toArray()).join('').replace(/^﻿/, '').split('\r\n');
        expect(lines).toEqual([
            'Código;Sección;Serie;Subserie;Tipos documentales;Gestión;Central;Disposición;Procedimiento;Soporte legal',
            "ADM;'=Administración;;;;;;;;",
            "ACT;'=Administración;Actas;;Acta de asamblea, Citación;2;8;Eliminación;Microfilmar;Acuerdo interno 01",
            "ACT-01;'=Administración;Actas;Actas de junta;;2;8;Eliminación;Microfilmar;Acuerdo interno 01",
            "ACT-02;'=Administración;Actas;Actas antiguas;;1;0;Conservación total;;",
            "CON;'=Administración;Contratos;;;;;;;",
            'FIN;Finanzas;;;;;;;;',
        ]);
    });
});

test.describe('phone width', () => {
    test.use({ viewport: { width: 375, height: 700 } });

    test('the chart and its form fit without horizontal scroll', async ({ page }) => {
        await open(page, MANAGE);
        await expect(nodeItem(page, 'ACT-01')).toBeVisible();
        const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(await noSideScroll()).toBe(true);
        await page.getByRole('button', { name: 'Editar ACT', exact: true }).click();
        await expect(page.getByRole('dialog').getByLabel('Soporte legal')).toBeVisible();
        expect(await noSideScroll()).toBe(true);
    });
});
