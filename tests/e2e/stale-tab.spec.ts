// Risk #2 (progress is lost: an older window overwrites a newer save) of context/foundation/test-plan.md, change
// stale-tab-and-health (finding B-1). Seed: tests/e2e/save-transfer.spec.ts (reset through the parent panel) and
// tests/e2e/load-and-tab-guard.spec.ts (the card for a refused write). Two pages of ONE browser context share the real
// IndexedDB (no ?e2eSave store): (a) the child-facing outcome, a window that saved later wins and the stale one stops with the
// calm card; (b) the data rule, a reset in one window is not undone by a round finished in the other. IndexedDB is never
// opened from here: the saved state is read through the read-only hook of each page, and a new page of the same context is
// the "restart". Strings come from src/data/pl.ts. Runs in the chromium-hook project.
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { answerRight, fromHook, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapTarget } from './support/hook';
import { pl } from '../../src/data/pl';

test.setTimeout(120_000);

// One query for every page, or the 4th ordinary round would be the daily puzzle (S-15) and the pages would differ.
const QUERY = '/?e2eMonth=10&e2eVariant=off';

/** A round of 5 played right, written at its end; the page stands on the summary afterwards. */
async function playSavedRound(page: Page): Promise<void> {
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ lastReason: 'now', dirty: false, blockedBy: null });
}

/** The child answers one task in the stale window: a change of the saved state, whose write is refused (the card may rise at once and hold the input). */
async function staleWork(page: Page): Promise<void> {
    await phaseIs(page, 'first');
    await answerRight(page);
}

/** A second window of the same browser: it loads the save the first one wrote and stands on the task screen. */
async function openWindow(page: Page): Promise<Page> {
    const other = await page.context().newPage();
    await silenceSpeech(other);
    await other.goto(QUERY);
    await other.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(other, 'task');
    expect((await snapshot(other)).save?.load).toBe('loaded');
    return other;
}

test('#2 B-1 a second window that saved later wins; the stale one stops and shows the card', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10', e2eVariant: 'off' });
    await playSavedRound(page);
    const s1 = (await snapshot(page)).stars;
    expect(s1).toBeGreaterThan(0);
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');

    // Window B starts from A's save, earns more and saves it.
    const second = await openWindow(page);
    expect((await snapshot(second)).stars).toBe(s1);
    await playSavedRound(second);
    const s2 = (await snapshot(second)).stars;
    expect(s2).toBeGreaterThan(s1);

    // Window A, which never saw B's write, finishes a round: its write is refused.
    await page.bringToFront();
    await staleWork(page);
    await expect.poll(async () => (await snapshot(page)).save?.blockedBy).toBe('otherTab');
    await expect(page.getByRole('alertdialog').getByText(pl.saveRefused.title)).toBeVisible();

    // B is untouched: it keeps writing and its stars are the newest.
    const kept = await snapshot(second);
    expect(kept.save?.blockedBy).toBeNull();
    expect(kept.stars).toBe(s2);

    // A restart (a new window) brings back B's stars, not A's.
    const third = await openWindow(page);
    expect((await snapshot(third)).stars).toBe(s2);
    await expect(third.getByRole('alertdialog')).toHaveCount(0);
});

test('#2 B-1 a reset in one window is not undone by the other', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10', e2eVariant: 'off' });
    await playSavedRound(page);
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');
    const second = await openWindow(page);

    // Window A: the parent resets through the settings dialog; the page reloads onto the welcome screen.
    await page.bringToFront();
    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(dialog).toBeVisible();
    const loaded = page.waitForEvent('load', { timeout: 15_000 });
    await dialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true }).tap();
    await loaded;
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'welcome');
    expect((await snapshot(page)).learner).toBeNull();

    // Window B still shows the old game; finishing a round there must not bring the old save back.
    await second.bringToFront();
    await staleWork(second);
    await expect.poll(async () => (await snapshot(second)).save?.blockedBy).toBe('otherTab');

    // A restart loads the fresh game: the welcome screen and no learner (the old one was not written back).
    const third = await page.context().newPage();
    await silenceSpeech(third);
    await third.goto(QUERY);
    await third.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(third, 'welcome');
    expect((await fromHook(third, 'snapshot')).learner).toBeNull();
});
