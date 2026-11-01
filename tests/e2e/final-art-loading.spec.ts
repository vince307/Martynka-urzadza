// Risk #15 of context/foundation/test-plan.md, change final-art-p2 (S-16c): the start must not hang or break when the loading
// pictures are slow or never come. (a) the loading screen shows the background and the emblem while the rest of the pictures
// are still on the way; (b) loading pictures that never answer leave the drawn screen, and the total limit still starts the
// game exactly once. The hook is read-only (snapshot.loading.art says whether the pictures reached the screen, not how they
// look). The service worker is blocked, otherwise it would answer from its precache and nothing would hang. Runs in the
// chromium-hook project.
import { test, expect, type Page, type Route } from '@playwright/test';
import { screenIs, silenceSpeech, snapshot } from './support/hook';

test.setTimeout(120_000);
test.use({ serviceWorkers: 'block' });

test('#15 S-16c the loading screen shows the background and the emblem while the rest still loads', async ({ page }) => {
    await silenceSpeech(page);
    const held: Route[] = [];
    // A fresh install boots the two choice cards instead of a room (S-28); holding them keeps the loading screen up.
    await page.route('**/assets/choice/*.webp', (route) => {
        held.push(route);
    });
    await page.goto('./?e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    // The choice pictures are held, so the screen is still the loading screen, and both pictures of it are already drawn.
    await expect.poll(async () => (await snapshot(page)).loading?.art, { timeout: 15_000 }).toEqual({ background: true, emblem: true });
    expect((await snapshot(page)).screen).toBe('loading');
    expect(held.length).toBeGreaterThan(0);
    for (const route of held) {
        await route.continue();
    }
    // The released pictures still have to arrive and decode: wait past the default 5 s.
    await expect.poll(async () => (await snapshot(page)).screen, { timeout: 30_000 }).toBe('welcome');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('#15 S-16c loading pictures that never answer leave the drawn screen and the game starts at the limit', async ({ page }) => {
    await silenceSpeech(page);
    const hang = async (target: Page): Promise<void> => {
        await target.route('**/assets/ui/loading-*.webp', () => {});
    };
    await hang(page);
    await page.goto('./?e2eArt=stallall&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    // The pictures never come: the loading screen is the drawn one, with neither picture.
    await expect.poll(async () => (await snapshot(page)).loading?.phase, { timeout: 15_000 }).toBeDefined();
    expect((await snapshot(page)).loading?.art).toEqual({ background: false, emblem: false });
    // The total limit ends the load: the phase reaches `over` or the welcome screen is already there.
    await expect
        .poll(async () => {
            const state = await snapshot(page);
            return state.screen === 'welcome' || state.loading?.phase === 'over';
        }, { timeout: 15_000 })
        .toBe(true);
    await screenIs(page, 'welcome');
    const after = await snapshot(page);
    expect(after.bootLoad!.creates).toBe(1);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
});
