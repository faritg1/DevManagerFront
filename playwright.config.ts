import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/** Smoke tests against the Vite dev server; every API call is mocked with page.route (see e2e/mockApi.ts). */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: `npx vite --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        // Unroutable host: a call the mock misses fails fast instead of reaching the deployed API.
        env: { VITE_API_URL: 'http://api.mock/api' },
        timeout: 120_000,
    },
});
