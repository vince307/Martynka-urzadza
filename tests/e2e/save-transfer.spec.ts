// Risks #7 (a file that is not a save of this game never changes the save), #2 and #10 (the state after a reload comes from the
// SAVE: an import, an export file read back, a reset) of context/foundation/test-plan.md; FR-022 (export, import and reset
// need a summary / confirmation before anything is overwritten).
// The file rules, the replace order and the dialogs' reducers are unit-tested; this spec proves the seams in the real browser:
// the settings panel behind the adult gate, the real file chooser and download, the second step before the overwrite,
// the reload after it, and the welcome screen after a reset. IndexedDB is real (no ?e2eSave store) and is never opened or
// written here: what a reload brings back is read through the read-only hook. A "fresh device" is a new browser context.
// Runs in the chromium-hook project; modelled on save-restart.spec.ts.
import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { playRoundRight, screenIs, silenceSpeech, snapshot, tapTarget } from './support/hook';
import { pl } from '../../src/data/pl';
import { ROOMS } from '../../src/data/rooms';

test.setTimeout(120_000);

const SALON = ROOMS.salon;

// A save the game itself could have written, built here (the frozen fixture tests/fixtures/save-v1.json is a format fixture: an
// unknown room and skills would be repaired on load and change the course of the test). A different stage than passWelcome's E3.
const IMPORTED_STARS = 7;
const IMPORTED_STAGE = 'E4';
const playableSave = (stars: number) => ({
    version: 1,
    profileId: 'default',
    stars,
    rooms: { salon: { tasksDone: 0, chosen: {} } },
    currentRoom: 'salon',
    settings: { autoRead: null },
    learner: {
        age: 8,
        stage: IMPORTED_STAGE,
        stageOverriddenByParent: false,
        warmupPending: false,
        unlockedStep: {},
        mastery: {},
        streak: {},
        history: [],
        weakStreak: 0,
        easedRounds: 0,
        pendingUnlock: null,
    },
});

/** One round played right, then the next round's first task: the HUD gear is there and the save has been written. */
async function playRoundAndSettle(page: Page): Promise<void> {
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ lastReason: 'now', dirty: false });
    expect((await snapshot(page)).save!.writes).toBeGreaterThanOrEqual(1);
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');
}

/** Picks `file` in the real file chooser that the dialog's button opens. */
async function chooseFile(page: Page, buttonName: string, file: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), dialog.getByRole('button', { name: buttonName, exact: true }).tap()]);
    await chooser.setFiles(file);
}

const jsonFile = (name: string, value: unknown) => ({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });

/** Settings panel -> "Wczytaj z pliku": the import dialog is open afterwards. */
async function openImport(page: Page): Promise<void> {
    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    await expect(page.getByRole('dialog', { name: pl.saveTransfer.importTitle })).toBeVisible();
}

/** Starts the wait for the reload the game does after a replaced save, then runs `act`; the game is loaded again afterwards. */
async function reloadedBy(page: Page, act: () => Promise<void>): Promise<void> {
    const loaded = page.waitForEvent('load', { timeout: 15_000 });
    await act();
    await loaded;
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
}

test('#7 a file that is not a save of this game is rejected and the save is unchanged', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10' });
    await playRoundAndSettle(page);
    const before = await snapshot(page);
    expect(before.stars).toBeGreaterThan(0);

    await openImport(page);
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    // Not a save of this game at all.
    await chooseFile(page, pl.saveTransfer.choose, { name: 'zly.txt', mimeType: 'text/plain', buffer: Buffer.from('{"hello":1}') });
    await expect(dialog.getByText(pl.saveTransfer.rejected['not-ours'])).toBeVisible();
    // The envelope of this game around a save that no build of the game could have written (stars below zero).
    const broken = { app: 'martynka-urzadza', kind: 'save', build: 'test', exportedAt: '2026-01-01T00:00:00.000Z', save: playableSave(-1) };
    await chooseFile(page, pl.saveTransfer.chooseOther, jsonFile('uszkodzony.txt', broken));
    await expect(dialog.getByText(pl.saveTransfer.rejected.corrupt)).toBeVisible();
    // No second step was offered: nothing to confirm, only a way out.
    await expect(dialog.getByRole('button', { name: pl.saveTransfer.load, exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(dialog).toBeHidden();

    await page.reload();
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.save?.load).toBe('loaded');
    expect(after.stars).toBe(before.stars);
    expect(after.learner?.stage).toBe(before.learner?.stage);
    expect(after.learner?.history).toEqual(before.learner?.history);
});

test('#7 #2 a valid file replaces the save only after the summary and survives the reload', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10' });
    expect((await snapshot(page)).learner?.stage).toBe('E3');
    expect((await snapshot(page)).stars).toBe(0);

    await openImport(page);
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    await chooseFile(page, pl.saveTransfer.choose, jsonFile('zapis.txt', playableSave(IMPORTED_STARS)));

    // Step two: the parent compares "Teraz" and "Z pliku" first; nothing is replaced yet.
    await expect(dialog.getByRole('heading', { name: pl.saveTransfer.fromFile })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: pl.saveTransfer.now })).toBeVisible();
    await expect(dialog.getByText(pl.saveTransfer.stars(IMPORTED_STARS))).toBeVisible();
    await expect(dialog.getByText(pl.stages[IMPORTED_STAGE])).toBeVisible();
    await expect(dialog.getByText(pl.saveTransfer.room(SALON.name, 0, SALON.tasks.length))).toHaveCount(2);
    // The overwrite is never the default: the focus starts on "Anuluj" (visual gate).
    await expect(dialog.getByRole('button', { name: pl.parent.cancel, exact: true })).toBeFocused();
    expect((await snapshot(page)).stars).toBe(0);

    await reloadedBy(page, () => dialog.getByRole('button', { name: pl.saveTransfer.load, exact: true }).tap());
    // The game comes back from the file, not from the welcome screen.
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.save?.load).toBe('loaded');
    expect(after.stars).toBe(IMPORTED_STARS);
    expect(after.learner?.stage).toBe(IMPORTED_STAGE);
});

test('#2 #10 an export from the panel round-trips through import on another device', async ({ page, browser }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10' });
    await playRoundAndSettle(page);
    const source = await snapshot(page);
    expect(source.stars).toBeGreaterThan(0);

    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.exportButton, exact: true }).tap();
    const exportDialog = page.getByRole('dialog', { name: pl.saveTransfer.exportTitle });
    await expect(exportDialog).toBeVisible();
    const downloaded = page.waitForEvent('download');
    await exportDialog.getByRole('button', { name: pl.saveTransfer.saveFile, exact: true }).tap();
    const download = await downloaded;
    expect(download.suggestedFilename()).toMatch(/^martynka-zapis-\d{4}-\d{2}-\d{2}\.txt$/);
    const fileText = await readFile(await download.path(), 'utf8');
    expect(fileText).toContain('"app": "martynka-urzadza"');
    expect(fileText).toContain('"build"');
    expect(fileText).toContain('"kind": "save"');
    await exportDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(exportDialog).toBeHidden();

    // Another device: a new browser context has its own storage, so it starts on the welcome screen.
    const other = await browser.newContext();
    try {
        const second = await other.newPage();
        await silenceSpeech(second);
        await passWelcome(second, { e2eMonth: '10' });
        expect((await snapshot(second)).stars).toBe(0);
        await openImport(second);
        const dialog = second.getByRole('dialog', { name: pl.saveTransfer.importTitle });
        await chooseFile(second, pl.saveTransfer.choose, { name: download.suggestedFilename(), mimeType: 'text/plain', buffer: Buffer.from(fileText) });
        await expect(dialog.getByText(pl.saveTransfer.stars(source.stars))).toBeVisible();
        await reloadedBy(second, () => dialog.getByRole('button', { name: pl.saveTransfer.load, exact: true }).tap());
        await screenIs(second, 'task');
        const after = await snapshot(second);
        expect(after.save?.load).toBe('loaded');
        expect(after.stars).toBe(source.stars);
        expect(after.learner?.stage).toBe(source.learner?.stage);
        expect(after.learner?.history).toEqual(source.learner?.history);
    } finally {
        await other.close();
    }
});

test('#2 reset asks first and ends on the welcome screen', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eMonth: '10' });
    await playRoundAndSettle(page);
    const before = await snapshot(page);
    expect(before.stars).toBeGreaterThan(0);

    // The first time the parent changes their mind: "Anuluj" keeps everything.
    let panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(pl.saveTransfer.stars(before.stars))).toBeVisible();
    await dialog.getByRole('button', { name: pl.parent.cancel, exact: true }).tap();
    await expect(dialog).toBeHidden();
    expect((await snapshot(page)).stars).toBe(before.stars);

    // The second time the parent confirms: the page reloads onto the welcome screen with an empty balance.
    panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true }).tap();
    await screenIs(page, 'welcome');
    // Nothing of the child is left: the learner is gone with the save.
    expect((await snapshot(page)).learner).toBeNull();
});
