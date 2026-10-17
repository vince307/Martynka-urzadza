// Risk #2 (progress is lost: an older window overwrites a newer save) of context/foundation/test-plan.md, change
// stale-tab-and-health (finding B-1). Seed: tests/e2e/save-transfer.spec.ts (reset through the parent panel) and
// tests/e2e/load-and-tab-guard.spec.ts (the card for a refused write). Two pages of ONE browser context share the real
// IndexedDB (no ?e2eSave store): (a) the child-facing outcome, a window that saved later wins and the stale one stops with the
// calm card; (b) the data rule, a reset in one window is not undone by a round finished in the other. IndexedDB is never
// opened from here: the saved state is read through the read-only hook of each page, and a new page of the same context is
// the "restart". Strings come from src/data/pl.ts. Runs in the chromium-hook project.
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { answerRight, fromHook, playRoundRight, screenIs, silenceSpeech, snapshot, tapTarget } from './support/hook';
import { pl } from '../../src/data/pl';

test.setTimeout(120_000);

// One query for every page, or the 4th ordinary round would be the daily puzzle (S-15) and the pages would differ.
const QUERY = '/?e2eMonth=10&e2eVariant=off';

/** A round of 5 played right, written at its end; the page stands on the summary afterwards. */
async function playSavedRound(page: Page): Promise<void> {
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ lastReason: 'now', dirty: false, blockedBy: null });
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

    // Window A never saw B's write, but B told it through the save channel (save-truth p8): A stops before it writes anything.
    await page.bringToFront();
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

    // Window B still shows the old game; A's reset told it through the save channel, so it stops and cannot bring the old save back.
    await second.bringToFront();
    await expect.poll(async () => (await snapshot(second)).save?.blockedBy).toBe('otherTab');

    // A restart loads the fresh game: the welcome screen and no learner (the old one was not written back).
    const third = await page.context().newPage();
    await silenceSpeech(third);
    await third.goto(QUERY);
    await third.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(third, 'welcome');
    expect((await fromHook(third, 'snapshot')).learner).toBeNull();
});

// save-truth p14. Both pages start from A's save; B plays and saves; A is then stopped.

/** Window A plays one saved round and stands on the task screen; window B opens from that save. */
async function twoWindows(page: Page): Promise<{ second: Page; s1: number }> {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10', e2eVariant: 'off' });
    await playSavedRound(page);
    const s1 = (await snapshot(page)).stars;
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');
    return { second: await openWindow(page), s1 };
}

test('#2 T-2 a second window\'s save stops the first before it writes', async ({ page }) => {
    const { second } = await twoWindows(page);
    const writesBefore = (await snapshot(page)).save?.writes;
    expect(writesBefore).toBeGreaterThan(0);

    await playSavedRound(second);

    // No action in window A: the message from B alone stops it, and it wrote nothing meanwhile.
    await page.bringToFront();
    await expect.poll(async () => (await snapshot(page)).save?.blockedBy).toBe('otherTab');
    await expect(page.getByRole('alertdialog').getByText(pl.saveRefused.title)).toBeVisible();
    expect((await snapshot(page)).save?.writes).toBe(writesBefore);
    expect((await snapshot(page)).save?.failures).toBe(0);
});

test('#2 T-5 the refusal card names its code', async ({ page }) => {
    const { second } = await twoWindows(page);
    await playSavedRound(second);

    await page.bringToFront();
    const card = page.getByRole('alertdialog');
    await expect(card.getByText(pl.saveRefused.title)).toBeVisible();
    const build = await page.locator('#game-container').getAttribute('data-build');
    expect(build).toBeTruthy();
    await expect(card.getByText(pl.saveFailed.detail('OtherWriterSave', build!))).toBeVisible();
});

// Added by the orchestrator, run 2026-10-16-audit-sweep. Without BroadcastChannel (iPadOS before 15.4) the write-time rule
// in the store is the only guard: the stale window's own write is refused and the newer save stays.
test('#2 B-1 without BroadcastChannel the stale window\'s own write is refused', async ({ page }) => {
    await page.context().addInitScript(() => {
        delete (window as unknown as { BroadcastChannel?: unknown }).BroadcastChannel;
    });
    const { second } = await twoWindows(page);
    expect(await page.evaluate(() => typeof BroadcastChannel)).toBe('undefined');
    expect(await second.evaluate(() => typeof BroadcastChannel)).toBe('undefined');

    await playSavedRound(second);
    const s2 = (await snapshot(second)).stars;

    // No message reached A: it is not stopped until its own state changes and it tries to write.
    await page.bringToFront();
    expect((await snapshot(page)).save?.blockedBy).toBeNull();
    await answerRight(page);
    await expect.poll(async () => (await snapshot(page)).save?.blockedBy).toBe('otherTab');
    await expect(page.getByRole('alertdialog').getByText(pl.saveRefused.title)).toBeVisible();

    // B's progress is what the store holds: a new window loads B's stars, not A's.
    const third = await openWindow(page);
    expect((await snapshot(third)).stars).toBe(s2);
});
