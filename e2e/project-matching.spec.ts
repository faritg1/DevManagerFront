import { expect, test, type Route } from '@playwright/test';
import { ADMIN, mockApi, signIn } from './mockApi';

const ok = (data: unknown) => ({ success: true, message: '', data });

const PROJECT = { id: 'p1', code: 'POR', name: 'Portal', description: null, startDate: null, endDate: null, complexityLevel: 1, status: 1, createdAt: '2026-01-10T15:00:00Z' };
const candidate = (userId: string, fullName: string, matchScore: number) => ({
    userId, fullName, email: `${userId}@coop.co`, matchScore, recommendationReason: 'Cumple los requisitos',
    skillAlignments: [{ skillName: 'React', requiredLevel: 3, currentLevel: 4, isMandatory: true, meets: true }],
});

test('the best candidate button applies that candidate, not whoever is looking', async ({ page }) => {
    const bodies: unknown[] = [];
    await mockApi(page, ADMIN, {
        'GET /projects/p1': ok(PROJECT),
        'GET /Config': ok({ projectStatuses: [], complexityLevels: [], applicationStatuses: [], assignmentStatuses: [], skillLevels: [] }),
        'POST /projects/p1/apply': (route: Route) => {
            bodies.push(route.request().postDataJSON());
            return route.fulfill({ status: 201, json: ok('a1') });
        },
    });
    // Agent endpoints live outside /api, so mockApi does not see them.
    await page.route('**/Agent/match-candidates', (route) => route.fulfill({
        json: ok({
            projectId: 'p1', projectName: 'Portal', analysisNarrative: 'Dos perfiles cumplen',
            candidates: [candidate('u2', 'Beto Ruiz', 95), candidate('u3', 'Carla Díaz', 80)],
        }),
    }));
    await signIn(page); // signed in as u1, Ana López
    await page.goto('/#/projects/p1');

    await page.getByRole('button', { name: 'Más acciones' }).click();
    await page.getByText('Buscar Candidatos IA', { exact: true }).click();
    await page.getByRole('button', { name: 'Postular a Beto Ruiz' }).click();

    await expect(page.getByText('Beto Ruiz fue postulado al proyecto')).toBeVisible();
    expect(bodies).toEqual([{ userId: 'u2', message: 'Postulación recomendada por IA' }]);
});
