// Risk #2 (progress is never lost) of context/foundation/test-plan.md, the variant "the device save was not read": FR-021 (a save
// that could not be read is never overwritten), FR-022 (import and reset warn before anything is overwritten).
// The view rules (`deviceSaveView`) and the refusal of `replace` are unit-tested; this spec proves the seam in the real browser:
// the settings panel behind the adult gate hands the dialogs the real autosaver's block, so a save the game could not read
// is never shown as a fresh "Teraz" session; a newer-version save is never overwritten, and a read the browser refused is
// replaced only after the second step "Zastąp mimo to" (save-reason-and-recovery; the corrupt seam keeps the unreadable path).
// The ?e2eSave switch (e2e build only) replaces the store with an in-memory one; IndexedDB is never opened here. The hook
// installs only after "Graj dalej", so these tests start with page.goto, not openWelcome. Modelled on save-restart.spec.ts.
// Runs in the chromium-hook project.
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { screenIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { pl } from '../../src/data/pl';
import { SAVE_VERSION } from '../../src/core/save';

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

test('#2 an unavailable save is not overwritten by import or reset without a second confirmation', async ({ page }) => {
    await playOnWithBlockedSave(page, 'unavailable', pl.saveUnavailable);
    await expect.poll(async () => (await snapshot(page)).save?.skipped ?? 0).toBeGreaterThan(0);
    const before = (await snapshot(page)).save!;
    expect(before).toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', writes: 0 });

    // Import: the line says why, there is no way to choose a file and no "Teraz" list of a session that is not the stored save.
    let panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    const importDialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    // SRR-08: the first start promises nothing and offers no overwrite.
    await expect(importDialog.getByText(pl.saveTransfer.deviceUnavailableFirst)).toBeVisible();
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.force, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.choose, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.chooseOther, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('heading', { name: pl.saveTransfer.now })).toHaveCount(0);
    await importDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(importDialog).toBeHidden();

    // Reset: the same line and no button that would confirm it.
    panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(resetDialog.getByText(pl.saveTransfer.deviceUnavailableFirst)).toBeVisible();
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

// save-reason-and-recovery (SIR-01, SIR-02, SIR-04): the reason a read failed decides what the dialogs offer.

test('#2 SIR-01 a save from a newer version is never offered for overwrite', async ({ page }) => {
    await playOnWithBlockedSave(page, 'unreadable', pl.saveFuture);
    expect((await snapshot(page)).save).toMatchObject({ load: 'unreadable', blocked: true, blockedBy: 'unreadable', writes: 0 });

    // Import: the newer-version line, no way to choose a file, no overwrite step.
    let panel = await openSettings(page);
    const section = panel.locator('section.parent-save');
    await expect(section.getByText(pl.settings.saveOff.future)).toBeVisible();
    await expect(section.getByText(/^Kod: future · Wersja /)).toBeVisible();
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    const importDialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    await expect(importDialog.getByText(pl.saveTransfer.deviceFuture)).toBeVisible();
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.choose, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.force, exact: true })).toHaveCount(0);
    await importDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(importDialog).toBeHidden();

    // Reset: the same line, neither the confirmation nor the second step.
    panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(resetDialog.getByText(pl.saveTransfer.deviceFuture)).toBeVisible();
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true })).toHaveCount(0);
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.force, exact: true })).toHaveCount(0);
    await resetDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(resetDialog).toBeHidden();
    expect((await snapshot(page)).save?.writes).toBe(0);
});

test('#2 SIR-02 a save the browser never gives can be replaced after a second confirmation', async ({ page }) => {
    // SRR-08: the first refused start is not forceable; the counter (localStorage) survives the reload, so the second start is.
    await page.goto('/?e2eSave=unavailable');
    await expect(page.getByRole('alertdialog', { name: pl.saveUnavailable.title })).toBeVisible();
    await playOnWithBlockedSave(page, 'unavailable', pl.saveUnavailable);
    // A marker on this page load: it is gone only if the page really reloaded.
    await page.evaluate(() => {
        (window as unknown as { __beforeReset: boolean }).__beforeReset = true;
    });

    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(resetDialog.getByText(pl.saveTransfer.deviceUnavailable)).toBeVisible();
    // Step one offers no confirmation; the overwrite is a separate, explicit step.
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true })).toHaveCount(0);
    await resetDialog.getByRole('button', { name: pl.saveTransfer.force, exact: true }).tap();
    await expect(resetDialog.getByText(pl.saveTransfer.forcedWarning)).toBeVisible();
    await resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true }).tap();

    // The write is accepted, the page reloads, and the read is refused again: the card is back.
    await expect(page.getByRole('alertdialog', { name: pl.saveUnavailable.title })).toBeVisible();
    expect(await page.evaluate(() => '__beforeReset' in window)).toBe(false);
    await expect(page.getByText(pl.saveTransfer.applyFailed)).toHaveCount(0);
    await expect(page.getByText(pl.saveTransfer.resetFailed)).toHaveCount(0);
    await expect(page.getByText(pl.saveTransfer.siteDataAdvice)).toHaveCount(0);
});

test('#2 SIR-02 a read that timed out offers no overwrite', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('/?e2eSave=hang');
    const card = page.getByRole('alertdialog', { name: pl.saveSlow.title });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: pl.saveSlow.continue, exact: true }).tap();
    await expect(card).toBeHidden();
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

    let panel = await openSettings(page);
    await expect(panel.locator('section.parent-save').getByText(pl.settings.saveOff.timeout)).toBeVisible();
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    const importDialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    await expect(importDialog.getByText(pl.saveTransfer.deviceTimeout)).toBeVisible();
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.force, exact: true })).toHaveCount(0);
    await expect(importDialog.getByRole('button', { name: pl.saveTransfer.choose, exact: true })).toHaveCount(0);
    await importDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(importDialog).toBeHidden();

    panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await expect(resetDialog.getByText(pl.saveTransfer.deviceTimeout)).toBeVisible();
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.force, exact: true })).toHaveCount(0);
    await expect(resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true })).toHaveCount(0);
    await resetDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    expect((await snapshot(page)).save?.writes).toBe(0);
});

test('#2 SIR-04 a copy from the panel says it is not the device save', async ({ page }) => {
    await playOnWithBlockedSave(page, 'unavailable', pl.saveUnavailable);
    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.exportButton, exact: true }).tap();
    const exportDialog = page.getByRole('dialog', { name: pl.saveTransfer.exportTitle });
    await expect(exportDialog.getByText(pl.saveTransfer.exportNotDevice)).toBeVisible();
    await exportDialog.getByRole('button', { name: pl.parent.cancel, exact: true }).tap();
    await expect(exportDialog).toBeHidden();
});

test('#2 SIR-04 a copy of a healthy save carries no such warning', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page);
    await expect.poll(async () => (await snapshot(page)).save?.writes ?? 0).toBeGreaterThanOrEqual(1);
    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.exportButton, exact: true }).tap();
    const exportDialog = page.getByRole('dialog', { name: pl.saveTransfer.exportTitle });
    await expect(exportDialog.getByRole('button', { name: pl.saveTransfer.saveFile, exact: true })).toBeVisible();
    await expect(exportDialog.getByText(pl.saveTransfer.exportNotDevice)).toHaveCount(0);
});

// Risk #2 (progress is never lost), change audit-boot-hidden-tab (Z-8): a reset the store refuses as NewerSave must not tell the
// parent to clear the site data (that would delete the newer save), and must stop this page's writes and show the refusal card.
// The existing ?e2eSave=newer seam suffices: the first write at start is accepted and stores SAVE_VERSION + 1, so the reset (before any
// further state change) reaches store.write(..., 'replace') and gets NewerSave.
test('#2 Z-8 a reset refused as a newer save says so, blocks writes and shows the refusal card, never the site-data advice', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSave: 'newer', e2eVariant: 'off' });
    await expect.poll(async () => (await snapshot(page)).save?.writes ?? 0).toBeGreaterThanOrEqual(1);
    expect((await snapshot(page)).save?.blockedBy).toBeNull();

    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.resetButton, exact: true }).tap();
    const resetDialog = page.getByRole('dialog', { name: pl.saveTransfer.resetTitle });
    await resetDialog.getByRole('button', { name: pl.saveTransfer.resetConfirm, exact: true }).tap();

    // The refusal is told as "a newer version saved here", not as a failure whose advice is to clear the site data.
    await expect(resetDialog.getByText(pl.saveTransfer.deviceNewer)).toBeVisible();
    await expect(page.getByText(pl.saveTransfer.siteDataAdvice)).toHaveCount(0);
    await expect(page.getByText(pl.saveTransfer.resetFailed)).toHaveCount(0);
    await expect.poll(async () => (await snapshot(page)).save?.blockedBy).toBe('newer');

    // The page stops writing and the calm card names its code.
    const card = page.getByRole('alertdialog', { name: pl.saveRefused.title });
    await expect(card).toBeVisible();
    const build = await page.locator('#game-container').getAttribute('data-build');
    expect(build).toBeTruthy();
    await expect(card.getByText(pl.saveFailed.detail('NewerSave', build!))).toBeVisible();
    expect((await snapshot(page)).save!.store!.writtenVersion).toBe(SAVE_VERSION + 1);

    // "Zamknij" leaves the card on screen with the focus on its restart button, never lost on the page (visual gate VG-1).
    await resetDialog.getByRole('button', { name: pl.saveTransfer.close, exact: true }).tap();
    await expect(resetDialog).toBeHidden();
    await expect(card.getByRole('button', { name: pl.saveRefused.restart, exact: true })).toBeFocused();
});
