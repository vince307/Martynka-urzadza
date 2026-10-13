import { defineConfig, devices } from '@playwright/test';

// No env file: the game has no backend, no accounts and no secrets (auth: none).
// 4398 is the gate port from context/foundation/autonomous-run.md § 3. Vite preview's
// default 4173 is a protected port on the maintainer's machine, so the preview always
// gets an explicit --port with --strictPort. E2E_PORT overrides it when 4398 is taken.
const PORT = Number(process.env.E2E_PORT ?? 4398);
const baseURL = `http://localhost:${PORT}`;
// Second server: the e2e build with the read-only test hook (E2E_HOOK=1), in dist-e2e/.
// 4397 is not protected (autonomous-run.md § 3); E2E_HOOK_PORT overrides it.
const HOOK_PORT = Number(process.env.E2E_HOOK_PORT ?? 4397);
const hookURL = `http://localhost:${HOOK_PORT}`;
const ROUND_SPEC = /(task-round|narrator|first-launch|adaptive)\.spec\.ts/;

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
            testIgnore: ROUND_SPEC,
        },
        {
            // Same device, but on the e2e build that carries the test hook.
            name: 'chromium-hook',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 }, hasTouch: true, baseURL: hookURL },
            testMatch: ROUND_SPEC,
        },
    ],
    webServer: [
        {
            // Production build + preview: the service worker is registered only in production.
            command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
            url: baseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 180_000,
        },
        {
            // Hook build in its own directory. Never reused: a stale server on this port would
            // carry the same build id (commit SHA) and the spec could not tell old code from new.
            command: `npm run build -- --outDir dist-e2e && npm run preview -- --outDir dist-e2e --port ${HOOK_PORT} --strictPort`,
            env: { E2E_HOOK: '1' },
            url: hookURL,
            reuseExistingServer: false,
            timeout: 180_000,
        },
    ],
});
