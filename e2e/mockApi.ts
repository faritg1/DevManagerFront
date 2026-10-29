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
