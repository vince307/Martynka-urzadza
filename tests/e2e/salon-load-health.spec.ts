// Risks #2 (progress survives an update) and #15 (a frozen screen with no word) of context/foundation/test-plan.md, change
// salon-load-health. (a) a salon saved under the old task list as v2 is written as v4 at start, copy first, with no child
// action; (b) a v1 save is written as v4 at start; (c) a picture file that never answers ends the loading after the loader limit.
// The ?e2eSave seam is an in-memory store with a write log (snapshot.save.store); IndexedDB is never opened from here and a
// new test = a new browser context = a fresh device. On the welcome screen the hook snapshot has only screen, learner,
// settings, inputEnabled, save and artHealth, so the room-level reads come after passWelcome. Strings come from src/data/pl.ts.
// Runs in the chromium-hook project.
import { test, expect } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { screenIs, silenceSpeech, snapshot } from './support/hook';
import { pl } from '../../src/data/pl';
import { SAVE_VERSION } from '../../src/core/save';

test.setTimeout(120_000);

test('#2 H-1/M-3 a salon saved under the old list as v2 is written as v4 at start, copy first, with no child action', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('/?e2eSave=legacy-salon&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    // No tap: the start write comes from the autosaver alone.
    await screenIs(page, 'welcome');
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null).toBe(SAVE_VERSION);
    const save = (await snapshot(page)).save!;
    expect(save.store!.ops.slice(0, 2)).toEqual(['backup', 'write']);
    expect(save.migratedFrom).toBe(2);
    expect(save.migrationWrittenAt).not.toBeNull();
    expect(save.lastReason).toBe('migration');

    // After the welcome the parent is told about the move (the gear exists on the task screen).
    await passWelcome(page, { e2eSave: 'legacy-salon', e2eVariant: 'off' });
    const panel = await openSettings(page);
    await expect(panel.locator('section.parent-save').getByText(pl.settings.saveMigrated.kept(2))).toBeVisible();
});

test('#2 M-3 a v1 save is written as v4 at start', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('/?e2eSave=v1&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    // No round played: the write at start is the only way the store gets v3.
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null).toBe(SAVE_VERSION);
    const store = (await snapshot(page)).save!.store!;
    expect(store.ops.filter((op) => op === 'backup')).toHaveLength(1);
    expect(store.ops[0]).toBe('backup');
});

test.describe('picture that never answers', () => {
    test.use({ serviceWorkers: 'block' });

    test('#15 H-2 a picture that never answers ends the loading after the limit and is counted as missing', async ({ page }) => {
        await silenceSpeech(page);
        // The request is held open: the file hangs instead of failing.
        await page.route('**/assets/rooms/salon/furnishings-before.webp', () => {});
        await passWelcome(page, { e2eArt: 'stall', e2eVariant: 'off' });
        await expect.poll(async () => (await snapshot(page)).roomArtHealth?.missing ?? 0).toBeGreaterThanOrEqual(1);
        const health = (await snapshot(page)).roomArtHealth!;
        expect(health.total).toBeGreaterThan(health.missing);
        await screenIs(page, 'task');
    });
});
