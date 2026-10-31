// Risks #2, #10 (the part "a reload comes back to the saved state") and #16 ("when the save is written", after a purchase)
// of context/foundation/test-plan.md; FR-020 (autosave) and FR-021 (an unreadable save is never overwritten).
// The reducers and the autosaver are unit-tested; this spec proves the seams in the real browser: the load outcome reaches the
// session before the first frame, the room scene flushes a purchase at once, and a failed load blocks every write.
// Persistence: a reload keeps IndexedDB, so the state after it can only come from the SAVE. IndexedDB is never opened or written
// here: the saved state is read through the read-only hook (snapshot.save + the game state). Runs in the chromium-hook project.
import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome, gateProblem, typeIntoGate } from './support/welcome';
import { answerRight, answerWrong, fromHook, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { pl } from '../../src/data/pl';

test.setTimeout(120_000);

// Two misses, the solution and a retype pay no star: the balance stays as it was, and the room switch appears (it exists only between tasks).
async function finishTaskWithoutStars(page: Page): Promise<void> {
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const was = await snapshot(page);
        await tapTarget(page, 'step');
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > was.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
}


test('#2 #10 a reload comes back to the saved learner, stars and room', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10' });
    await playRoundRight(page, 5);
    // The round end is saved at once (not by the debounce).
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ load: 'fresh', lastReason: 'now', dirty: false });
    const before = await snapshot(page);
    expect(before.save!.writes).toBeGreaterThanOrEqual(1);
    expect(Number(before.counterText)).toBeGreaterThan(0); // differs from a fresh start
    expect(before.learner?.history).toHaveLength(5);
    const learner = before.learner!;

    await page.reload();
    await fromHook(page, 'snapshot');
    // Not the welcome screen: the learner came from the save.
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.save?.load).toBe('loaded');
    expect(after.counterText).toBe(before.counterText);
    expect(after.stars).toBe(before.stars);
    expect(after.learner?.stage).toBe(learner.stage);
    expect(after.learner?.history).toEqual(learner.history);
    expect(after.learner?.pendingUnlock).toBe(learner.pendingUnlock);
    expect(after.learner?.warmupPending).toBe(false);
});

test('#16 FR-020 a purchase is saved at once and ?e2eStars seeds only a fresh start', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: '20', e2eMonth: '10' });
    expect((await snapshot(page)).stars).toBe(20);
    await finishTaskWithoutStars(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    expect((await snapshot(page)).stars).toBe(20);

    // The stage (5 stars) is one tap with no panel; then the sofa: open the purchase panel, preview a thumbnail, "Wybieram".
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.tasksDone).toBe(1);
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.panel.kind).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[1]);
    await expect.poll(async () => {
        const panel = (await snapshot(page)).room?.panel;
        return panel?.kind === 'open' ? panel.preview : null;
    }).toBe(1);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await snapshot(page)).room?.tasksDone).toBe(2);
    // Saved at once: the reason is "now" and nothing waits for the debounce.
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ lastReason: 'now', dirty: false });
    const bought = await snapshot(page);
    expect(bought.stars).toBe(8);
    expect(bought.room!.stageDone).toBe(true);
    const chosen = bought.room!.chosen;
    expect(chosen.sofa).toBe(1);

    // The address still carries e2eStars=20: the saved balance wins over the seam.
    await page.reload();
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.save?.load).toBe('loaded');
    expect(after.counterText).toBe('8');
    // The reload opened a new first task: pay nothing again, then the room switch exists.
    await finishTaskWithoutStars(page);
    expect((await snapshot(page)).stars).toBe(8);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    const room = (await snapshot(page)).room!;
    expect(room.tasksDone).toBe(2);
    expect(room.stageDone).toBe(true);
    expect(room.chosen.sofa).toBe(chosen.sofa);
});

test('#2 FR-021 an unreadable save shows the parent card, exports the raw copy and is never written', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('./?e2eSave=unreadable');
    const card = page.getByRole('alertdialog', { name: pl.saveFuture.title });
    await expect(card).toBeVisible();

    // "Zachowaj kopię" sits behind the adult check; headless Chromium has no share sheet, so the copy is a download.
    // L-S2: the gate leads to a confirmation; nothing is downloaded until "Zapisz plik".
    await expect(card.getByText(/^Kod: future · Wersja /)).toBeVisible();
    await card.getByRole('button', { name: pl.saveFuture.export }).tap();
    await typeIntoGate(page, (await gateProblem(page)).product);
    const exportDialog = page.getByRole('dialog', { name: pl.saveTransfer.exportTitle });
    await expect(exportDialog).toBeVisible();
    const downloaded = page.waitForEvent('download');
    await exportDialog.getByRole('button', { name: pl.saveTransfer.saveFile }).tap();
    const download = await downloaded;
    await expect(exportDialog.getByText(pl.saveTransfer.exportOutcome.downloadStarted)).toBeVisible();
    await exportDialog.getByRole('button', { name: pl.saveTransfer.close }).tap();
    await expect(exportDialog).toBeHidden();
    expect(download.suggestedFilename()).toMatch(/^bystrow-zapis-surowy-\d{4}-\d{2}-\d{2}\.txt$/);
    const text = await readFile(await download.path(), 'utf8');
    expect(text).toContain('"version": 99');
    expect(text).toContain('"stars": 7');
    expect(text).toContain('"build"');
    expect(text).toContain('"reason": "future"');
    await expect(card).toBeVisible();

    // "Graj dalej": the game starts on the welcome screen with writes blocked.
    await card.getByRole('button', { name: pl.saveFuture.continue }).tap();
    await expect(card).toBeHidden();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'welcome');
    expect((await snapshot(page)).save).toMatchObject({ load: 'unreadable', blocked: true });

    // The first change of the learner (an age tap) asks for a save: with the block it is skipped, never written.
    let age: { x: number; y: number } | undefined;
    await expect.poll(async () => {
        age = (await targets(page)).ages?.[0];
        return age !== undefined;
    }).toBe(true);
    await tapScene(page, age!);
    await screenIs(page, 'task');
    await expect.poll(async () => {
        const save = (await snapshot(page)).save;
        return save ? save.skipped + save.writes : 0;
    }).toBeGreaterThanOrEqual(1);
    const save = (await snapshot(page)).save!;
    expect(save.writes).toBe(0);
    expect(save.skipped).toBeGreaterThanOrEqual(1);
});

// Risk #2, the variant "the save silently does not work" (audit C-1, M-S4, C-2). The card, the load limit and the panel
// section exist only in the rendered page with the real `start`. The hook installs only after "Graj dalej", so these
// specs start with page.goto, never openWelcome. A new browser context is a fresh device; IndexedDB is never touched.
test('#2 C-1 a save the browser will not give shows the card, plays without writing and says so in the parent panel', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('./?e2eSave=unavailable');
    const card = page.getByRole('alertdialog', { name: pl.saveUnavailable.title });
    await expect(card).toBeVisible();
    // There is no stored copy to keep: no export button.
    await expect(card.getByRole('button', { name: pl.saveFailed.export })).toHaveCount(0);
    await expect(card.getByText(/^Kod: UnknownError · Wersja /)).toBeVisible();
    await card.getByRole('button', { name: pl.saveUnavailable.continue }).tap();
    await expect(card).toBeHidden();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'welcome');

    // Age 6 = E1, no warm-up: the first change of the learner asks for a save, which the block skips.
    let age: { x: number; y: number } | undefined;
    await expect.poll(async () => {
        age = (await targets(page)).ages?.[0];
        return age !== undefined;
    }).toBe(true);
    await tapScene(page, age!);
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).save?.skipped ?? 0).toBeGreaterThan(0);
    const save = (await snapshot(page)).save!;
    expect(save).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', lastError: 'UnknownError', writes: 0 });

    const panel = await openSettings(page);
    const section = panel.locator('section.parent-save');
    await expect(section).toHaveAttribute('data-state', 'off');
    await expect(section.getByText(pl.settings.saveOff.unavailable)).toBeVisible();
    await expect(section.getByText(/^Kod: UnknownError · Wersja /)).toBeVisible();
});

test('#2 M-S4 a read that never answers ends in the same card after the load timeout', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('./?e2eSave=hang');
    const card = page.getByRole('alertdialog', { name: pl.saveSlow.title });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: pl.saveSlow.continue }).tap();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'welcome');
    let age: { x: number; y: number } | undefined;
    await expect.poll(async () => {
        age = (await targets(page)).ages?.[0];
        return age !== undefined;
    }).toBe(true);
    await tapScene(page, age!);
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ load: 'unavailable', blockedBy: 'unavailable', lastError: 'timeout' });
    const panel = await openSettings(page);
    await expect(panel.locator('section.parent-save').getByText(pl.settings.saveOff.timeout)).toBeVisible();
});

test('#2 C-2 failed writes show in the parent panel', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSave: 'writefail' });
    await expect.poll(async () => (await snapshot(page)).save?.consecutiveFailures ?? 0).toBeGreaterThanOrEqual(1);
    expect((await snapshot(page)).save?.lastError).toBe('QuotaExceededError');
    const panel = await openSettings(page);
    const section = panel.locator('section.parent-save');
    await expect(section).toHaveAttribute('data-state', 'failing');
    await expect(section.getByText(pl.settings.saveFailing)).toBeVisible();
});

// Risk #2 (progress lost) x #16 (purchase): a purchase made while the store refuses every write keeps its stars and the
// panel says the game is not saving. origin: audit M-5; the failure comes from the writefail seam, never real IndexedDB.
test('#2 M-5 a stage and a sofa bought while the store refuses keep the stars and say so', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSave: 'writefail', e2eStars: '12', e2eVariant: 'off', e2eMonth: '10' });
    await finishTaskWithoutStars(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    const failuresBefore = (await snapshot(page)).save?.consecutiveFailures ?? 0;

    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.tasksDone).toBe(1);
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.panel.kind).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    await tapScene(page, thumbs[0]);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await snapshot(page)).room?.tasksDone).toBe(2);

    // The purchase asked for a save at once and the store refused it: the failure count grew.
    await expect.poll(async () => (await snapshot(page)).save?.consecutiveFailures ?? 0).toBeGreaterThan(failuresBefore);
    const bought = await snapshot(page);
    expect(bought.save?.lastError).toBe('QuotaExceededError');
    expect(bought.save?.blockedBy).toBeNull();
    expect(bought.stars).toBe(12 - 5 - 7);
    expect(bought.room!.chosen.sofa).toBe(0);

    const panel = await openSettings(page);
    await expect(panel.locator('section.parent-save')).toHaveAttribute('data-state', 'failing');
    await expect(page.getByRole('alertdialog')).toHaveCount(0); // no fatal card
});

test('#2 C-2 the parent panel says the game saves after a normal write',async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page);
    await expect.poll(async () => (await snapshot(page)).save?.writes ?? 0).toBeGreaterThanOrEqual(1);
    const panel = await openSettings(page);
    const section = panel.locator('section.parent-save');
    await expect(section).toHaveAttribute('data-state', 'ok');
    await expect(section.getByText(pl.settings.saveOk)).toBeVisible();
    await expect(section.getByText(pl.settings.saveLast(''), { exact: false })).toBeVisible();
});
