import { expect, test } from '@playwright/test';
import { mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });

const CODES = [
    'menu.platform', 'menu.platform.projects', 'menu.platform.projects.create', 'menu.platform.projects.edit',
    'menu.platform.dashboard', 'menu.solidarity', 'menu.solidarity.associates',
    'menu.solidarity.associates.create', 'menu.solidarity.associates.edit', 'menu.admin', 'menu.admin.audit', 'menu.admin.roles',
];

/** Profile endpoints with two roles and a dozen permissions. */
const profileMocks = {
    'GET /profile/me': ok({ userId: 'u1', bio: 'Desarrolladora full stack.', yearsExperience: 6, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '2026-01-01' }),
    'GET /permissions/user/u1/effective': ok({
        userId: 'u1', roles: [{ name: 'Admin' }, { name: 'Gestor' }], directOverrides: [],
        effectivePermissions: CODES.map((code) => ({ code })),
    }),
};

test('profile shows a roles summary and reveals permissions only on demand', async ({ page }) => {
    await mockApi(page, undefined, profileMocks);
    await signIn(page);
    await page.goto('/#/profile');

    const toggle = page.getByRole('button', { name: '12 permisos' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Gestor', { exact: true })).toBeVisible();
    const detail = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
    await expect(detail).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Gestión Solidaria' })).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('heading', { name: 'Gestión Solidaria' })).toBeVisible();
    await expect(detail.getByRole('listitem').filter({ hasText: 'Asociados' })).toContainText('create');
});
