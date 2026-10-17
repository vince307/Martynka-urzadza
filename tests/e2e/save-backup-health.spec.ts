// Risk #2 (progress is never lost) of context/foundation/test-plan.md, change save-v2-backup-health: a v1 save whose copy always
// fails, a store whose write never answers, and a read that answers late. The core rules (copy policy, time limits, `waitLonger`)
// are unit-tested; this spec proves them with the real autosaver, dialogs and start card in the browser.
// The ?e2eSave switch (e2e build only) replaces IndexedDB with an in-memory store that logs its operations; IndexedDB is never
// opened here and a new test = a new browser context = a fresh device. Limits are shortened by the e2e build: reads 300 ms, the
// second read limit 5000 ms, writes 300 ms; under ?e2eSave=slow the read answers after 2500 ms (E2E_SLOW_READ_MS in
// src/testing/e2eHook.ts; the number is repeated below because that module imports Phaser). Strings come from src/data/pl.ts.
// Runs in the chromium-hook project.
import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { chooseFile, openImport } from './support/saveImport';
import { fromHook, playRoundRight, playTaskRight, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { pl } from '../../src/data/pl';
import { SAVE_VERSION } from '../../src/core/save';

test.setTimeout(120_000);

const V1_STARS = 7; // tests/fixtures/save-v1.json (the ?e2eSave=v1 store)

const SLOW_READ_MS = 2500; // E2E_SLOW_READ_MS (room for two taps under load before the read answers)
const SLOWER_LIMIT_MS = 5000; // E2E_SLOWER_LOAD_TIMEOUT_MS

/** Loads a page whose store answers slowly or never: the start card with "Poczekaj dłużej" is on screen. */
async function openSlowCard(page: Page, mode: 'slow' | 'hang' | 'slowfail') {
    await silenceSpeech(page);
    await page.goto(`/?e2eSave=${mode}&e2eVariant=off`);
    const card = page.getByRole('alertdialog', { name: pl.saveSlow.title });
    await expect(card).toBeVisible();
    return card;
}

/** From the welcome screen taps the first age (E1, no warm-up): a task is on screen. */
async function startAsChild(page: Page): Promise<void> {
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'welcome');
    let age: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            age = (await targets(page)).ages?.[0];
            return age !== undefined;
        })
        .toBe(true);
    await tapScene(page, age!);
    await screenIs(page, 'task');
}

test('#2 SV2-01 a v1 save whose copy always fails is written as v4 after three tries', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('/?e2eSave=backupfail&e2eMonth=10&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await fromHook(page, 'snapshot');
    await screenIs(page, 'task');
    expect((await snapshot(page)).save).toMatchObject({ load: 'loaded', migratedFrom: 1 });
    // The start write (audit M-3) may already have used the first copy try: the copy is owed, not yet done.
    expect(['pending', 'failed']).toContain((await snapshot(page)).save?.backup);

    // Rounds until the third failed copy: a round is several save attempts, so one is normally enough.
    for (let round = 0; round < 3 && (await snapshot(page)).save?.backup !== 'skipped'; round++) {
        await playRoundRight(page, 5);
        if (round < 2) {
            await tapTarget(page, 'nextRound');
            await expect.poll(async () => (await snapshot(page)).screen).not.toBe('summary');
            if ((await snapshot(page)).screen === 'unlock') await tapTarget(page, 'unlockNext');
            await screenIs(page, 'task');
        }
    }
    await expect.poll(async () => (await snapshot(page)).save?.backup).toBe('skipped');
    const save = (await snapshot(page)).save!;
    // save-truth p5: the progress is written first, each failed copy follows a write.
    expect(save.store!.writtenVersion).toBe(SAVE_VERSION);
    expect(save.store!.ops[0]).toBe('write');
    expect(save.store!.ops.filter((op) => op === 'backup')).toHaveLength(3);
    expect(save).toMatchObject({ backup: 'skipped', backupError: 'QuotaExceededError', blocked: false });

    // The parent is told that the move happened and the old copy could not be kept, with the code to quote.
    const panel = await openSettings(page);
    const section = panel.locator('section.parent-save');
    await expect(section.getByText(pl.settings.saveMigrated.lost(1))).toBeVisible();
    await expect(section.getByText(/^Kod: QuotaExceededError · Wersja /)).toBeVisible();
});

test('#2 SV2-02 a write that never answers is a named failure and the reset dialog comes back', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSave: 'writehang' });
    await expect.poll(async () => (await snapshot(page)).save?.lastFailure).toEqual({ stage: 'write', error: 'timeout' });
    // A marker on this page load: it is gone only if the page really reloaded.
    await page.evaluate(() => {
        (window as unknown as { __beforeReset: boolean }).__beforeReset = true;
    });

    const panel = await openSettings(page);
    await expect(panel.locator('section.parent-save')).toHaveAttribute('data-state', 'failing');
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true }).tap();

    // The write hangs: Escape in the middle of it must not close the dialog.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    // The limit passes: the dialog says the game got no confirmation (not "bez zmian": the write may still land) and "Zamknij" is the way out; no reload.
    await expect(dialog.getByText(pl.saveTransfer.replaceUnconfirmed)).toBeVisible();
    const close = dialog.getByRole('button', { name: pl.saveTransfer.close, exact: true });
    await expect(close).toBeEnabled();
    expect(await page.evaluate(() => '__beforeReset' in window)).toBe(true);
    await close.tap();
    await expect(dialog).toBeHidden();
    await screenIs(page, 'task');
});

test('#2 SRR-02 a slow read can be waited for', async ({ page }) => {
    const card = await openSlowCard(page, 'slow');
    await card.getByRole('button', { name: pl.saveSlow.wait, exact: true }).tap();
    // The same read answers: the card goes and the saved 7 stars are in the game.
    await expect(card).toBeHidden({ timeout: SLOW_READ_MS + 5_000 });
    await startAsChild(page);
    expect((await snapshot(page)).counterText).toBe('7');
    expect((await snapshot(page)).save).toMatchObject({ load: 'loaded', blocked: false, blockedBy: null });
});

test('#2 SRR-02 a read that never answers ends in the advice, not a loop', async ({ page }) => {
    const card = await openSlowCard(page, 'hang');
    await card.getByRole('button', { name: pl.saveSlow.wait, exact: true }).tap();
    // The second limit passes: the advice replaces the body and there is nothing left to wait for.
    await expect(card.getByText(pl.saveSlow.stillSlow)).toBeVisible({ timeout: SLOWER_LIMIT_MS + 5_000 });
    await expect(card.getByRole('button', { name: pl.saveSlow.wait, exact: true })).toHaveCount(0);
    await expect(card.getByRole('button', { name: pl.saveSlow.waiting, exact: true })).toHaveCount(0);
    await card.getByRole('button', { name: pl.saveSlow.continue, exact: true }).tap();
    await expect(card).toBeHidden();
    await startAsChild(page);
    expect((await snapshot(page)).save).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', lastError: 'timeout' });
});

test('#2 SRR-02 continuing while the slow read is still answering never overwrites it', async ({ page }) => {
    const card = await openSlowCard(page, 'slow');
    await card.getByRole('button', { name: pl.saveSlow.wait, exact: true }).tap();
    // Do not wait for the answer: play on at once, in a fresh session with the saver blocked.
    await card.getByRole('button', { name: pl.saveSlow.continue, exact: true }).tap();
    await expect(card).toBeHidden();
    await startAsChild(page);
    expect((await snapshot(page)).counterText).toBe('0');
    expect((await snapshot(page)).save).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable' });

    // The slow read answers after the card is gone (the page clock is the condition, not a sleep), and a task is played after it.
    const started = await page.evaluate(() => performance.now());
    await page.waitForFunction(({ from, extra }) => performance.now() > from + extra, { from: started, extra: SLOW_READ_MS + 700 });
    await playTaskRight(page);
    const after = await snapshot(page);
    // One first-try task pays 1 star: a fresh session shows 1, an adopted late read would show 7 + 1 (a clean round pays 7, so
    // a whole round cannot tell them apart). Nothing was written, the saver is still blocked.
    await expect.poll(async () => (await snapshot(page)).counterText).toBe('1');
    expect(after.save).toMatchObject({ blocked: true, blockedBy: 'unavailable', writes: 0 });
    expect(after.save!.store!.ops).not.toContain('write');
});

test('#2 SVB-02 a read that fails while the parent waits shows the error card with its code', async ({ page }) => {
    const card = await openSlowCard(page, 'slowfail');
    await card.getByRole('button', { name: pl.saveSlow.wait, exact: true }).tap();
    // The same read answers with a named error: the calm unavailable card replaces the slow card, with the code to quote.
    const failed = page.getByRole('alertdialog', { name: pl.saveUnavailable.title });
    await expect(failed).toBeVisible({ timeout: SLOWER_LIMIT_MS + 5_000 });
    await expect(failed.getByText(/^Kod: UnknownError · Wersja /)).toBeVisible();
    // Never the "still slow" advice: the read did not hang, it failed.
    await expect(page.getByText(pl.saveSlow.stillSlow)).toHaveCount(0);
    await failed.getByRole('button', { name: pl.saveUnavailable.continue, exact: true }).tap();
    await expect(failed).toBeHidden();
    await startAsChild(page);
    expect((await snapshot(page)).save).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', lastError: 'UnknownError' });
});

test('#2 #7 SV2-04 the kept old save can be saved and imported again', async ({ page, browser }) => {
    await silenceSpeech(page);
    await page.goto('/?e2eSave=v1&e2eMonth=10&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    // Play until the v1 save was copied: the button exists only when the store holds the copy.
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save?.backup).toBe('done');

    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.settings.backupExport, exact: true }).tap();
    const exportDialog = page.getByRole('dialog', { name: pl.saveTransfer.exportTitle });
    await expect(exportDialog).toBeVisible();
    const downloaded = page.waitForEvent('download');
    await exportDialog.getByRole('button', { name: pl.saveTransfer.saveFile, exact: true }).tap();
    const download = await downloaded;
    const fileText = await readFile(await download.path(), 'utf8');
    expect(fileText).toContain('"app": "martynka-urzadza"');
    expect(fileText).toContain('"reason": "backup-v1"');

    // Another device: the file imports, and the summary lists the stars the v1 save had, not the ones the round added.
    const other = await browser.newContext();
    try {
        const second = await other.newPage();
        await silenceSpeech(second);
        await passWelcome(second, { e2eMonth: '10', e2eVariant: 'off' });
        await openImport(second);
        const dialog = second.getByRole('dialog', { name: pl.saveTransfer.importTitle });
        await chooseFile(second, pl.saveTransfer.choose, { name: download.suggestedFilename(), mimeType: 'text/plain', buffer: Buffer.from(fileText) });
        await expect(dialog.getByText(pl.saveTransfer.stars(V1_STARS))).toBeVisible();
        await expect(dialog.getByRole('button', { name: pl.saveTransfer.load, exact: true })).toBeVisible();
    } finally {
        await other.close();
    }
});
