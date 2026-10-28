// Seed for risk #8 (context/foundation/test-plan.md): the server side is right, but the
// browser does not boot the game from the service worker cache once the network is gone.
// Every later e2e test copies this pattern: wait for state (never for time), assert on what
// the child would see, name the test after the risk.
import { test, expect } from '@playwright/test';
import { TASK_ART } from '../../src/data/taskArt';

// The game is served under /graj/ like in production (playwright.config.ts baseURL, landing page at "/").
const APP = '/graj/';

test('the game boots offline from the service worker cache', async ({ page, context }) => {
    // Setup: the first, online launch installs the service worker and precaches the build.
    await page.goto('./');
    const container = page.locator('#game-container');
    const buildId = await container.getAttribute('data-build');
    expect(buildId).toBeTruthy();
    // Going offline before the worker controls the page would test nothing: the reload
    // would simply fail. clientsClaim makes the active worker take the page over.
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    // The worker is the game's own: sw.js under /graj/ with scope /graj/, so it can never take over the landing page at "/".
    const registration = await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return { scope: reg?.scope, script: navigator.serviceWorker.controller?.scriptURL };
    });
    expect(new URL(registration.scope!).pathname).toBe(APP);
    expect(new URL(registration.script!).pathname).toBe(`${APP}sw.js`);

    // Action: cut the network and launch again.
    await context.setOffline(true);
    const servedBySw: string[] = [];
    const servedByNetwork: string[] = [];
    const failed: string[] = [];
    let objectUrls = 0;
    // Requested by the page itself (not by the worker's install, which fetches both formats and the music into the precache).
    const soundRequests: string[] = [];
    page.on('request', (request) => {
        const path = new URL(request.url()).pathname;
        if (path.startsWith(`${APP}assets/sounds/`)) {
            soundRequests.push(path);
        }
    });
    page.on('requestfailed', (request) => {
        failed.push(new URL(request.url()).pathname);
    });
    page.on('response', (response) => {
        // Phaser's loader turns each fetched image into a blob: object URL; that is the browser's
        // own memory, not a network or worker response, so it is counted apart (and must happen).
        const url = new URL(response.url());
        if (url.protocol === 'blob:' || url.protocol === 'data:') {
            objectUrls += 1;
            return;
        }
        (response.fromServiceWorker() ? servedBySw : servedByNetwork).push(url.pathname);
    });
    await page.reload();

    // Assertion: the same build boots, the canvas is drawn, and the page and every hashed
    // bundle came from the worker's cache. A green reload without fromServiceWorker proves
    // nothing (risk #8, Risk Response Guidance).
    await expect(container).toHaveAttribute('data-build', buildId!);
    await expect(container.locator('canvas')).toBeVisible();
    expect(servedByNetwork).toEqual([]);
    expect(failed.filter((path) => path.startsWith(`${APP}assets/`) || path.startsWith(`${APP}_app/`))).toEqual([]);
    expect(servedBySw).toContain(APP);
    expect(servedBySw.filter((path) => path.startsWith(`${APP}_app/`) && path.endsWith('.js')).length).toBeGreaterThanOrEqual(2);

    // The task drawings (S-14) are loaded at start, so each one must come from the worker's cache too: one file
    // missing from the precache fails this by name. The decoded images show up as object URLs.
    await expect.poll(() => TASK_ART.filter((art) => !servedBySw.includes(`${APP}${art.url}`)).map((art) => art.url)).toEqual([]);
    await expect.poll(() => objectUrls).toBeGreaterThanOrEqual(TASK_ART.length);

    // The sounds (S-16b): the effects load at start, one format per effect, never the music; each came from the worker's cache.
    const soundFiles = [...new Set(soundRequests)];
    await expect.poll(() => new Set(soundRequests).size).toBe(12);
    expect(soundFiles.some((path) => path.includes('music-loop'))).toBe(false);
    await expect.poll(() => soundRequests.filter((path) => !servedBySw.includes(path))).toEqual([]);

    // Cleanup: back online, so nothing leaks into the next test (each test gets a fresh context anyway).
    await context.setOffline(false);
});
