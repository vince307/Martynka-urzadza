// Risks #8 (the offline promise is silently untrue: the worker never takes control) and #14 (the parent's panel claims a health
// it does not have) of context/foundation/test-plan.md, change stale-tab-and-health (findings P-1, G-1). Seed:
// tests/e2e/art-stand-in.spec.ts (panel counts missing pictures) and tests/e2e/final-art-wallet.spec.ts (serviceWorkers 'block'
// plus page.route). (a) runs with the service worker allowed: the hook build is a production build, so Chromium really installs
// the worker and the panel's offline line reads it through the reducer. (b) blocks the worker so page.route reaches the real
// loader: one screen picture is aborted before the first load. Strings come from src/data/pl.ts; the panel is a DOM overlay.
import { test, expect } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { silenceSpeech, snapshot } from './support/hook';
import { pl } from '../../src/data/pl';
import { UI_ART } from '../../src/data/uiArt';

test.setTimeout(90_000);

test('#8 P-1 after the worker installs the panel says the game starts offline', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10', e2eVariant: 'off' });
    await expect.poll(async () => (await snapshot(page)).sw?.phase, { timeout: 30_000 }).toBe('ready');

    const panel = await openSettings(page);
    await expect(panel.getByText(pl.settings.offline.heading, { exact: true })).toBeVisible();
    await expect(panel.getByText(pl.settings.offline.ready, { exact: true })).toBeVisible();
    await expect(panel.getByText(pl.settings.offline.installing, { exact: true })).toHaveCount(0);
});

test.describe('screen pictures', () => {
    test.use({ serviceWorkers: 'block' });

    test('#14 G-1 a screen picture that did not load is named in the pictures section', async ({ page }) => {
        await page.route('**/assets/ui/wallet-open.webp', (route) => route.abort());
        await silenceSpeech(page);
        await passWelcome(page, { e2eMonth: '10', e2eVariant: 'off' });
        const total = UI_ART.length;

        const panel = await openSettings(page);
        await expect(panel.getByText(pl.settings.uiArtMissing(1, total), { exact: true })).toBeVisible();
        await expect(panel.getByText(pl.settings.uiArtOk, { exact: true })).toHaveCount(0);
        // The task pictures are a separate count and all loaded.
        await expect(panel.getByText(pl.settings.artOk, { exact: true })).toBeVisible();
    });
});
