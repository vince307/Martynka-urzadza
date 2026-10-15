// Shared by the specs that import a save through the parent panel (risks #7, #2, #13): the real file chooser, the import dialog
// and the reload the game does after a replaced save. Not a spec itself (no .spec in the name).
import { expect, type Page } from '@playwright/test';
import { openSettings } from './welcome';
import { pl } from '../../../src/data/pl';

/** Picks `file` in the real file chooser that the dialog's button opens. */
export async function chooseFile(page: Page, buttonName: string, file: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), dialog.getByRole('button', { name: buttonName, exact: true }).tap()]);
    await chooser.setFiles(file);
}

export const jsonFile = (name: string, value: unknown) => ({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });

/** Settings panel -> "Wczytaj z pliku": the import dialog is open afterwards. */
export async function openImport(page: Page): Promise<void> {
    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.saveTransfer.importButton, exact: true }).tap();
    await expect(page.getByRole('dialog', { name: pl.saveTransfer.importTitle })).toBeVisible();
}

/** Starts the wait for the reload the game does after a replaced save, then runs `act`; the game is loaded again afterwards. */
export async function reloadedBy(page: Page, act: () => Promise<void>): Promise<void> {
    const loaded = page.waitForEvent('load', { timeout: 15_000 });
    await act();
    await loaded;
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
}
