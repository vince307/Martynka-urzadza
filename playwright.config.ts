import { defineConfig, devices } from '@playwright/test';

// No env file: the game has no backend, no accounts and no secrets (auth: none).
// 4398 is the gate port from context/foundation/autonomous-run.md § 3. Vite preview's
// default 4173 is a protected port on the maintainer's machine, so the preview always
// gets an explicit --port with --strictPort. E2E_PORT overrides it when 4398 is taken.
const PORT = Number(process.env.E2E_PORT ?? 4398);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'html' : 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            // Desktop Chromium with touch: an Android device profile would show the
            // "add to home screen" hint over the canvas. Service workers are only
            // automatable in Chromium, so the iPad (WebKit) stays a manual check.
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 }, hasTouch: true },
        },
    ],
    webServer: {
        // Production build + preview: the service worker is registered only in production.
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
