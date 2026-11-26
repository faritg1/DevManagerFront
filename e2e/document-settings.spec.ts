import { expect, test, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });
const SETTINGS = { reviewNoticeDays: 30, retentionNoticeDays: 30, documentTypes: ['Política', 'Manual'], processes: ['Calidad'] };
const org = (documentSettings: unknown = SETTINGS) => ok({
    id: 'o1', name: 'Cooperativa Demo', legalName: null, nit: null, entityType: null, isActive: true, createdAt: '2026-01-01T00:00:00',
    workItemDueSoonDays: 2, workItemOverdueNotice: true, documentSettings,
    stats: { users: 1, activeUsers: 1, employees: 0, projects: 1, activeProjects: 1, governingBodies: 0, educationPrograms: 0, associatesByStatus: { applicant: 0, active: 0, suspended: 0, withdrawn: 0 } },
});

test.describe('organization page: «Gestión documental»', () => {
    test('saves the notice days and both catalogs', async ({ page }) => {
        const sent: { documentSettings?: unknown }[] = [];
        await mockApi(page, ADMIN, {
            'GET /organizations/me': org(),
            'PUT /organizations/me': (route: Route) => {
                const body = route.request().postDataJSON();
                sent.push(body);
                return route.fulfill({ json: org(body.documentSettings) });
            },
        });
        await signIn(page);
        await page.goto('/#/organizations');
        await page.getByRole('button', { name: 'Editar organización' }).click();

        const section = page.getByRole('group', { name: 'Gestión documental' });
        await expect(section.getByLabel('Días de aviso de revisión de documentos')).toHaveValue('30');
        await section.getByLabel('Días de aviso de revisión de documentos').fill('45');
        await section.getByLabel('Días de aviso de retención de expedientes').fill('60');

        // Enter adds to the list instead of submitting the form.
        await section.getByRole('textbox', { name: 'Tipos de documento' }).fill('Acta');
        await section.getByRole('textbox', { name: 'Tipos de documento' }).press('Enter');
        await section.getByRole('button', { name: 'Quitar Manual' }).click();
        await section.getByRole('textbox', { name: 'Procesos' }).fill('Compras');
        await section.getByRole('button', { name: 'Agregar a Procesos' }).click();
        expect(sent).toHaveLength(0);

        await page.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText('Organización actualizada')).toBeVisible();
        expect(sent[0].documentSettings).toEqual({
            reviewNoticeDays: 45, retentionNoticeDays: 60, documentTypes: ['Política', 'Acta'], processes: ['Calidad', 'Compras'],
        });
    });

    test('shows the message of a 400', async ({ page }) => {
        const message = 'El catálogo admite hasta 100 valores de máximo 100 caracteres';
        await mockApi(page, ADMIN, {
            'GET /organizations/me': org(),
            'PUT /organizations/me': (route: Route) => route.fulfill({ status: 400, json: { success: false, message } }),
        });
        await signIn(page);
        await page.goto('/#/organizations');
        await page.getByRole('button', { name: 'Editar organización' }).click();
        await page.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText(message)).toBeVisible();
        // The form stays open with what was typed.
        await expect(page.getByRole('group', { name: 'Gestión documental' })).toBeVisible();
    });
});

test.describe('document form: type and process', () => {
    const CREATE = ['menu.documents', 'menu.documents.master_list', 'menu.documents.master_list.create'];
    // Its type is not in the catalog; its process is.
    const row = {
        id: 'd1', code: 'INS-001', title: 'Instructivo de archivo', type: 'Instructivo', process: 'Calidad', ownerUserId: 'u1', ownerName: 'Ana López',
        reviewDate: null, currentVersionId: null, currentVersionNumber: null, approvedAt: null, approvedByName: null, openVersionStatus: 'Draft',
    };
    const USERS = [{ id: 'u1', firstName: 'Ana', lastName: 'López', email: 'ana@coop.co', isActive: true }];
    const recorder = () => {
        const calls: Record<string, unknown>[] = [];
        return { calls, handler: (route: Route) => { calls.push(route.request().postDataJSON()); return route.fulfill({ json: ok(row) }); } };
    };

    test('are lists when the catalog has values, keeping the value the document already had', async ({ page }) => {
        const created = recorder();
        const updated = recorder();
        await mockApi(page, { permissions: CREATE }, {
            'GET /organizations/me': org(),
            'GET /documents': ok([row]),
            'GET /users': ok(USERS),
            'POST /documents': created.handler,
            'PUT /documents/d1': updated.handler,
        });
        await signIn(page);
        await page.goto('/#/documentos');
        const dialog = page.getByRole('dialog');

        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        await expect(dialog.getByLabel('Tipo').getByRole('option')).toHaveText(['Selecciona un tipo', 'Política', 'Manual']);
        await expect(dialog.getByLabel('Proceso').getByRole('option')).toHaveText(['Selecciona un proceso', 'Calidad']);
        await dialog.getByLabel('Código').fill('MAN-001');
        await dialog.getByLabel('Título').fill('Manual de calidad');
        await dialog.getByLabel('Tipo').selectOption('Manual');
        await dialog.getByLabel('Proceso').selectOption('Calidad');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(created.calls[0]).toMatchObject({ code: 'MAN-001', type: 'Manual', process: 'Calidad' });

        await page.getByRole('button', { name: 'Editar INS-001' }).click();
        await expect(dialog.getByLabel('Tipo')).toHaveValue('Instructivo');
        await expect(dialog.getByLabel('Tipo').getByRole('option')).toHaveText(['Selecciona un tipo', 'Instructivo', 'Política', 'Manual']);
        await expect(dialog.getByLabel('Proceso')).toHaveValue('Calidad');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(dialog).toHaveCount(0);
        expect(updated.calls[0]).toMatchObject({ type: 'Instructivo', process: 'Calidad' });
    });

    test('are free text when the catalog is empty, and show the catalog error of the API', async ({ page }) => {
        const message = 'El tipo «Circular» no está en el catálogo de la entidad';
        await mockApi(page, { permissions: CREATE }, {
            'GET /organizations/me': org({ ...SETTINGS, documentTypes: [], processes: [] }),
            'GET /users': ok(USERS),
            'POST /documents': (route: Route) => route.fulfill({ status: 400, json: { success: false, message } }),
        });
        await signIn(page);
        await page.goto('/#/documentos');
        await page.getByRole('button', { name: 'Nuevo documento' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Responsable').getByRole('option')).toHaveCount(2);
        await expect(dialog.getByRole('textbox', { name: 'Tipo' })).toBeVisible();
        await expect(dialog.getByRole('textbox', { name: 'Proceso' })).toBeVisible();

        await dialog.getByLabel('Código').fill('CIR-001');
        await dialog.getByLabel('Título').fill('Circular');
        await dialog.getByLabel('Tipo').fill('Circular');
        await dialog.getByLabel('Proceso').fill('Gerencia');
        await dialog.getByLabel('Responsable').selectOption('u1');
        await dialog.getByRole('button', { name: 'Guardar' }).click();
        await expect(page.getByText(message)).toBeVisible();
    });
});
