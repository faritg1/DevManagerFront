import { expect, test, type Page, type Route } from '@playwright/test';
import { CLASSIFICATION_TREE, CLOSED_DOSSIER, dossier, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const BASE = ['menu.documents', 'menu.documents.master_list'];
const CREATE = [...BASE, 'menu.documents.master_list.create'];
const CLASSIFICATION = 'menu.documents.classification';
/** What the API adds to a classified document, in the list and in the detail. */
const CLASSIFIED = {
    classificationNodeId: 'n2', seriesCode: 'ACT-01', seriesName: 'Actas de junta',
    retention: { managementYears: 2, centralYears: 8, finalDisposition: 2, procedure: 'Microfilmar', legalBasis: 'Acuerdo interno 01', inherited: true },
};
const APPROVE = [...BASE, 'menu.documents.master_list.approve'];
const DISTRIBUTE = [...BASE, 'menu.documents.master_list.distribute'];

const row = {
    id: 'd1', code: 'POL-001', title: '=Politica de calidad', type: 'Política', process: 'Calidad', ownerUserId: 'u2', ownerName: 'Beto Ruiz',
    reviewDate: '2027-01-15', currentVersionId: 'v1', currentVersionNumber: 1, approvedAt: '2026-10-01T15:00:00', approvedByName: 'Carla Díaz', openVersionStatus: 'Draft',
};
const version = (over: object = {}) => ({
    id: 'v1', versionNumber: 1, status: 'Approved', changeSummary: 'Primera edición', fileName: 'política calidad.pdf', contentType: 'application/pdf', sizeBytes: 2_097_152,
    elaboratedByUserId: 'u2', elaboratedByName: 'Beto Ruiz', approvedByName: 'Carla Díaz', approvedAt: '2026-10-01T15:00:00',
    rejectedByName: null, rejectedAt: null, rejectionComment: null, createdAt: '2026-09-20T15:00:00', ...over,
});
const detail = (versions: object[] = [version()]) => ({
    id: 'd1', code: 'POL-001', title: 'Política de calidad', type: 'Política', process: 'Calidad', ownerUserId: 'u2', ownerName: 'Beto Ruiz',
    reviewDate: '2027-01-15', createdAt: '2026-09-20T15:00:00', versions,
});
const USERS = [
    { id: 'u1', firstName: 'Ana', lastName: 'López', email: 'ana@coop.co', isActive: true },
    { id: 'u2', firstName: 'Beto', lastName: 'Ruiz', email: 'beto@coop.co', isActive: true },
    { id: 'u3', firstName: 'Dora', lastName: 'Inactiva', email: 'dora@coop.co', isActive: false },
];
const PENDING = { documentId: 'd1', versionId: 'v1', code: 'POL-001', title: 'Política de calidad', versionNumber: 1 };

const json = (status: number, message: string) => (route: Route) => route.fulfill({ status, json: { success: false, message } });

/** Records each call so a test can assert what the screen really sent. */
const recorder = (body: unknown = version()) => {
    const calls: { body: string; headers: Record<string, string> }[] = [];
    const handler = (route: Route) => {
        calls.push({ body: route.request().postDataBuffer()?.toString('utf8') ?? '', headers: route.request().headers() });
        return route.fulfill({ json: ok(body) });
    };
    return { calls, handler };
};

const openDetail = async (page: Page, query = '') => {
    await signIn(page);
    await page.goto(`/#/documentos/d1${query}`);
    await expect(page.getByRole('heading', { name: /Política de calidad/ })).toBeVisible();
};

test.describe('master list', () => {
    test('filters on the server, exports what it shows and neutralizes formulas', async ({ page }) => {
        const queries: URLSearchParams[] = [];
        await mockApi(page, { permissions: BASE }, {
            'GET /documents': (route: Route, url: URL) => {
                queries.push(url.searchParams);
                return route.fulfill({ json: ok([row]) });
            },
        });
        await signIn(page);
        await page.goto('/#/documentos');
        await expect(page.getByRole('heading', { name: 'Listado maestro', level: 1 })).toBeVisible();
        await expect(page.getByRole('link', { name: 'POL-001' })).toBeVisible();
        await expect(page.getByText('Carla Díaz')).toBeVisible();
        // Without filters the list is asked for with no query at all.
        expect(queries.map(String).filter(Boolean)).toEqual([]);

        await page.getByRole('textbox', { name: 'Buscar', exact: true }).fill('calidad');
        await page.getByLabel('Tipo').fill('Pol');
        await page.getByLabel('Proceso').fill('Cal');
        await page.getByLabel('Estado').selectOption('InReview');
        await expect.poll(() => queries.at(-1)?.toString()).toBe('q=calidad&type=Pol&process=Cal&status=InReview');

        await expect(page.getByRole('link', { name: 'POL-001' })).toBeVisible();
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()]);
        expect(download.suggestedFilename()).toMatch(/^documentos-\d{4}-\d{2}-\d{2}\.csv$/);
        const csv = (await (await download.createReadStream()).toArray()).join('');
        expect(csv).toContain("POL-001;'=Politica de calidad;Política;Calidad;Beto Ruiz");
    });

    test('filters by series and by unclassified, and exports the series', async ({ page }) => {
        const queries: string[] = [];
        await mockApi(page, { permissions: [...BASE, CLASSIFICATION] }, {
            'GET /documents': (route: Route, url: URL) => {
                queries.push(url.searchParams.toString());
                return route.fulfill({ json: ok([{ ...row, ...CLASSIFIED }, { ...row, id: 'd2', code: 'PRO-002' }]) });
            },
            'GET /document-classification': ok(CLASSIFICATION_TREE),
        });
        await signIn(page);
        await page.goto('/#/documentos');
        const series = page.getByLabel('Serie');
        // Active series and subseries only: the inactive subseries ACT-02 is left out.
        await expect(series.getByRole('option')).toHaveText(['Todas las series', 'Sin clasificar', 'ACT · Actas', 'ACT / ACT-01 · Actas de junta', 'CON · Contratos']);

        await series.selectOption({ label: 'ACT / ACT-01 · Actas de junta' });
        await expect.poll(() => queries.at(-1)).toBe('series=n2');
        await series.selectOption({ label: 'Sin clasificar' });
        await expect.poll(() => queries.at(-1)).toBe('unclassified=true');

        await expect(page.getByRole('link', { name: 'POL-001' })).toBeVisible();
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()]);
        const lines = (await (await download.createReadStream()).toArray()).join('').split('\r\n');
        expect(lines[0]).toMatch(/;Fecha de revisión;Serie$/);
        expect(lines[1]).toMatch(/;ACT-01 · Actas de junta$/);
        expect(lines[2]).toMatch(/;$/);
    });

    test('without the classification permission it still filters unclassified and never asks for the chart', async ({ page }) => {
        const queries: string[] = [];
        let charts = 0;
        await mockApi(page, { permissions: BASE }, {
            'GET /documents': (route: Route, url: URL) => {
                queries.push(url.searchParams.toString());
                return route.fulfill({ json: ok([row]) });
            },
            'GET /document-classification': (route: Route) => { charts++; return route.fulfill({ status: 403, json: { success: false, message: 'Sin permiso' } }); },
        });
        await signIn(page);
        // The link of the «Sin clasificar» card on the module home.
        await page.goto('/#/documentos?serie=sin-clasificar');
        await expect(page.getByRole('link', { name: 'POL-001' })).toBeVisible();
        await expect(page.getByLabel('Serie')).toHaveValue('sin-clasificar');
        await expect(page.getByLabel('Serie').getByRole('option')).toHaveText(['Todas las series', 'Sin clasificar']);
        expect(queries.length).toBeGreaterThan(0);
        expect(queries.every((q) => q === 'unclassified=true')).toBe(true);
        expect(charts).toBe(0);
    });

    test('shows empty and error states, and hides creation without its permission', async ({ page }) => {
        await mockApi(page, { permissions: BASE });
        await signIn(page);
        await page.goto('/#/documentos');
        await expect(page.getByText('Aún no hay documentos')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nuevo documento' })).toHaveCount(0);

        await mockApi(page, { permissions: BASE }, { 'GET /documents': json(500, 'Fallo') });
        await page.reload();
        await expect(page.getByText('No se pudieron cargar los documentos')).toBeVisible();
    });

    test('creates and edits with .create, keeping the code fixed', async ({ page }) => {
        const created = recorder(detail());
        const updated = recorder(detail());
        const kept = recorder(detail());
        let charts = 0;
        await mockApi(page, { permissions: CREATE }, {
            'GET /documents': ok([{ ...row, title: 'Política de calidad' }, { ...row, ...CLASSIFIED, id: 'd2', code: 'ACT-2026' }]),
            'GET /users': ok(USERS),
            'POST /documents': created.handler,
            'PUT /documents/d1': updated.handler,
            'PUT /documents/d2': kept.handler,
            'GET /document-classification': (route: Route) => { charts++; return route.fulfill({ status: 403, json: { success: false, message: 'Sin permiso' } }); },
        });
        await signIn(page);
        await page.goto('/#/documentos');

        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('option', { name: 'Dora Inactiva' })).toHaveCount(0);
        // The series selector needs menu.documents.classification.
        await expect(dialog.getByLabel('Serie')).toHaveCount(0);
        await dialog.getByLabel('Código').fill('pro-002');
        await dialog.getByLabel('Título').fill('Procedimiento');
        await dialog.getByLabel('Tipo').fill('Procedimiento');
        await dialog.getByLabel('Proceso').fill('Compras');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(created.calls[0].body)).toEqual({
            code: 'pro-002', title: 'Procedimiento', type: 'Procedimiento', process: 'Compras', ownerUserId: 'u1', reviewDate: null, classificationNodeId: null,
        });

        await page.getByRole('button', { name: 'Editar POL-001' }).click();
        await expect(dialog.getByLabel('Código')).toBeDisabled();
        await dialog.getByLabel('Título').fill('Política revisada');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(updated.calls[0].body)).toEqual({
            title: 'Política revisada', type: 'Política', process: 'Calidad', ownerUserId: 'u2', reviewDate: '2027-01-15', classificationNodeId: null,
        });

        // PUT replaces the whole sheet: without the selector the form resends the series the document had.
        await page.getByRole('button', { name: 'Editar ACT-2026' }).click();
        await expect(dialog.getByLabel('Serie')).toHaveCount(0);
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(kept.calls[0].body).classificationNodeId).toBe('n2');
        expect(charts).toBe(0);
    });

    test('with the classification permission the form classifies, reclassifies and unclassifies', async ({ page }) => {
        const created = recorder(detail());
        const updated = recorder(detail());
        const inactive = recorder(detail());
        await mockApi(page, { permissions: [...CREATE, CLASSIFICATION] }, {
            'GET /documents': ok([
                { ...row, ...CLASSIFIED },
                { ...row, id: 'd3', code: 'ACT-OLD', classificationNodeId: 'n3', seriesCode: 'ACT-02', seriesName: 'Actas antiguas', retention: null },
            ]),
            'GET /users': ok(USERS),
            'GET /document-classification': ok(CLASSIFICATION_TREE),
            'POST /documents': created.handler,
            'PUT /documents/d1': updated.handler,
            'PUT /documents/d3': inactive.handler,
        });
        await signIn(page);
        await page.goto('/#/documentos');
        const dialog = page.getByRole('dialog');

        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        await expect(dialog.getByLabel('Serie').getByRole('option')).toHaveText(['Sin clasificar', 'ACT · Actas', 'ACT / ACT-01 · Actas de junta', 'CON · Contratos']);
        await dialog.getByLabel('Código').fill('ACT-2027');
        await dialog.getByLabel('Título').fill('Acta');
        await dialog.getByLabel('Tipo').fill('Acta');
        await dialog.getByLabel('Proceso').fill('Gobierno');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByLabel('Serie').selectOption('n1');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(created.calls[0].body).classificationNodeId).toBe('n1');

        await page.getByRole('button', { name: 'Editar POL-001' }).click();
        await expect(dialog.getByLabel('Serie')).toHaveValue('n2');
        await dialog.getByLabel('Serie').selectOption({ label: 'Sin clasificar' });
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(updated.calls[0].body).classificationNodeId).toBeNull();

        // A series deactivated after classifying stays selectable for that document only.
        await page.getByRole('button', { name: 'Editar ACT-OLD' }).click();
        await expect(dialog.getByLabel('Serie')).toHaveValue('n3');
        await expect(dialog.getByRole('option', { name: 'ACT-02 · Actas antiguas (inactiva)' })).toHaveCount(1);
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(inactive.calls[0].body).classificationNodeId).toBe('n3');
    });

    test('a repeated code keeps the form open with the API message', async ({ page }) => {
        await mockApi(page, { permissions: CREATE }, {
            'GET /users': ok(USERS),
            'POST /documents': json(409, 'Ya existe un documento con ese código'),
        });
        await signIn(page);
        await page.goto('/#/documentos');
        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel('Código').fill('POL-001');
        await dialog.getByLabel('Título').fill('Otra');
        await dialog.getByLabel('Tipo').fill('Política');
        await dialog.getByLabel('Proceso').fill('Calidad');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Ya existe un documento con ese código')).toBeVisible();
        await expect(dialog).toBeVisible();
    });

    test('lists pending reads with a link to each document', async ({ page }) => {
        await mockApi(page, { permissions: BASE }, { 'GET /documents/pending-reads': ok([PENDING]) });
        await signIn(page);
        await page.goto('/#/documentos');
        await expect(page.getByText('Tienes 1 documento por confirmar')).toBeVisible();
        await expect(page.getByRole('link', { name: 'POL-001 v1: Política de calidad' })).toHaveAttribute('href', '#/documentos/d1?version=v1');
    });

    test('the menu entry needs the base code', async ({ page }) => {
        await mockApi(page, { permissions: ['menu.platform', 'menu.platform.activities'] });
        await signIn(page);
        await page.goto('/#/documentos');
        await expect(page.getByRole('heading', { name: 'Listado maestro' })).toHaveCount(0);
        await expect(page).not.toHaveURL(/documentos/);
    });
});

test.describe('detail', () => {
    test('the base code only reads, downloads and confirms', async ({ page }) => {
        const confirmed = recorder({ confirmedAt: '2026-11-06T15:00:00' });
        const pending: unknown[] = [PENDING];
        const downloads: Record<string, string>[] = [];
        await mockApi(page, { permissions: BASE }, {
            'GET /documents/d1': ok(detail()),
            'GET /documents/pending-reads': (route: Route) => route.fulfill({ json: ok(pending) }),
            'POST /documents/d1/versions/v1/read-confirmation': (route: Route) => {
                pending.length = 0;
                return confirmed.handler(route);
            },
            'GET /documents/d1/versions/v1/file': (route: Route) => {
                downloads.push(route.request().headers());
                return route.fulfill({ body: 'pdf-bytes', contentType: 'application/pdf' });
            },
        });
        await openDetail(page);

        for (const name of ['Subir versión', 'Distribuir', 'Corregir', 'Aprobar', 'Rechazar', 'Enviar a revisión']) {
            await expect(page.getByRole('button', { name })).toHaveCount(0);
        }
        await expect(page.getByRole('heading', { name: 'Lecturas' })).toHaveCount(0);

        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar v1' }).click()]);
        expect(download.suggestedFilename()).toBe('política calidad.pdf');
        expect(downloads[0].authorization).toBe('Bearer test-token');

        await page.getByRole('button', { name: 'Confirmar lectura' }).click();
        await expect(page.getByText('Lectura confirmada')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Confirmar lectura' })).toHaveCount(0);
        expect(confirmed.calls).toHaveLength(1);
    });

    test('shows the series with the retention that applies, or that it is unclassified', async ({ page }) => {
        await mockApi(page, { permissions: BASE }, { 'GET /documents/d1': ok({ ...detail(), ...CLASSIFIED }) });
        await openDetail(page);
        const facts = page.getByRole('main').getByRole('definition');
        await expect(facts.filter({ hasText: 'ACT-01 · Actas de junta' })).toHaveCount(1);
        await expect(facts.filter({ hasText: 'Gestión 2 años · Central 8 años · Eliminación' })).toContainText('Heredada de la serie');

        await mockApi(page, { permissions: BASE }, { 'GET /documents/d1': ok(detail()) });
        await page.reload();
        await expect(facts.filter({ hasText: 'Sin clasificar' })).toHaveCount(1);
        await expect(page.getByText('Heredada de la serie')).toHaveCount(0);
    });

    test('a missing file and a missing document show their own message', async ({ page }) => {
        await mockApi(page, { permissions: BASE }, {
            'GET /documents/d1': ok(detail()),
            'GET /documents/d1/versions/v1/file': json(404, 'El archivo no está disponible'),
            'GET /documents/d9': json(404, 'No encontrado'),
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Descargar v1' }).click();
        await expect(page.getByText('El archivo no está disponible')).toBeVisible();

        await page.goto('/#/documentos/d9');
        await expect(page.getByText('Documento no encontrado')).toBeVisible();
    });

    test('a read confirmation on a replaced version shows the 409 and reloads', async ({ page }) => {
        let loads = 0;
        await mockApi(page, { permissions: BASE }, {
            'GET /documents/d1': (route: Route) => {
                loads++;
                return route.fulfill({ json: ok(detail()) });
            },
            'GET /documents/pending-reads': ok([PENDING]),
            'POST /documents/d1/versions/v1/read-confirmation': json(409, 'Esta versión ya no está vigente'),
        });
        await openDetail(page);
        const before = loads;
        await page.getByRole('button', { name: 'Confirmar lectura' }).click();
        await expect(page.getByText('Esta versión ya no está vigente')).toBeVisible();
        await expect.poll(() => loads).toBeGreaterThan(before);
    });

    test('a link to a version that is no longer current says so', async ({ page }) => {
        await mockApi(page, { permissions: BASE }, { 'GET /documents/d1': ok(detail([version({ id: 'v2', versionNumber: 2 })])) });
        await openDetail(page, '?version=v1');
        await expect(page.getByText('La versión de este enlace ya no está vigente')).toBeVisible();
    });

    test('uploads a version as multipart and validates the file first', async ({ page }) => {
        const uploaded = recorder(version({ id: 'v2', versionNumber: 2, status: 'Draft' }));
        await mockApi(page, { permissions: CREATE }, {
            'GET /documents/d1': ok(detail()),
            'POST /documents/d1/versions': uploaded.handler,
        });
        await openDetail(page);
        await page.getByRole('button', { name: 'Subir versión' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Archivo')).toHaveAttribute('accept', '.pdf,.docx,.xlsx,.png,.jpg,.jpeg');

        await dialog.getByLabel('Resumen del cambio').fill('Ajuste de alcance');
        await dialog.getByLabel('Archivo').setInputFiles({ name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') });
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog.getByText('Solo se admiten archivos PDF, DOCX, XLSX, PNG y JPG')).toBeVisible();

        await dialog.getByLabel('Archivo').setInputFiles({ name: 'vacio.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog.getByText('El archivo está vacío')).toBeVisible();

        await dialog.getByLabel('Archivo').setInputFiles({ name: 'grande.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog.getByText('El archivo supera el tamaño máximo de 20 MB')).toBeVisible();
        expect(uploaded.calls).toHaveLength(0);

        await dialog.getByLabel('Archivo').setInputFiles({ name: 'nueva.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7') });
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        const { body, headers } = uploaded.calls[0];
        expect(headers['content-type']).toContain('multipart/form-data; boundary=');
        expect(body).toContain('name="changeSummary"');
        expect(body).toContain('Ajuste de alcance');
        expect(body).toContain('name="file"; filename="nueva.pdf"');
    });

    test('corrects a draft without a new file and sends it to review', async ({ page }) => {
        const draft = version({ status: 'Draft', approvedByName: null, approvedAt: null, rejectedByName: 'Carla Díaz', rejectedAt: '2026-10-02T15:00:00', rejectionComment: 'Falta el alcance' });
        const corrected = recorder(draft);
        const submitted = recorder(draft);
        await mockApi(page, { permissions: CREATE }, {
            'GET /documents/d1': ok(detail([draft])),
            'PUT /documents/d1/versions/v1': corrected.handler,
            'POST /documents/d1/versions/v1/submit': submitted.handler,
        });
        await openDetail(page);
        await expect(page.getByText('Falta el alcance')).toBeVisible();
        // One open version per document: a second one is refused by the API, so it is not offered.
        await expect(page.getByRole('button', { name: 'Subir versión' })).toHaveCount(0);

        await page.getByRole('button', { name: 'Corregir v1' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Resumen del cambio')).toHaveValue('Primera edición');
        await dialog.getByLabel('Resumen del cambio').fill('Alcance agregado');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(corrected.calls[0].body).toContain('Alcance agregado');
        expect(corrected.calls[0].body).not.toContain('name="file"');

        await page.getByRole('button', { name: 'Enviar a revisión' }).click();
        await expect(page.getByText('Versión enviada a revisión')).toBeVisible();
        expect(submitted.calls).toHaveLength(1);
    });

    test('approves after confirming and rejects with a required comment', async ({ page }) => {
        const review = version({ status: 'InReview', approvedByName: null, approvedAt: null });
        const approved = recorder();
        const rejected = recorder();
        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents/d1': ok(detail([review])),
            'POST /documents/d1/versions/v1/approve': approved.handler,
            'POST /documents/d1/versions/v1/reject': rejected.handler,
        });
        await openDetail(page);

        await page.getByRole('button', { name: 'Rechazar v1' }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Rechazar' }).click();
        await expect(dialog.getByText('Este campo es obligatorio')).toBeVisible();
        expect(rejected.calls).toHaveLength(0);
        await dialog.getByLabel('Comentario').fill('Falta el alcance');
        await dialog.getByRole('button', { name: 'Rechazar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(JSON.parse(rejected.calls[0].body)).toEqual({ comment: 'Falta el alcance' });

        await page.getByRole('button', { name: 'Aprobar v1' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Aprobar' }).click();
        await expect(page.getByText('Versión aprobada')).toBeVisible();
        expect(approved.calls).toHaveLength(1);
    });

    test('approve is hidden for the author, and a 403 from the API is the authority', async ({ page }) => {
        const own = version({ status: 'InReview', elaboratedByUserId: 'u1', approvedByName: null, approvedAt: null });
        await mockApi(page, { permissions: APPROVE }, { 'GET /documents/d1': ok(detail([own])) });
        await openDetail(page);
        await expect(page.getByRole('button', { name: 'Rechazar v1' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Aprobar v1' })).toHaveCount(0);

        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents/d1': ok(detail([{ ...own, elaboratedByUserId: 'u2' }])),
            'POST /documents/d1/versions/v1/approve': json(403, 'Quien elabora una versión no puede aprobarla'),
        });
        await page.reload();
        await page.getByRole('button', { name: 'Aprobar v1' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Aprobar' }).click();
        await expect(page.getByText('Quien elabora una versión no puede aprobarla')).toBeVisible();
    });

    test('impersonation hides approve, reject and confirm', async ({ page }) => {
        const review = version({ id: 'v2', versionNumber: 2, status: 'InReview', approvedByName: null, approvedAt: null });
        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents/d1': ok(detail([review, version()])),
            'GET /documents/pending-reads': ok([PENDING]),
        });
        await signIn(page, {
            impersonator_token: 'root-token',
            impersonator_user: '{}',
            impersonation: JSON.stringify({ targetName: 'Ana López', organizationName: 'Cooperativa Demo', expiresAt: '2030-01-01T00:00:00Z' }),
        });
        await page.goto('/#/documentos/d1');
        await expect(page.getByRole('button', { name: 'Descargar v2' })).toBeVisible();
        for (const name of ['Aprobar v2', 'Rechazar v2', 'Confirmar lectura']) {
            await expect(page.getByRole('button', { name })).toHaveCount(0);
        }
    });

    test('distributes to users and roles and lists who read it', async ({ page }) => {
        const distributed = recorder({ newRecipients: 2 });
        await mockApi(page, { permissions: DISTRIBUTE }, {
            'GET /documents/d1': ok(detail()),
            'GET /documents/d1/reads': ok([
                { userId: 'u1', userName: 'Ana López', confirmedAt: '2026-11-01T15:00:00' },
                { userId: 'u2', userName: 'Beto Ruiz', confirmedAt: null },
            ]),
            'GET /users': ok(USERS),
            'GET /roles': ok([{ id: 'r9', name: 'Auditor' }]),
            'POST /documents/d1/distribution': distributed.handler,
        });
        await openDetail(page);
        await expect(page.getByRole('heading', { name: 'Lecturas' })).toBeVisible();
        await expect(page.getByText('1 de 2 confirmaron')).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Pendiente' })).toBeVisible();

        await page.getByRole('button', { name: 'Distribuir' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('button', { name: 'Distribuir' })).toBeDisabled();
        await expect(dialog.getByLabel('Dora Inactiva')).toHaveCount(0);
        await dialog.getByLabel('Beto Ruiz').check();
        await dialog.getByLabel('Auditor').check();
        await dialog.getByRole('button', { name: 'Distribuir' }).click();
        await expect(dialog).toHaveCount(0);
        await expect(page.getByText('2 destinatarios nuevos')).toBeVisible();
        expect(JSON.parse(distributed.calls[0].body)).toEqual({ userIds: ['u2'], roleIds: ['r9'] });
    });

    test('a detail link needs the base code', async ({ page }) => {
        await mockApi(page, { permissions: ['menu.platform', 'menu.platform.activities'] });
        await signIn(page);
        await page.goto('/#/documentos/d1');
        await expect(page).not.toHaveURL(/documentos/);
    });
});

test.describe('module section', () => {
    const menu = (page: Page) => page.getByRole('navigation', { name: 'Menú principal' }).first();
    const SECTION = 'Gestión documental';
    const inReview = { ...row, id: 'd2', code: 'PRO-002', title: 'Procedimiento de compras', currentVersionId: null, currentVersionNumber: null, reviewDate: null, openVersionStatus: 'InReview' };
    const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toLocaleDateString('en-CA');
    /** The master list answers by its `status` filter, as the API does. */
    const listByStatus = (all: unknown[], review: unknown[], seen: string[] = []) => (route: Route, url: URL) => {
        seen.push(url.search);
        return route.fulfill({ json: ok(url.searchParams.get('status') === 'InReview' ? review : all) });
    };

    test('shows its four entries and each route highlights its own', async ({ page }) => {
        await mockApi(page, { permissions: APPROVE });
        await signIn(page);
        const entries: [string, string, string][] = [
            ['Inicio', '/gestion-documental', 'Gestión documental'],
            ['Listado maestro', '/documentos', 'Listado maestro'],
            ['Mis lecturas', '/documentos-lecturas', 'Mis lecturas'],
            ['Por aprobar', '/documentos-por-aprobar', 'Por aprobar'],
        ];
        for (const [label, path, heading] of entries) {
            await page.goto(`/#${path}`);
            await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
            await expect(menu(page).getByRole('button', { name: SECTION })).toBeVisible();
            for (const [other] of entries) {
                const link = menu(page).getByRole('link', { name: other, exact: true });
                if (other === label) await expect(link).toHaveAttribute('aria-current', 'page');
                else await expect(link).not.toHaveAttribute('aria-current', 'page');
            }
        }
        await expect(menu(page).getByRole('link', { name: 'Documentos', exact: true })).toHaveCount(0);
    });

    test('without .approve there is no «Por aprobar» and its URL redirects', async ({ page }) => {
        await mockApi(page, { permissions: BASE });
        await signIn(page);
        await page.goto('/#/documentos-por-aprobar');
        await expect(page).toHaveURL(/#\/gestion-documental$/);
        await expect(menu(page).getByRole('link', { name: 'Mis lecturas', exact: true })).toBeVisible();
        await expect(menu(page).getByRole('link', { name: 'Por aprobar', exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Por aprobar' })).toHaveCount(0);
    });

    test('the section follows menu.documents, not menu.platform', async ({ page }) => {
        await mockApi(page, { permissions: ['menu.platform', 'menu.platform.dashboard', 'menu.documents.master_list'] });
        await signIn(page);
        await page.goto('/#/dashboard');
        await expect(menu(page).getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
        await expect(menu(page).getByRole('button', { name: SECTION })).toHaveCount(0);
        await expect(menu(page).getByRole('link', { name: 'Listado maestro', exact: true })).toHaveCount(0);

        await mockApi(page, { permissions: BASE });
        await page.reload();
        await expect(menu(page).getByRole('button', { name: SECTION })).toBeVisible();
        await expect(menu(page).getByRole('link', { name: 'Listado maestro', exact: true })).toBeVisible();
        await expect(menu(page).getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0);
    });

    test('«Mis lecturas» lists what is pending with a link to its version, or says there is nothing', async ({ page }) => {
        await mockApi(page, { permissions: BASE });
        await signIn(page);
        await page.goto('/#/documentos-lecturas');
        await expect(page.getByText('No tienes documentos por confirmar')).toBeVisible();

        await mockApi(page, { permissions: BASE }, { 'GET /documents/pending-reads': ok([PENDING]) });
        await page.reload();
        const cells = page.getByRole('row').nth(1).getByRole('cell');
        await expect(cells).toHaveText(['POL-001', 'v1', 'Política de calidad']);
        await expect(page.getByRole('link', { name: 'POL-001' })).toHaveAttribute('href', '#/documentos/d1?version=v1');
    });

    test('«Por aprobar» lists the versions in review with who elaborated them, or says there is nothing', async ({ page }) => {
        const seen: string[] = [];
        await mockApi(page, { permissions: APPROVE }, { 'GET /documents': listByStatus([row, inReview], [], seen) });
        await signIn(page);
        await page.goto('/#/documentos-por-aprobar');
        await expect(page.getByText('No hay versiones esperando aprobación')).toBeVisible();
        expect(seen).toContain('?status=InReview');

        let details = 0;
        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents': listByStatus([row, inReview], [{ ...inReview, inReviewElaboratedByName: 'Elena Mora' }, { ...inReview, id: 'd3', code: 'PRO-003', inReviewElaboratedByName: null }]),
            'GET /documents/d2': (route: Route) => { details++; return route.fulfill({ json: ok({ ...detail(), id: 'd2' }) }); },
        });
        await page.reload();
        const cells = (n: number) => page.getByRole('row').nth(n).getByRole('cell');
        await expect(cells(1)).toHaveText(['PRO-002', 'Procedimiento de compras', 'Elena Mora']);
        await expect(cells(2)).toHaveText(['PRO-003', 'Procedimiento de compras', '—']);
        await expect(page.getByRole('link', { name: 'PRO-002' })).toHaveAttribute('href', '#/documentos/d2');
        // The elaborator comes in the list: no detail request per row.
        expect(details).toBe(0);
    });

    test('the home counts each card from the two queries and the list', async ({ page }) => {
        const current = (id: string, reviewDate: string | null) => ({ ...row, id, code: id, reviewDate, openVersionStatus: null });
        const all = [current('a', day(-1)), current('b', day(30)), current('c', day(31)), current('e', null), inReview, { ...inReview, id: 'f', reviewDate: day(1) }];
        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents': listByStatus(all, [inReview]),
            'GET /documents/pending-reads': ok([PENDING, { ...PENDING, versionId: 'v2' }, { ...PENDING, versionId: 'v3' }]),
        });
        await signIn(page);
        await page.goto('/#/gestion-documental');
        const card = (name: string) => page.getByRole('main').getByRole('link', { name: new RegExp(`^${name}`) });
        await expect(card('Por confirmar lectura')).toHaveText(/3$/);
        await expect(card('Por confirmar lectura')).toHaveAttribute('href', '#/documentos-lecturas');
        await expect(card('Por aprobar')).toHaveText(/1$/);
        await expect(card('Por aprobar')).toHaveAttribute('href', '#/documentos-por-aprobar');
        await expect(card('Documentos vigentes')).toHaveText(/4$/);
        await expect(card('Documentos vigentes')).toHaveAttribute('href', '#/documentos');
        // Current documents only, due within 30 days or already overdue: a and b.
        await expect(card('Revisión próxima o vencida')).toHaveText(/2$/);
    });

    test('the home counts the unclassified documents and links to the filtered list', async ({ page }) => {
        await mockApi(page, { permissions: BASE }, {
            'GET /documents': listByStatus([row, { ...row, id: 'd2' }, { ...row, ...CLASSIFIED, id: 'd3' }], []),
        });
        await signIn(page);
        await page.goto('/#/gestion-documental');
        const card = page.getByRole('main').getByRole('link', { name: /^Sin clasificar/ });
        await expect(card).toHaveText(/2$/);
        await expect(card).toHaveAttribute('href', '#/documentos?serie=sin-clasificar');
    });

    test('the home counts the closed dossiers with a transfer or a disposition coming up', async ({ page }) => {
        const queries: string[] = [];
        const closed = (id: string, over: object) => dossier({ ...CLOSED_DOSSIER, id, code: id, ...over });
        await mockApi(page, { permissions: [...BASE, 'menu.documents.dossiers'] }, {
            'GET /dossiers': (route: Route, url: URL) => {
                queries.push(url.searchParams.toString());
                return route.fulfill({ json: ok([
                    closed('a', { stage: 'Management', managementUntil: day(10) }),
                    closed('b', { stage: 'Management', managementUntil: day(31) }),
                    closed('c', { stage: 'Central', managementUntil: day(-400), centralUntil: day(30) }),
                    closed('e', { stage: 'Central', managementUntil: day(-400), centralUntil: day(40) }),
                    closed('f', { stage: 'FinalDispositionPending', managementUntil: day(-400), centralUntil: day(-20) }),
                ]) });
            },
        });
        await signIn(page);
        await page.goto('/#/gestion-documental');
        const card = page.getByRole('main').getByRole('link', { name: /^Expedientes con disposición o transferencia próxima/ });
        // Within 30 days of the end of its current stage: a and c.
        await expect(card).toHaveText(/2$/);
        await expect(card).toHaveAttribute('href', '#/expedientes?estado=Closed');
        expect(new Set(queries)).toEqual(new Set(['status=Closed']));
    });

    test('the home hides the dossier card without menu.documents.dossiers and does not ask for them', async ({ page }) => {
        let asked = 0;
        await mockApi(page, { permissions: BASE }, {
            'GET /documents': listByStatus([row], []),
            'GET /dossiers': (route: Route) => { asked++; return route.fulfill({ json: ok([]) }); },
        });
        await signIn(page);
        await page.goto('/#/gestion-documental');
        const main = page.getByRole('main');
        await expect(main.getByRole('link', { name: /^Documentos vigentes/ })).toHaveText(/1$/);
        await expect(main.getByRole('link', { name: /^Expedientes con/ })).toHaveCount(0);
        expect(asked).toBe(0);
    });

    test('the home hides «Por aprobar» without the permission and does not ask for it', async ({ page }) => {
        const seen: string[] = [];
        await mockApi(page, { permissions: BASE }, { 'GET /documents': listByStatus([row], [inReview], seen) });
        await signIn(page);
        await page.goto('/#/gestion-documental');
        const main = page.getByRole('main');
        await expect(main.getByRole('link', { name: /^Documentos vigentes/ })).toHaveText(/1$/);
        await expect(main.getByRole('link', { name: /^Por aprobar/ })).toHaveCount(0);
        // Only the unfiltered list was asked for (twice under React StrictMode).
        expect(seen.length).toBeGreaterThan(0);
        expect(seen.filter(Boolean)).toEqual([]);
    });

    test('a failed query only breaks its own card on the home', async ({ page }) => {
        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents': listByStatus([row], [inReview]),
            'GET /documents/pending-reads': json(500, 'Fallo'),
        });
        await signIn(page);
        await page.goto('/#/gestion-documental');
        const card = (name: string) => page.getByRole('main').getByRole('link', { name: new RegExp(`^${name}`) });
        await expect(card('Por confirmar lectura')).toContainText('No se pudo cargar');
        await expect(card('Por aprobar')).toHaveText(/1$/);
        await expect(card('Documentos vigentes')).toHaveText(/1$/);
        await expect(page.getByText('No se pudo cargar')).toHaveCount(1);
    });
});

test.describe('phone width', () => {
    test.use({ viewport: { width: 375, height: 700 } });

    const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    test('the module home and its two lists fit without horizontal scroll', async ({ page }) => {
        const review = { ...row, openVersionStatus: 'InReview' };
        await mockApi(page, { permissions: APPROVE }, {
            'GET /documents': ok([review]),
            'GET /documents/d1': ok(detail([version({ status: 'InReview' })])),
            'GET /documents/pending-reads': ok([PENDING]),
        });
        await signIn(page);
        for (const [path, text] of [['/gestion-documental', 'Documentos vigentes'], ['/documentos-lecturas', 'POL-001'], ['/documentos-por-aprobar', 'POL-001']]) {
            await page.goto(`/#${path}`);
            await expect(page.getByRole('main').getByText(text).first()).toBeVisible();
            expect(await noSideScroll(page)).toBe(true);
        }
    });

    test('list and detail fit without horizontal scroll, in both themes', async ({ page }) => {
        const long = 'Procedimiento-de-control-de-documentos-con-un-nombre-muy-largo-que-no-tiene-espacios.pdf';
        await mockApi(page, { permissions: [...CREATE, ...APPROVE, ...DISTRIBUTE] }, {
            'GET /documents': ok([row]),
            'GET /documents/d1': ok(detail([version({ id: 'v2', versionNumber: 2, status: 'InReview', fileName: long, approvedByName: null, approvedAt: null }), version()])),
            'GET /documents/pending-reads': ok([PENDING]),
        });
        await signIn(page);
        for (const theme of ['light', 'dark']) {
            await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
            await page.goto('/#/documentos');
            await page.reload();
            await expect(page.getByRole('link', { name: 'POL-001', exact: true })).toBeVisible();
            expect(await noSideScroll(page)).toBe(true);

            await page.goto('/#/documentos/d1');
            await expect(page.getByRole('button', { name: 'Descargar v2' })).toBeVisible();
            expect(await noSideScroll(page)).toBe(true);
        }
    });
});
