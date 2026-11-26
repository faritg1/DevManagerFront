import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown, message = '') => ({ success: true, message, data });

/** A 400 of the API that names the field that failed. */
const fieldError = (errors: Record<string, string[]>) => (route: Route) =>
    route.fulfill({ status: 400, json: { success: false, message: 'Revisa los campos marcados', errorCode: 'VALIDATION_ERROR', errors } });

/** Answers with `data` and keeps every body it received. */
const capture = (sent: unknown[], data: unknown = null) => (route: Route) => {
    sent.push(route.request().postDataJSON());
    return route.fulfill({ json: ok(data) });
};

/** The message sits under its field, which takes the focus, and the alert only points at the fields. */
async function expectFieldError(panel: Locator, field: Locator, message: string) {
    await expect(field).toHaveAccessibleDescription(message);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toBeFocused();
    const alert = panel.getByRole('alert');
    await expect(alert).toContainText('Revisa los campos marcados');
    await expect(alert.getByRole('listitem')).toHaveCount(0);
    await expect(panel).toBeVisible();
}

const CATALOGS = ok({
    projectStatuses: [{ id: 1, name: 'Borrador' }], complexityLevels: [{ id: 2, name: 'Media' }],
    skillLevels: [{ id: 3, name: 'Intermedio' }, { id: 4, name: 'Avanzado' }],
    applicationStatuses: [], assignmentStatuses: [], contributionScores: [], evaluationSources: [], skillTypes: [],
    skillCategories: [], agentActionTypes: [], agentActionStatuses: [], seniorityLevels: [],
});
const SKILLS = ok([{ id: 's1', name: 'React', category: 'Frontend' }, { id: 's2', name: 'SQL', category: null }]);

test.describe('governing bodies: «Crear Órgano»', () => {
    const open = async (page: Page, post: (route: Route) => unknown) => {
        await mockApi(page, ADMIN, { 'POST /organos': post });
        await signIn(page);
        await page.goto('/#/organos');
        await page.getByRole('button', { name: 'Crear Órgano' }).click();
        const panel = page.getByRole('dialog', { name: 'Crear Órgano' });
        await panel.getByLabel('Nombre').fill('  Junta 2026  ');
        return panel;
    };

    test('saving sends the trimmed name, the type, the date and the description', async ({ page }) => {
        const sent: unknown[] = [];
        const panel = await open(page, capture(sent, { id: 'g1', type: 3, name: 'Junta 2026', constitutionDate: '2026-03-01', isActive: true, membersCount: 0, minutesCount: 0 }));
        await panel.getByLabel('Tipo').selectOption({ label: 'Junta de Vigilancia' });
        await panel.getByLabel('Fecha de constitución').fill('2026-03-01');
        await panel.getByLabel('Descripción').fill('Control social');
        await panel.getByRole('button', { name: 'Guardar' }).click();

        await expect(page.getByText('Órgano creado')).toBeVisible();
        await expect(panel).toHaveCount(0);
        expect(sent).toEqual([{ type: 3, name: 'Junta 2026', constitutionDate: '2026-03-01', description: 'Control social' }]);
    });

    test('a field error from the API shows under «Nombre»', async ({ page }) => {
        const panel = await open(page, fieldError({ name: ['Ya existe un órgano con ese nombre'] }));
        await panel.getByRole('button', { name: 'Guardar' }).click();
        await expectFieldError(panel, panel.getByLabel('Nombre'), 'Ya existe un órgano con ese nombre');
    });
});

test.describe('profile forms', () => {
    const open = async (page: Page, overrides: Record<string, unknown>, button: string, title: string) => {
        await mockApi(page, ADMIN, {
            'GET /profile/me': ok({ userId: 'u1', bio: 'Desarrolladora.', yearsExperience: 6, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '2026-01-01' }),
            'GET /Config': CATALOGS,
            'GET /skills': SKILLS,
            ...overrides,
        });
        await signIn(page);
        await page.goto('/#/profile');
        await page.getByRole('button', { name: button }).click();
        return page.getByRole('dialog', { name: title });
    };

    const openCertification = async (page: Page, post: (route: Route) => unknown) => {
        const panel = await open(page, { 'POST /certifications/me': post }, 'Agregar mi primera certificación', 'Nueva Certificación');
        await panel.getByLabel('Nombre de la certificación').fill('AWS Architect');
        await panel.getByLabel('Emisor').fill('Amazon');
        await panel.getByLabel('Fecha de emisión').fill('2026-01-15');
        return panel;
    };

    const openSkill = async (page: Page, post: (route: Route) => unknown) => {
        const panel = await open(page, { 'POST /employees/skills': post }, 'Agregar mi primera habilidad', 'Agregar Habilidad');
        await panel.getByLabel('Habilidad').selectOption('s1');
        await panel.getByLabel('Evidencia').fill('https://github.com/ana/react');
        await panel.getByLabel('Descripción de Experiencia').fill('Tres años con React');
        return panel;
    };

    test('a new certification sends its fields and null for the empty optional ones', async ({ page }) => {
        const sent: unknown[] = [];
        const panel = await openCertification(page, capture(sent, 'c1'));
        await panel.getByRole('button', { name: 'Crear Certificación' }).click();

        await expect(panel).toHaveCount(0);
        expect(sent).toEqual([{ name: 'AWS Architect', issuer: 'Amazon', issueDate: '2026-01-15', expirationDate: null, evidenceUrl: null }]);
    });

    test('a certification field error from the API shows under «Emisor»', async ({ page }) => {
        const panel = await openCertification(page, fieldError({ issuer: ['Debe tener máximo 100 caracteres'] }));
        await panel.getByRole('button', { name: 'Crear Certificación' }).click();
        await expectFieldError(panel, panel.getByLabel('Emisor'), 'Debe tener máximo 100 caracteres');
    });

    test('a new skill sends the skill, the default level and the evidence', async ({ page }) => {
        const sent: unknown[] = [];
        const panel = await openSkill(page, capture(sent));
        await panel.getByRole('button', { name: 'Agregar Habilidad' }).click();

        await expect(page.getByText('Habilidad agregada exitosamente')).toBeVisible();
        await expect(panel).toHaveCount(0);
        expect(sent).toEqual([{ skillId: 's1', level: 3, evidenceUrl: 'https://github.com/ana/react', experienceDescription: 'Tres años con React' }]);
    });

    test('a skill field error from the API shows under «Evidencia»', async ({ page }) => {
        const panel = await openSkill(page, fieldError({ evidenceUrl: ['El valor no es válido'] }));
        await panel.getByRole('button', { name: 'Agregar Habilidad' }).click();
        await expectFieldError(panel, panel.getByLabel('Evidencia'), 'El valor no es válido');
    });
});

test.describe('project edit: «Agregar Requisito de Habilidad»', () => {
    const open = async (page: Page, post: (route: Route) => unknown) => {
        await mockApi(page, ADMIN, {
            'GET /Config': CATALOGS,
            'GET /skills': SKILLS,
            'GET /projects/p1': ok({ id: 'p1', code: 'PRJ-1', name: 'Portal', description: null, startDate: null, endDate: null, complexityLevel: 2, status: 1, createdAt: '2026-01-01T00:00:00' }),
            'POST /projects/p1/reqs': post,
        });
        await signIn(page);
        await page.goto('/#/projects/p1/edit');
        await page.getByRole('button', { name: 'Agregar Primer Requisito' }).click();
        const panel = page.getByRole('dialog', { name: 'Agregar Requisito de Habilidad' });
        await panel.getByLabel('Habilidad').selectOption('s2');
        return panel;
    };

    test('saving sends the skill, the level as a number and whether it is mandatory', async ({ page }) => {
        const sent: unknown[] = [];
        const panel = await open(page, capture(sent, 'r1'));
        await panel.getByLabel('Nivel Requerido').selectOption('4');
        await panel.getByLabel('¿Es obligatorio?').uncheck();
        await panel.getByRole('button', { name: 'Agregar Requisito' }).click();

        await expect(page.getByText('Requisito agregado exitosamente')).toBeVisible();
        await expect(panel).toHaveCount(0);
        expect(sent).toEqual([{ skillId: 's2', requiredLevel: 4, isMandatory: false }]);
    });

    test('a field error from the API shows under «Nivel Requerido»', async ({ page }) => {
        const panel = await open(page, fieldError({ requiredLevel: ['Debe estar entre 1 y 5'] }));
        await panel.getByRole('button', { name: 'Agregar Requisito' }).click();
        await expectFieldError(panel, panel.getByLabel('Nivel Requerido'), 'Debe estar entre 1 y 5');
    });
});

test('organization: a nested field error from the API shows under its notice-days field', async ({ page }) => {
    await mockApi(page, ADMIN, {
        'GET /organizations/me': ok({
            id: 'o1', name: 'Cooperativa Demo', legalName: null, nit: null, entityType: null, isActive: true, createdAt: '2026-01-01T00:00:00',
            workItemDueSoonDays: 2, workItemOverdueNotice: true,
            documentSettings: { reviewNoticeDays: 30, retentionNoticeDays: 30, documentTypes: [], processes: [] },
            stats: { users: 1, activeUsers: 1, employees: 0, projects: 1, activeProjects: 1, governingBodies: 0, educationPrograms: 0, associatesByStatus: { applicant: 0, active: 0, suspended: 0, withdrawn: 0 } },
        }),
        'PUT /organizations/me': fieldError({ 'documentSettings.reviewNoticeDays': ['Debe estar entre 1 y 365'] }),
    });
    await signIn(page);
    await page.goto('/#/organizations');
    await page.getByRole('button', { name: 'Editar organización' }).click();
    const panel = page.getByRole('dialog', { name: 'Editar organización' });
    await panel.getByLabel('Días de aviso de revisión de documentos').fill('45');
    await panel.getByRole('button', { name: 'Guardar' }).click();
    await expectFieldError(panel, panel.getByLabel('Días de aviso de revisión de documentos'), 'Debe estar entre 1 y 365');
    // The sibling field, which shares the last segment of no key, stays clean.
    await expect(panel.getByLabel('Días de aviso de retención de expedientes')).not.toHaveAttribute('aria-invalid', 'true');
});

test('platform: a field error from the API shows under the storage profile of «Proveedores»', async ({ page }) => {
    await mockApi(page, { permissions: [], isAdmin: true, isSuperAdmin: true }, {
        'GET /platform/organizations': ok([{ id: 'o9', name: 'Coop Uno', nit: '900', isActive: true, userCount: 4 }]),
        'GET /platform/organizations/o9/providers': ok({ storageProfile: 's3-coop', emailProfile: null, storageProfiles: ['local', 's3-coop'], emailProfiles: ['Brevo'] }),
        'PUT /platform/organizations/o9/providers': fieldError({ storageProfile: ['El perfil no existe en el hosting'] }),
    });
    await signIn(page);
    await page.goto('/#/superadmin');
    await page.getByRole('button', { name: 'Proveedores de Coop Uno' }).click();
    const panel = page.getByRole('dialog', { name: 'Proveedores' });
    await panel.getByLabel('Almacenamiento', { exact: true }).selectOption('local');
    await panel.getByRole('button', { name: 'Guardar' }).click();
    await expectFieldError(panel, panel.getByLabel('Almacenamiento', { exact: true }), 'El perfil no existe en el hosting');
});
