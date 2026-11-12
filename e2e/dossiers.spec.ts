import { expect, test, type Download, type Page, type Route } from '@playwright/test';
import { CLASSIFICATION_TREE, CLOSED_DOSSIER, dossier, dossierDetail, dossierItem, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const VIEW = ['menu.documents', 'menu.documents.master_list', 'menu.documents.dossiers'];
const MANAGE = [...VIEW, 'menu.documents.dossiers.manage'];
const CHART = 'menu.documents.classification';
const LIST = 'GET /dossiers';
const ONE = 'GET /dossiers/x1';
const TREE = 'GET /document-classification';
const USERS = [
    { id: 'u1', firstName: 'Ana', lastName: 'López', email: 'ana@coop.co', isActive: true },
    { id: 'u2', firstName: 'Beto', lastName: 'Ruiz', email: 'beto@coop.co', isActive: true },
    { id: 'u3', firstName: 'Dora', lastName: 'Inactiva', email: 'dora@coop.co', isActive: false },
];
const IMPERSONATING = {
    impersonator_token: 'root-token',
    impersonator_user: '{}',
    impersonation: JSON.stringify({ targetName: 'Ana López', organizationName: 'Cooperativa Demo', expiresAt: '2030-01-01T00:00:00Z' }),
};

const json = (status: number, message: string) => (route: Route) => route.fulfill({ status, json: { success: false, message } });

/** Records each call so a test can assert what the screen really sent. */
const recorder = (body: unknown = dossierDetail(), status = 200) => {
    const calls: { body: string; headers: Record<string, string> }[] = [];
    const handler = (route: Route) => {
        calls.push({ body: route.request().postDataBuffer()?.toString('utf8') ?? '', headers: route.request().headers() });
        return route.fulfill({ status, json: ok(body) });
    };
    return { calls, handler };
};

const csvLines = async (download: Download) => (await (await download.createReadStream()).toArray()).join('').replace(/^﻿/, '').split('\r\n');

const openList = async (page: Page, query = '') => {
    await signIn(page);
    await page.goto(`/#/expedientes${query}`);
    await expect(page.getByRole('heading', { name: 'Expedientes', level: 1 })).toBeVisible();
};

const openDetail = async (page: Page, query = '') => {
    await signIn(page);
    await page.goto(`/#/expedientes/x1${query}`);
    await expect(page.getByRole('heading', { name: /EXP-ACT-001/, level: 1 })).toBeVisible();
};

const facts = (page: Page) => page.getByRole('main').getByRole('definition');
const pdf = (name: string, buffer = Buffer.from('%PDF-1.7')) => ({ name, mimeType: 'application/pdf', buffer });

test.describe('dossier list', () => {
    test('the menu entry and both routes need menu.documents.dossiers', async ({ page }) => {
        const menu = page.getByRole('navigation', { name: 'Menú principal' }).first();
        await mockApi(page, { permissions: VIEW }, { [LIST]: ok([dossier()]), [ONE]: ok(dossierDetail()) });
        await openList(page);
        await expect(menu.getByRole('link', { name: 'Expedientes', exact: true })).toHaveAttribute('aria-current', 'page');
        await expect(menu.getByRole('link', { name: 'Listado maestro', exact: true })).not.toHaveAttribute('aria-current', 'page');

        await mockApi(page, { permissions: VIEW.slice(0, 2) }, { [LIST]: ok([dossier()]), [ONE]: ok(dossierDetail()) });
        await page.reload();
        await expect(menu.getByRole('link', { name: 'Listado maestro', exact: true })).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Expedientes', exact: true })).toHaveCount(0);
        await expect(page).not.toHaveURL(/expedientes/);
        await page.goto('/#/expedientes/x1');
        await expect(page).not.toHaveURL(/expedientes/);
    });

    test('shows each dossier with its series, status and stage, and filters on the server', async ({ page }) => {
        const queries: string[] = [];
        const closed = dossier({ ...CLOSED_DOSSIER, id: 'x2', code: 'EXP-ACT-002', title: 'Actas de junta 2025', subseriesCode: null, subseriesName: null, physicalLocation: null });
        await mockApi(page, { permissions: [...VIEW, CHART] }, {
            [LIST]: (route: Route, url: URL) => { queries.push(url.searchParams.toString()); return route.fulfill({ json: ok([dossier(), closed]) }); },
            [TREE]: ok(CLASSIFICATION_TREE),
        });
        await openList(page);
        const open = page.getByRole('row').filter({ hasText: 'EXP-ACT-001' });
        await expect(open.getByRole('link', { name: 'EXP-ACT-001' })).toHaveAttribute('href', '#/expedientes/x1');
        await expect(open).toContainText('Actas de junta 2026');
        await expect(open).toContainText('ACT / ACT-01 · Actas de junta');
        await expect(open).toContainText('Beto Ruiz');
        await expect(open).toContainText('Abierto');
        const shut = page.getByRole('row').filter({ hasText: 'EXP-ACT-002' });
        await expect(shut).toContainText('ACT · Actas');
        await expect(shut).toContainText('Cerrado');
        await expect(shut).toContainText('Gestión hasta 01/04/2028');
        // Without filters the list is asked for with no query at all.
        expect(queries.filter(Boolean)).toEqual([]);

        await page.getByRole('textbox', { name: 'Buscar', exact: true }).fill('junta');
        await page.getByLabel('Serie').selectOption({ label: 'ACT / ACT-01 · Actas de junta' });
        await page.getByLabel('Estado').selectOption({ label: 'Cerrado' });
        await expect.poll(() => queries.at(-1)).toBe('q=junta&series=n2&status=Closed');
    });

    test('names the stage of a closed dossier with its next date', async ({ page }) => {
        await mockApi(page, { permissions: VIEW }, {
            [LIST]: ok([
                dossier({ ...CLOSED_DOSSIER, id: 'a', code: 'EXP-A', stage: 'Central' }),
                dossier({ ...CLOSED_DOSSIER, id: 'b', code: 'EXP-B', stage: 'FinalDispositionPending' }),
            ]),
        });
        await openList(page);
        await expect(page.getByRole('row').filter({ hasText: 'EXP-A' })).toContainText('Central hasta 01/04/2036');
        await expect(page.getByRole('row').filter({ hasText: 'EXP-B' })).toContainText('Disposición final pendiente: Eliminación');
    });

    test('`?estado=` opens the list already filtered', async ({ page }) => {
        const queries: string[] = [];
        await mockApi(page, { permissions: VIEW }, {
            [LIST]: (route: Route, url: URL) => { queries.push(url.searchParams.toString()); return route.fulfill({ json: ok([]) }); },
        });
        await openList(page, '?estado=Closed');
        await expect(page.getByLabel('Estado')).toHaveValue('Closed');
        await expect(page.getByText('Sin expedientes con este filtro')).toBeVisible();
        expect(new Set(queries)).toEqual(new Set(['status=Closed']));
    });

    test('shows empty and error states, and only reads without .manage', async ({ page }) => {
        await mockApi(page, { permissions: VIEW }, { [LIST]: ok([dossier()]), [TREE]: ok(CLASSIFICATION_TREE) });
        await openList(page);
        await expect(page.getByRole('link', { name: 'EXP-ACT-001' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nuevo expediente' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Editar EXP-ACT-001' })).toHaveCount(0);
        // The series filter comes from the chart, which the dossiers permission also reads.
        await expect(page.getByLabel('Serie').getByRole('option', { name: 'CON · Contratos' })).toBeAttached();

        await mockApi(page, { permissions: VIEW }, { [LIST]: ok([]) });
        await page.reload();
        await expect(page.getByText('Aún no hay expedientes')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Inventario de expedientes' })).toBeDisabled();

        await mockApi(page, { permissions: VIEW }, { [LIST]: json(500, 'Fallo') });
        await page.reload();
        await expect(page.getByText('No se pudieron cargar los expedientes')).toBeVisible();
    });

    test('exports the inventory with its columns and neutralizes formulas', async ({ page }) => {
        await mockApi(page, { permissions: VIEW }, {
            [LIST]: ok([
                dossier({ title: '=Actas de junta 2026' }),
                dossier({ ...CLOSED_DOSSIER, id: 'x2', code: 'EXP-CON-001', title: 'Contratos', seriesCode: 'CON', seriesName: 'Contratos', subseriesCode: null, subseriesName: null, physicalLocation: null, stage: 'Central' }),
                dossier({ id: 'x3', code: 'EXP-VAC-001', title: 'Vacío', itemCount: 0, firstDocumentDate: null, lastDocumentDate: null }),
            ]),
        });
        await openList(page);
        await expect(page.getByRole('link', { name: 'EXP-ACT-001' })).toBeVisible();
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Inventario de expedientes' }).click()]);
        expect(download.suggestedFilename()).toMatch(/^inventario-expedientes-\d{4}-\d{2}-\d{2}\.csv$/);
        expect(await csvLines(download)).toEqual([
            'Código;Título;Sección;Serie;Subserie;Fecha inicial;Fecha final;Documentos;Estado;Etapa;Ubicación física;Gestión hasta;Central hasta;Disposición',
            "EXP-ACT-001;'=Actas de junta 2026;ADM · Administración;ACT · Actas;ACT-01 · Actas de junta;15/01/2026;02/03/2026;2;Abierto;;Estante 2, caja 4;;;",
            'EXP-CON-001;Contratos;ADM · Administración;CON · Contratos;;15/01/2026;02/03/2026;2;Cerrado;Central;;01/04/2028;01/04/2036;Eliminación',
            'EXP-VAC-001;Vacío;ADM · Administración;ACT · Actas;ACT-01 · Actas de junta;;;0;Abierto;;Estante 2, caja 4;;;',
        ]);
    });

    test('the screens name the reports as internal ones and claim no legal validity', async ({ page }) => {
        await mockApi(page, { permissions: MANAGE }, { [LIST]: ok([dossier()]), [ONE]: ok(dossierDetail()) });
        await openList(page);
        await expect(page.getByRole('link', { name: 'EXP-ACT-001' })).toBeVisible();
        await expect(page.getByRole('main')).not.toContainText(/FUID|índice electrónico|AGN|validez legal/i);
        await page.goto('/#/expedientes/x1');
        await expect(page.getByRole('button', { name: 'Índice del expediente' })).toBeVisible();
        await expect(page.getByRole('main')).not.toContainText(/FUID|índice electrónico|AGN|validez legal/i);
    });

    test('creates with .manage alone, and a repeated code keeps the form open', async ({ page }) => {
        const created = recorder(dossierDetail(), 201);
        // No chart permission: the dossiers one reads the series.
        await mockApi(page, { permissions: MANAGE }, {
            [LIST]: ok([dossier()]), [TREE]: ok(CLASSIFICATION_TREE), 'GET /users': ok(USERS), 'POST /dossiers': created.handler,
        });
        await openList(page);
        await page.getByRole('button', { name: 'Nuevo expediente' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('option', { name: 'Dora Inactiva' })).toHaveCount(0);
        // Only active series and subseries can hold a dossier.
        await expect(dialog.getByLabel('Serie').getByRole('option')).toHaveText(['Selecciona una serie', 'ACT · Actas', 'ACT / ACT-01 · Actas de junta', 'CON · Contratos']);
        await dialog.getByLabel('Código').fill('exp-con-001');
        await dialog.getByLabel('Título').fill('Contratos 2026');
        await dialog.getByLabel('Serie').selectOption('n4');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByLabel('Fecha de apertura').fill('2026-02-01');
        await dialog.getByLabel('Ubicación física').fill('Caja 7');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Expediente creado')).toBeVisible();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(created.calls[0].body)).toEqual({
            code: 'exp-con-001', title: 'Contratos 2026', classificationNodeId: 'n4', ownerUserId: 'u1', openedOn: '2026-02-01', physicalLocation: 'Caja 7',
        });

        await mockApi(page, { permissions: [...MANAGE, CHART] }, {
            [LIST]: ok([dossier()]), [TREE]: ok(CLASSIFICATION_TREE), 'GET /users': ok(USERS), 'POST /dossiers': json(409, 'Ya existe un expediente con ese código'),
        });
        await page.getByRole('button', { name: 'Nuevo expediente' }).click();
        await dialog.getByLabel('Código').fill('EXP-ACT-001');
        await dialog.getByLabel('Título').fill('Repetido');
        await dialog.getByLabel('Serie').selectOption('n4');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByLabel('Fecha de apertura').fill('2026-02-01');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Ya existe un expediente con ese código')).toBeVisible();
        await expect(dialog.getByLabel('Título')).toHaveValue('Repetido');
    });

    test('edits title, owner and location, never the code or the series', async ({ page }) => {
        const updated = recorder();
        await mockApi(page, { permissions: MANAGE }, {
            [LIST]: ok([dossier()]), [TREE]: ok(CLASSIFICATION_TREE), 'GET /users': ok(USERS), 'PUT /dossiers/x1': updated.handler,
        });
        await openList(page);

        await page.getByRole('button', { name: 'Editar EXP-ACT-001' }).click();
        const dialog = page.getByRole('dialog');
        // Code and series never change after creation.
        await expect(dialog.getByLabel('Código')).toBeDisabled();
        await expect(dialog.getByLabel('Serie')).toBeDisabled();
        await expect(dialog.getByLabel('Serie')).toHaveValue('ACT / ACT-01 · Actas de junta');
        await dialog.getByLabel('Título').fill('Actas de junta directiva 2026');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByLabel('Ubicación física').fill('');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Expediente actualizado')).toBeVisible();
        expect(JSON.parse(updated.calls[0].body)).toEqual({ title: 'Actas de junta directiva 2026', ownerUserId: 'u1', openedOn: '2026-01-10', physicalLocation: null });
    });
});

test.describe('dossier detail', () => {
    test('an open dossier shows its data, the retention of its series and its documents; the base code only reads', async ({ page }) => {
        const downloads: Record<string, string>[] = [];
        await mockApi(page, { permissions: VIEW }, {
            [ONE]: ok(dossierDetail()),
            'GET /dossiers/x1/items/i1/file': (route: Route) => {
                downloads.push(route.request().headers());
                return route.fulfill({ body: 'pdf-bytes', contentType: 'application/pdf' });
            },
        });
        await openDetail(page);
        await expect(page.getByRole('heading', { name: 'EXP-ACT-001 · Actas de junta 2026', level: 1 })).toBeVisible();
        for (const text of ['ADM · Administración', 'ACT · Actas', 'ACT-01 · Actas de junta', 'Beto Ruiz', 'Estante 2, caja 4', 'Abierto']) {
            await expect(facts(page).filter({ hasText: text }).first()).toBeVisible();
        }
        await expect(facts(page).filter({ hasText: 'Gestión 2 años · Central 8 años · Eliminación' })).toContainText('Heredada de la serie');

        const items = page.getByRole('list', { name: 'Documentos del expediente' }).getByRole('listitem');
        await expect(items).toHaveCount(2);
        await expect(items.nth(0)).toContainText('1. Acta 001');
        await expect(items.nth(0)).toContainText('Acta de asamblea');
        await expect(items.nth(0)).toContainText('acta 001.pdf · 2 MB');
        await expect(items.nth(0)).toContainText('Incorporó Beto Ruiz');
        await expect(items.nth(1)).toContainText('2. =Citación');

        for (const name of ['Incorporar documento', 'Cerrar expediente', 'Editar', 'Corregir documento 1']) {
            await expect(page.getByRole('button', { name })).toHaveCount(0);
        }
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar documento 1' }).click()]);
        expect(download.suggestedFilename()).toBe('acta 001.pdf');
        expect(downloads[0].authorization).toBe('Bearer test-token');
    });

    test('a closed dossier shows its stage and dates and admits no more changes to its documents', async ({ page }) => {
        await mockApi(page, { permissions: MANAGE }, { [ONE]: ok(dossierDetail({ ...CLOSED_DOSSIER, closedByName: 'Carla Díaz' })) });
        await openDetail(page);
        const fact = (label: string) => page.getByRole('main').locator('dl > div').filter({ has: page.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) }) }).getByRole('definition');
        await expect(fact('Estado')).toHaveText('Cerrado');
        await expect(fact('Etapa')).toHaveText('Gestión');
        await expect(fact('Fecha de cierre')).toHaveText('01/04/2026');
        await expect(fact('Cerrado por')).toHaveText('Carla Díaz');
        await expect(fact('Gestión hasta')).toHaveText('01/04/2028');
        await expect(fact('Central hasta')).toHaveText('01/04/2036');
        await expect(fact('Disposición final')).toHaveText('Eliminación');

        await expect(page.getByRole('button', { name: 'Descargar documento 1' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Editar', exact: true })).toBeVisible();
        for (const name of ['Incorporar documento', 'Cerrar expediente', 'Corregir documento 1']) {
            await expect(page.getByRole('button', { name })).toHaveCount(0);
        }
    });

    test('the stage of a closed dossier is named as the spec does', async ({ page }) => {
        for (const [stage, label] of [['Central', 'Central'], ['FinalDispositionPending', 'Disposición final pendiente']]) {
            await mockApi(page, { permissions: VIEW }, { [ONE]: ok(dossierDetail({ ...CLOSED_DOSSIER, stage })) });
            await openDetail(page);
            await page.reload(); // the second round is the same URL: only a reload asks the API again
            await expect(facts(page).filter({ hasText: new RegExp(`^${label}$`) })).toHaveCount(1);
        }
    });

    test('a closed dossier only lets its owner and physical location change', async ({ page }) => {
        const updated = recorder();
        await mockApi(page, { permissions: MANAGE }, {
            [ONE]: ok(dossierDetail(CLOSED_DOSSIER)), 'GET /users': ok(USERS), 'PUT /dossiers/x1': updated.handler,
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Editar', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Título')).toBeDisabled();
        await expect(dialog.getByLabel('Fecha de apertura')).toBeDisabled();
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByLabel('Ubicación física').fill('Archivo central, caja 12');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Expediente actualizado')).toBeVisible();
        expect(JSON.parse(updated.calls[0].body)).toEqual({
            title: 'Actas de junta 2026', ownerUserId: 'u1', openedOn: '2026-01-10', physicalLocation: 'Archivo central, caja 12',
        });
    });

    test('a missing dossier and a missing file show their own message', async ({ page }) => {
        await mockApi(page, { permissions: VIEW }, {
            [ONE]: ok(dossierDetail()),
            'GET /dossiers/x1/items/i1/file': json(404, 'El archivo no está disponible'),
            'GET /dossiers/x9': json(404, 'El expediente no existe'),
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Descargar documento 1' }).click();
        await expect(page.getByText('El archivo no está disponible')).toBeVisible();

        await page.goto('/#/expedientes/x9');
        await expect(page.getByText('Expediente no encontrado')).toBeVisible();
    });

    test('the link of a retention notice opens the dossier', async ({ page }) => {
        await mockApi(page, { permissions: VIEW }, { [ONE]: ok(dossierDetail(CLOSED_DOSSIER)) });
        await openDetail(page, '?alerta=transferencia-proxima&fecha=2028-04-01');
        await expect(facts(page).filter({ hasText: '01/04/2028' })).toHaveCount(1);
    });

    test('incorporates a document as multipart, validating the file first', async ({ page }) => {
        const added = recorder(dossierItem({ id: 'i3', position: 3 }), 201);
        // No chart permission: the dossiers one reads the types.
        await mockApi(page, { permissions: MANAGE }, {
            [ONE]: ok(dossierDetail()), [TREE]: ok(CLASSIFICATION_TREE), 'POST /dossiers/x1/items': added.handler,
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Incorporar documento' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Archivo')).toHaveAttribute('accept', '.pdf,.docx,.xlsx,.png,.jpg,.jpeg');
        // A subseries offers its own types and those of its parent series.
        await expect(dialog.getByLabel('Tipo documental').getByRole('option')).toHaveText(['Sin tipo', 'Acta de asamblea', 'Citación']);

        await dialog.getByLabel('Título').fill('Acta 003');
        await dialog.getByLabel('Tipo documental').selectOption('t2');
        await dialog.getByLabel('Fecha del documento').fill('2026-05-20');
        await dialog.getByLabel('Archivo').setInputFiles({ name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') });
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog.getByText('Solo se admiten archivos PDF, DOCX, XLSX, PNG y JPG')).toBeVisible();

        await dialog.getByLabel('Archivo').setInputFiles(pdf('vacio.pdf', Buffer.alloc(0)));
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog.getByText('El archivo está vacío')).toBeVisible();

        await dialog.getByLabel('Archivo').setInputFiles(pdf('grande.pdf', Buffer.alloc(20 * 1024 * 1024 + 1)));
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog.getByText('El archivo supera el tamaño máximo de 20 MB')).toBeVisible();
        expect(added.calls).toHaveLength(0);

        await dialog.getByLabel('Archivo').setInputFiles(pdf('acta 003.pdf'));
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Documento incorporado')).toBeVisible();
        await expect(dialog).toHaveCount(0);
        const { body, headers } = added.calls[0];
        expect(headers['content-type']).toContain('multipart/form-data; boundary=');
        expect(body).toMatch(/name="title"\r\n\r\nActa 003\r\n/);
        expect(body).toMatch(/name="documentDate"\r\n\r\n2026-05-20\r\n/);
        expect(body).toMatch(/name="documentaryTypeId"\r\n\r\nt2\r\n/);
        expect(body).toContain('name="file"; filename="acta 003.pdf"');
    });

    test('an incorporation the API refuses keeps the form open with its message', async ({ page }) => {
        await mockApi(page, { permissions: MANAGE }, { [ONE]: ok(dossierDetail()), 'POST /dossiers/x1/items': json(409, 'El expediente está cerrado') });
        await openDetail(page);
        await page.getByRole('button', { name: 'Incorporar documento' }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel('Título').fill('Acta 003');
        await dialog.getByLabel('Fecha del documento').fill('2026-05-20');
        await dialog.getByLabel('Archivo').setInputFiles(pdf('acta 003.pdf'));
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('El expediente está cerrado')).toBeVisible();
        await expect(dialog.getByLabel('Título')).toHaveValue('Acta 003');
    });

    test('corrects the title, type and date of a document, always sending the three', async ({ page }) => {
        const corrected = recorder(dossierItem());
        await mockApi(page, { permissions: [...MANAGE, CHART] }, {
            [ONE]: ok(dossierDetail()), [TREE]: ok(CLASSIFICATION_TREE), 'PUT /dossiers/x1/items/i1': corrected.handler,
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Corregir documento 1' }).click();
        const dialog = page.getByRole('dialog', { name: 'Corregir documento 1' });
        // The file of a document is never replaced.
        await expect(dialog.getByLabel('Archivo')).toHaveCount(0);
        await expect(dialog.getByLabel('Tipo documental')).toHaveValue('t1');
        await dialog.getByLabel('Título').fill('Acta 001 corregida');
        await dialog.getByLabel('Tipo documental').selectOption('');
        await dialog.getByLabel('Fecha del documento').fill('2026-01-20');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Documento corregido')).toBeVisible();
        expect(JSON.parse(corrected.calls[0].body)).toEqual({ title: 'Acta 001 corregida', documentaryTypeId: null, documentDate: '2026-01-20' });
    });

    test('closes after a confirmation that says it cannot be undone, and reloads', async ({ page }) => {
        const closed = recorder(dossierDetail(CLOSED_DOSSIER));
        let current = dossierDetail();
        await mockApi(page, { permissions: MANAGE }, {
            [ONE]: (route: Route) => route.fulfill({ json: ok(current) }),
            'POST /dossiers/x1/close': (route: Route) => { current = dossierDetail(CLOSED_DOSSIER); return closed.handler(route); },
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Cerrar expediente' }).click();
        const dialog = page.getByRole('dialog', { name: 'Cerrar EXP-ACT-001' });
        await expect(dialog).toContainText('No se puede deshacer');
        await dialog.getByRole('button', { name: 'Cancelar' }).click();
        expect(closed.calls).toHaveLength(0);

        await page.getByRole('button', { name: 'Cerrar expediente' }).click();
        await dialog.getByRole('button', { name: 'Cerrar expediente' }).click();
        await expect(page.getByText('Expediente cerrado')).toBeVisible();
        expect(closed.calls).toHaveLength(1);
        expect(closed.calls[0].body).toBe('');
        await expect(facts(page).filter({ hasText: /^Cerrado$/ })).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Cerrar expediente' })).toHaveCount(0);
    });

    test('a close the API refuses shows its message and leaves the dossier open', async ({ page }) => {
        await mockApi(page, { permissions: MANAGE }, {
            [ONE]: ok(dossierDetail({ items: [], itemCount: 0, retention: null })),
            'POST /dossiers/x1/close': json(409, 'La serie no tiene tiempos de retención definidos'),
        });
        await openDetail(page);
        await expect(facts(page).filter({ hasText: 'Sin retención definida' })).toHaveCount(1);
        await expect(page.getByText('Aún no hay documentos')).toBeVisible();
        await page.getByRole('button', { name: 'Cerrar expediente' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Cerrar expediente' }).click();
        await expect(page.getByText('La serie no tiene tiempos de retención definidos')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cerrar expediente' })).toBeVisible();
    });

    test('impersonation hides closing and nothing else', async ({ page }) => {
        await mockApi(page, { permissions: MANAGE }, { [ONE]: ok(dossierDetail()) });
        await signIn(page, IMPERSONATING);
        await page.goto('/#/expedientes/x1');
        await expect(page.getByRole('button', { name: 'Incorporar documento' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Corregir documento 1' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cerrar expediente' })).toHaveCount(0);
    });

    test('exports the index with its columns and neutralizes formulas', async ({ page }) => {
        await mockApi(page, { permissions: VIEW }, { [ONE]: ok(dossierDetail()) });
        await openDetail(page);
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Índice del expediente' }).click()]);
        expect(download.suggestedFilename()).toMatch(/^indice-EXP-ACT-001-\d{4}-\d{2}-\d{2}\.csv$/);
        const lines = await csvLines(download);
        expect(lines[0]).toBe('Posición;Título;Tipo documental;Fecha del documento;Archivo;Tamaño;Incorporado por;Fecha de incorporación');
        // The last column is a local date and time.
        expect(lines[1]).toMatch(/^1;Acta 001;Acta de asamblea;15\/01\/2026;acta 001\.pdf;2 MB;Beto Ruiz;[^;]*2026[^;]*$/);
        expect(lines[2]).toMatch(/^2;'=Citación;;02\/03\/2026;citacion\.docx;4 KB;Beto Ruiz;[^;]*2026[^;]*$/);
        expect(lines).toHaveLength(3);
    });
});

test.describe('phone width', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('list, detail and the incorporate form fit without horizontal scroll, in both themes', async ({ page }) => {
        const long = 'Acta-de-la-asamblea-general-ordinaria-de-delegados-con-un-nombre-muy-largo-sin-espacios.pdf';
        await mockApi(page, { permissions: [...MANAGE, CHART] }, {
            [LIST]: ok([dossier(), dossier({ ...CLOSED_DOSSIER, id: 'x2', code: 'EXP-ACT-002' })]),
            [ONE]: ok(dossierDetail({ items: [dossierItem({ fileName: long })] })),
            [TREE]: ok(CLASSIFICATION_TREE),
        });
        await signIn(page);
        const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        for (const theme of ['light', 'dark']) {
            await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
            await page.goto('/#/expedientes');
            await page.reload();
            await expect(page.getByRole('link', { name: 'EXP-ACT-002' })).toBeVisible();
            expect(await noSideScroll()).toBe(true);

            await page.goto('/#/expedientes/x1');
            await expect(page.getByRole('button', { name: 'Descargar documento 1' })).toBeVisible();
            expect(await noSideScroll()).toBe(true);
            await page.getByRole('button', { name: 'Incorporar documento' }).click();
            await expect(page.getByRole('dialog').getByLabel('Archivo')).toBeVisible();
            expect(await noSideScroll()).toBe(true);
        }
    });
});
