// Risks #15 (a frozen screen with no word: the loading never ends) and #2 (progress is lost: an older tab overwrites a newer
// save) of context/foundation/test-plan.md, change load-and-tab-guard. (a) many hanging pictures, the font and a salon file end
// the loading at the total limit, with the slow line first; (b) a file that answers after the cut does not start the game twice;
// (c) a newer save written by another tab is not overwritten. The ?e2eSave seam is an in-memory store with a write log
// (snapshot.save.store); IndexedDB is never opened from here and a new test = a new browser context = a fresh device. The
// ?e2eArt=stallall seam switches the per-file limit off and shortens the total limit, so only the total limit can end the load.
// Change health-lines-and-smoke p13 adds (d) one stalled money picture (?e2eArt=stall) named in the pictures section with its
// cause (#15 A-9; that the round skips the skill is the unit test of artFilter: ?e2eSkills bypasses the filter) and (e) the cut line
// after a total-limit start (#14 B-4). Strings come from src/data/pl.ts. Runs in the chromium-hook project.
import { test, expect, type Route } from '@playwright/test';
import { gateProblem, openSettings, passWelcome, typeIntoGate } from './support/welcome';
import { answerRight, fromHook, screenIs, silenceSpeech, snapshot, tapScene } from './support/hook';
import { pl } from '../../src/data/pl';
import { FONT_KEY } from '../../src/data/layout';
import { SAVE_VERSION } from '../../src/core/save';

test.setTimeout(120_000);

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

test.describe('files that never answer', () => {
    // The service worker would answer from its precache and nothing would hang.
    test.use({ serviceWorkers: 'block' });


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

    // Risk #15 (a stalled start leaves the child on stand-ins), change audit-boot-hidden-tab (H-1): the total limit counts the time
    // the tab was VISIBLE. A tab hidden during the load does not run the loader queue, so hidden time must not count toward the cut.
    // The visibility is faked (document.hidden / visibilityState are redefined, then visibilitychange is dispatched): the rule under
    // test is the scene's subtraction of the hidden span, not the browser's visibility, which a headless run cannot flip.
    test('#15 H-1 a tab hidden during the load does not cut it; the cut comes when it is shown and the panel says the game was in the background', async ({ page }) => {
        await silenceSpeech(page);
        await hold(page);
        await page.addInitScript(() => {
            const state = { hidden: false };
            Object.defineProperty(window, '__fakeTab', { value: state, configurable: true });
            Object.defineProperty(document, 'hidden', { get: () => state.hidden, configurable: true });
            Object.defineProperty(document, 'visibilityState', { get: () => (state.hidden ? 'hidden' : 'visible'), configurable: true });
        });
        const setHidden = (hidden: boolean): Promise<number> =>
            page.evaluate((value) => {
                (window as unknown as { __fakeTab: { hidden: boolean } }).__fakeTab.hidden = value;
                document.dispatchEvent(new Event('visibilitychange'));
                return performance.now();
            }, hidden);
        await page.goto('/?e2eArt=stallall&e2eVariant=off');
        await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
        // Hidden before the 3 s total limit (the e2e seam) has passed in visible time.
        expect((await snapshot(page)).screen).toBe('loading');
        const hiddenAt = await setHidden(true);
        // Stay hidden for more than the total limit in wall time: polled against the page clock, never a fixed sleep.
        await page.waitForFunction((from) => performance.now() - from > 3600, hiddenAt, { timeout: 15_000, polling: 100 });
        const still = await snapshot(page);
        expect(still.screen).toBe('loading');
        expect(still.bootLoad ?? null).toBeNull();
        // Shown again: the remaining visible time runs out and the cut comes.
        const shownAt = await setHidden(false);
        await expect.poll(async () => (await snapshot(page)).screen, { timeout: 15_000 }).toBe('welcome');
        const spanMs = shownAt - hiddenAt;
        const boot = (await snapshot(page)).bootLoad!;
        expect(boot.hiddenMs).toBeGreaterThanOrEqual(Math.floor(spanMs) - 50);
        expect(boot.elapsedMs).toBeGreaterThanOrEqual(3000 + boot.hiddenMs - 50);
        expect(boot.cut.length).toBeGreaterThan(0);

        // The settings panel names the background, not the plain cut line. The parent path from the screen the cut left.
        const { parent } = await fromHook(page, 'targets');
        await tapScene(page, parent!);
        await typeIntoGate(page, (await gateProblem(page)).product);
        const start = page.getByRole('dialog', { name: 'Ustawienia startowe' });
        await expect(start).toBeVisible();
        await start.getByRole('button', { name: '10+', exact: true }).tap();
        await start.getByRole('button', { name: 'Klasa 2, I półrocze', exact: true }).tap();
        await start.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();
        await screenIs(page, 'task');
        const panel = await openSettings(page);
        await expect(panel.getByText(pl.settings.artCutBackground, { exact: true })).toBeVisible();
        await expect(panel.getByText(pl.settings.artCut, { exact: true })).toHaveCount(0);
    });
});

test.describe('a picture that stalls, alone and with all', () => {
    test.use({ serviceWorkers: 'block' });

    test('#15 A-9 one stalled money picture ends by its own limit and the panel names the folder and the cause', async ({ page }) => {
        await silenceSpeech(page);
        // One coin file never answers; the per-file limit of ?e2eArt=stall (2 s, no retry) ends it.
        await page.route('**/assets/tasks/money/coin-1zl.webp', () => {});
        await passWelcome(page, { e2eArt: 'stall', e2eVariant: 'off' });
        await expect.poll(async () => (await snapshot(page)).artHealth?.missing).toBe(1);
        // The game started by itself, no card.
        await expect(page.getByRole('alertdialog')).toHaveCount(0);

        const panel = await openSettings(page);
        await expect(panel.getByText(pl.settings.artFolders('money', 1), { exact: true })).toBeVisible();
        await expect(panel.getByText(pl.settings.artSkipped, { exact: true })).toBeVisible();
        // A timeout is told as a connection problem, never as "not on the server", and a restart is advised.
        await expect(panel.getByText(pl.settings.artCause.network, { exact: true })).toBeVisible();
        await expect(panel.getByText(pl.settings.artCause.fetch, { exact: true })).toHaveCount(0);
        await expect(panel.getByText(pl.settings.artRestart, { exact: true })).toBeVisible();
    });

    test('#14 B-4 a cut start says some pictures did not finish', async ({ page }) => {
        await silenceSpeech(page);
        await hold(page);
        await passWelcome(page, { e2eArt: 'stallall', e2eVariant: 'off' });
        const boot = (await snapshot(page)).bootLoad!;
        expect(boot.cut.length).toBeGreaterThan(0);
        // Only the total limit (3 s under this seam) can have ended the load.
        expect(boot.elapsedMs).toBeGreaterThanOrEqual(3000);

        const panel = await openSettings(page);
        await expect(panel.getByText(pl.settings.artCut, { exact: true })).toBeVisible();
        // The files the limit cut have the cause `cut` (visual gate VG-1): the cut line says it all, no second
        // connection line and no second restart advice, and the code is `cut`.
        await expect(panel.getByText(pl.settings.artCause.network, { exact: true })).toHaveCount(0);
        await expect(panel.getByText(pl.settings.artRestart, { exact: true })).toHaveCount(0);
        await expect(panel.locator('section.parent-art').getByText(/^Kod: cut /)).toBeVisible();
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
