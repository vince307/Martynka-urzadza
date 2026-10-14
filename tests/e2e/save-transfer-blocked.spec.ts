// Risk #2 (progress is never lost) of context/foundation/test-plan.md, the variant "the device save was not read": FR-021 (a save
// that could not be read is never overwritten), FR-022 (import and reset warn before anything is overwritten).
// The view rules (`deviceSaveView`) and the refusal of `replace` are unit-tested; this spec proves the seam in the real browser:
// the settings panel behind the adult gate hands the dialogs the real autosaver's block, so a save the game could not read
// is never shown as a fresh "Teraz" session and, when the browser would not give it at all, cannot be overwritten.
// The ?e2eSave switch (e2e build only) replaces the store with an in-memory one; IndexedDB is never opened here. The hook
// installs only after "Graj dalej", so these tests start with page.goto, not openWelcome. Modelled on save-restart.spec.ts.
// Runs in the chromium-hook project.
import { test, expect, type Page } from '@playwright/test';
import { openSettings } from './support/welcome';
import { screenIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { pl } from '../../src/data/pl';

test.setTimeout(60_000);

/** Loads the game with the store switch, passes the card with "Graj dalej" and taps the first age (E1, no warm-up): a task is on screen. */
async function playOnWithBlockedSave(page: Page, mode: 'unavailable' | 'unreadable' | 'corrupt', card: { title: string; continue: string }): Promise<void> {
    await silenceSpeech(page);
    await page.goto(`/?e2eSave=${mode}`);
    const dialog = page.getByRole('alertdialog', { name: card.title });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: card.continue, exact: true }).tap();
    await expect(dialog).toBeHidden();
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

test('#2 an unavailable save cannot be overwritten by import or reset', async ({ page }) => {
    await playOnWithBlockedSave(page, 'unavailable', pl.saveUnavailable);
    await expect.poll(async () => (await snapshot(page)).save?.skipped ?? 0).toBeGreaterThan(0);
    const before = (await snapshot(page)).save!;
    expect(before).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', writes: 0 });

    // Import: the line says why, there is no way to choose a file and no "Teraz" list of a session that is not the stored save.
    let panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    const importDialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    await expect(importDialog.getByText(pl.saveTransfer.deviceUnavailable)).toBeVisible();
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.choose, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.chooseOther, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('heading', { name: pl.saveTransfer.now })).toHaveCount(0);
    await importDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(importDialog).toBeHidden();

    // Reset: the same line and no button that would confirm it.
    panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(resetDialog.getByText(pl.saveTransfer.deviceUnavailable)).toBeVisible();
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true })).toHaveCount(0);
    await resetDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(resetDialog).toBeHidden();

    // Nothing was written and the game kept running on the same page.
    const after = (await snapshot(page)).save!;
    expect(after).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', writes: 0 });
    await screenIs(page, 'task');
});

test('#2 an unreadable save warns instead of showing the fresh session', async ({ page }) => {
    await playOnWithBlockedSave(page, 'corrupt', pl.saveFailed);
    expect((await snapshot(page)).save).toMatchObject({ load: 'unreadable', blocked: true });

    // Reset: a warning stands where the summary would be; a fresh session's "0 gwiazdek" is never offered as what will disappear.
    let panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(resetDialog.getByText(pl.saveTransfer.deviceUnreadable)).toBeVisible();
    await expect(resetDialog.getByText(pl.saveTransfer.stars(0))).toHaveCount(0);
    await expect(resetDialog.getByRole('heading', { name: pl.saveTransfer.now })).toHaveCount(0);
    // The parent can still decide to start over, so the confirmation exists; it is only not tapped here.
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true })).toBeVisible();
    await resetDialog.getByRole('button', { name: pl.parent.cancel, exact: true }).tap();
    await expect(resetDialog).toBeHidden();

    // Import: step one is available and carries the same warning.
    panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    const importDialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.choose, exact: true })).toBeVisible();
    await expect(importDialog.getByText(pl.saveTransfer.deviceUnreadable)).toBeVisible();
    await importDialog.getByRole('button', { name: pl.parent.cancel, exact: true }).tap();
    await expect(importDialog).toBeHidden();
    expect((await snapshot(page)).save?.writes).toBe(0);
});
