import type { Page, Route } from '@playwright/test';

export const API = 'http://api.mock/api';

export interface MockUser {
    permissions: string[];
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
}

export const ADMIN: MockUser = { permissions: [], isAdmin: true };

type Handler = (route: Route, url: URL) => unknown;

const ok = (data: unknown) => ({ success: true, message: '', data });

/**
 * Mocks the whole API. `overrides` maps "METHOD /path" (path after /api, exact) to a JSON body or a handler.
 * Anything else answers an empty list, which every list page renders as its empty state.
 */
export async function mockApi(page: Page, user: MockUser = ADMIN, overrides: Record<string, unknown | Handler> = {}) {
    const defaults: Record<string, unknown> = {
        'POST /auth/login': ok({ token: 'test-token', userId: 'u1', email: 'ana@coop.co', firstName: 'Ana', lastName: 'López', organizationId: 'o1' }),
        'GET /permissions/me': ok({
            userId: 'u1', userName: 'Ana López', isAdmin: !!user.isAdmin, isSuperAdmin: !!user.isSuperAdmin, roles: [{ id: 'r1', name: user.isAdmin ? 'Admin' : 'Asociado' }],
            effectivePermissions: user.permissions.map((code, i) => ({ id: `p${i}`, code, name: code, module: 'menu' })), directOverrides: [],
        }),
        'GET /permissions/user/u1/effective': ok({ userId: 'u1', roles: [{ name: user.isAdmin ? 'Admin' : 'Asociado' }], effectivePermissions: [], directOverrides: [] }),
        'GET /organizations/me': ok({ id: 'o1', name: 'Cooperativa Demo' }),
        'GET /notifications/unread-count': ok({ count: 0 }),
        'GET /applications/pending-count': ok({ count: 0 }),
        'GET /ai/capabilities': ok({ allowed: [], denied: [] }),
        // Demo access is off unless a test turns it on (docs/demo.md).
        'GET /demo': ok({ enabled: false }),
        'GET /platform/demo': ok({ enabled: false, organizations: 0, users: 0 }),
    };
    await page.route(`${API}/**`, async (route) => {
        const url = new URL(route.request().url());
        const key = `${route.request().method()} ${url.pathname.replace(/^\/api/, '')}`;
        const hit = key in overrides ? overrides[key] : defaults[key];
        if (typeof hit === 'function') return (hit as Handler)(route, url);
        await route.fulfill({ json: hit ?? ok([]) });
    });
}

/** Starts the app already signed in (same localStorage keys AuthContext reads). */
export async function signIn(page: Page, extra: Record<string, string> = {}) {
    await page.addInitScript((items) => {
        // Only on the first load of the test: a reload keeps whatever the app stored since.
        if (sessionStorage.getItem('e2e-seeded')) return;
        sessionStorage.setItem('e2e-seeded', '1');
        localStorage.setItem('theme', 'light');
        localStorage.setItem('auth_token', 'test-token');
        localStorage.setItem('auth_user', JSON.stringify({ id: 'u1', name: 'Ana López', email: 'ana@coop.co', role: 'Admin', organizationName: 'Cooperativa Demo' }));
        for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
    }, extra);
}

/** A node of the classification chart as `GET /document-classification` returns it. */
export const classificationNode = (over: Record<string, unknown>) => ({
    parentId: null, isActive: true, managementYears: null, centralYears: null, finalDisposition: null, procedure: null, legalBasis: null,
    retention: null, types: [], children: [], ...over,
});

const OWN_RETENTION = { managementYears: 2, centralYears: 8, finalDisposition: 2, procedure: 'Microfilmar', legalBasis: 'Acuerdo interno 01' };

/** Two sections: ADM with a series that has retention, types, an inheriting subseries and an inactive one; FIN inactive. */
export const CLASSIFICATION_TREE = [
    classificationNode({
        id: 's1', level: 1, code: 'ADM', name: '=Administración',
        children: [
            classificationNode({
                id: 'n1', parentId: 's1', level: 2, code: 'ACT', name: 'Actas', ...OWN_RETENTION, retention: { ...OWN_RETENTION, inherited: false },
                types: [{ id: 't1', name: 'Acta de asamblea' }, { id: 't2', name: 'Citación' }],
                children: [
                    classificationNode({ id: 'n2', parentId: 'n1', level: 3, code: 'ACT-01', name: 'Actas de junta', retention: { ...OWN_RETENTION, inherited: true } }),
                    classificationNode({
                        id: 'n3', parentId: 'n1', level: 3, code: 'ACT-02', name: 'Actas antiguas', isActive: false, managementYears: 1, centralYears: 0, finalDisposition: 1,
                        retention: { managementYears: 1, centralYears: 0, finalDisposition: 1, procedure: null, legalBasis: null, inherited: false },
                    }),
                ],
            }),
            classificationNode({ id: 'n4', parentId: 's1', level: 2, code: 'CON', name: 'Contratos' }),
        ],
    }),
    classificationNode({ id: 's2', level: 1, code: 'FIN', name: 'Finanzas', isActive: false }),
];

/** An open dossier under subseries ACT-01 of CLASSIFICATION_TREE, as a row of `GET /dossiers`. */
export const dossier = (over: Record<string, unknown> = {}) => ({
    id: 'x1', code: 'EXP-ACT-001', title: 'Actas de junta 2026', classificationNodeId: 'n2',
    sectionCode: 'ADM', sectionName: 'Administración', seriesCode: 'ACT', seriesName: 'Actas', subseriesCode: 'ACT-01', subseriesName: 'Actas de junta',
    ownerUserId: 'u2', ownerName: 'Beto Ruiz', openedOn: '2026-01-10', physicalLocation: 'Estante 2, caja 4', status: 'Open',
    itemCount: 2, firstDocumentDate: '2026-01-15', lastDocumentDate: '2026-03-02',
    stage: null, closedOn: null, managementUntil: null, centralUntil: null, finalDisposition: null, ...over,
});

/** What closing adds to a dossier: the dates copied from the retention of that day. */
export const CLOSED_DOSSIER = { status: 'Closed', stage: 'Management', closedOn: '2026-04-01', managementUntil: '2028-04-01', centralUntil: '2036-04-01', finalDisposition: 2 };

export const dossierItem = (over: Record<string, unknown> = {}) => ({
    id: 'i1', position: 1, title: 'Acta 001', documentaryTypeId: 't1', documentaryTypeName: 'Acta de asamblea', documentDate: '2026-01-15',
    fileName: 'acta 001.pdf', contentType: 'application/pdf', sizeBytes: 2_097_152, createdByUserId: 'u2', createdByName: 'Beto Ruiz', createdAt: '2026-01-16T15:00:00Z', ...over,
});

/** `GET /dossiers/{id}`: the row plus today's retention of its series and its documents by position. */
export const dossierDetail = (over: Record<string, unknown> = {}) => ({
    ...dossier(), retention: { ...OWN_RETENTION, inherited: true }, createdAt: '2026-01-10T15:00:00Z', closedByName: null,
    items: [dossierItem(), dossierItem({ id: 'i2', position: 2, title: '=Citación', documentaryTypeId: null, documentaryTypeName: null, documentDate: '2026-03-02', fileName: 'citacion.docx', sizeBytes: 4096 })],
    ...over,
});
