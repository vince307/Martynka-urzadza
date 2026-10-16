// Risks #15 (a frozen screen with no word: the loading never ends) and #2 (progress is lost: an older tab overwrites a newer
// save) of context/foundation/test-plan.md, change load-and-tab-guard. (a) many hanging pictures, the font and a salon file end
// the loading at the total limit, with the slow line first; (b) a file that answers after the cut does not start the game twice;
// (c) a newer save written by another tab is not overwritten. The ?e2eSave seam is an in-memory store with a write log
// (snapshot.save.store); IndexedDB is never opened from here and a new test = a new browser context = a fresh device. The
// ?e2eArt=stallall seam switches the per-file limit off and shortens the total limit, so only the total limit can end the load.
// Strings come from src/data/pl.ts. Runs in the chromium-hook project.
import { test, expect, type Route } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, screenIs, silenceSpeech, snapshot } from './support/hook';
import { pl } from '../../src/data/pl';
import { FONT_KEY } from '../../src/data/layout';
import { SAVE_VERSION } from '../../src/core/save';

test.setTimeout(120_000);

test.describe('files that never answer', () => {
    // The service worker would answer from its precache and nothing would hang.
    test.use({ serviceWorkers: 'block' });

    const hold = async (page: import('@playwright/test').Page): Promise<{ font: Route[]; room: Route[] }> => {
        const held = { font: [] as Route[], room: [] as Route[] };
        await page.route('**/assets/tasks/money/*.webp', () => {});
        await page.route('**/fonts/*.ttf', (route) => {
            held.font.push(route);
        });
        await page.route('**/assets/rooms/salon/*.webp', (route) => {
            held.room.push(route);
        });
        return held;
    };

    test('#15 A-1/A-2 many hanging pictures, the font and a salon file end the loading at the total limit, with the slow line first', async ({ page }) => {
        await silenceSpeech(page);
        await hold(page);
        await page.goto('/?e2eArt=stallall&e2eVariant=off');
        await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
        // The slow line comes before the cut: the screen is still the loading screen.
        await expect.poll(async () => (await snapshot(page)).loading?.phase).toBe('slow');
        expect((await snapshot(page)).screen).toBe('loading');
        // Then the total limit ends the load and the welcome screen shows. The cut runs on the game clock, which falls behind
        // under 4 workers: wait past it like the next test, not the default 5 s (impl-review S-16c, one red run).
        await expect.poll(async () => (await snapshot(page)).screen, { timeout: 15_000 }).toBe('welcome');
        const after = await snapshot(page);
        expect(after.artHealth!.missing).toBeGreaterThanOrEqual(1);
        expect(after.bootLoad!.cut).toContain(FONT_KEY);
        expect(after.bootLoad!.cut.some((key) => key.includes('salon'))).toBe(true);
        expect(after.bootLoad!.creates).toBe(1);
        // No error card follows.
        await expect(page.getByRole('alertdialog')).toHaveCount(0);
        expect((await snapshot(page)).screen).toBe('welcome');
    });

    test('#15 A-1 a file that answers after the cut does not start the game twice', async ({ page }) => {
        await silenceSpeech(page);
        const held = await hold(page);
        await page.goto('/?e2eArt=stallall&e2eVariant=off');
        await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
        // The cut comes at the e2e total limit after the page load: wait past it, not the default 5 s.
        await expect.poll(async () => (await snapshot(page)).screen, { timeout: 15_000 }).toBe('welcome');
        expect(held.font.length).toBeGreaterThan(0);
        // The late answers: the font settles for real, the salon file's request was aborted by the cut.
        for (const route of held.font) {
            await route.continue();
        }
        for (const route of held.room) {
            await route.continue().catch(() => undefined);
        }
        // The late font really settles (the browser reports it loaded), and only then is the state read.
        await page.waitForFunction((family) => [...document.fonts].some((face) => face.family.includes(family) && face.status === 'loaded'), FONT_KEY, { timeout: 10_000 });
        await screenIs(page, 'welcome');
        expect((await snapshot(page)).bootLoad!.creates).toBe(1);
        await expect(page.getByRole('alertdialog')).toHaveCount(0);
    });
});

test('#2 P-5 a newer save written by another tab is not overwritten', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSave: 'newer', e2eVariant: 'off' });
    // The first write succeeded at start. Answering one task earns a star, a change to the state: the next write is refused as
    // NewerSave, and the child sees the calm card at once (change stale-tab-and-health, B-2), which holds the game's input.
    await expect.poll(async () => (await snapshot(page)).phase).toBe('first');
    await answerRight(page);
    await expect.poll(async () => (await snapshot(page)).save?.blockedBy).toBe('newer');
    await expect(page.getByRole('alertdialog').getByText(pl.saveRefused.title)).toBeVisible();
    const blocked = (await snapshot(page)).save!;
    expect(blocked.store!.writtenVersion).toBe(SAVE_VERSION + 1);
    const writesAtBlock = blocked.store!.ops.filter((op) => op === 'write').length;
    // The block holds: nothing writes again, however long the page waits.
    await page.waitForTimeout(1500);
    const later = (await snapshot(page)).save!;
    expect(later.blockedBy).toBe('newer');
    expect(later.store!.writtenVersion).toBe(SAVE_VERSION + 1);
    expect(later.store!.ops.filter((op) => op === 'write').length).toBe(writesAtBlock);
    // One card per page load.
    await expect(page.getByRole('alertdialog')).toHaveCount(1);
});
