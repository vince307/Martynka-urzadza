import { isTimeoutError, type ReplaceResult } from '../../core/autosave';
import { NEWER_SAVE } from '../../core/save';
import type { SaveSummary } from '../../core/saveFile';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/** The sentence for a device save that cannot be replaced, one place for the import and reset dialogs. */
export const blockedText = (cause: 'future' | 'unreadable' | 'timeout' | 'unavailable' | 'unavailable-first' | 'fatal' | 'newer' | 'otherTab' | 'broken'): string =>
    ({ future: pl.saveTransfer.deviceFuture, unreadable: pl.saveTransfer.deviceUnreadable, timeout: pl.saveTransfer.deviceTimeout, unavailable: pl.saveTransfer.deviceUnavailable, 'unavailable-first': pl.saveTransfer.deviceUnavailableFirst, fatal: pl.saveTransfer.deviceFatal, newer: pl.saveTransfer.deviceNewer, otherTab: pl.saveTransfer.deviceOtherTab, broken: pl.saveTransfer.deviceBroken })[cause];

/** The three lines a parent compares before a save is overwritten (stars, stage, rooms); shared by the import and reset dialogs. */
export const createSummaryList = (title: string, summary: SaveSummary, roomName: (id: string) => string, mismatchLine?: string): HTMLElement => {
    const box = document.createElement('div');
    box.className = 'import-summary';
    const lines = [
        pl.saveTransfer.stars(summary.stars),
        summary.stage ? pl.stages[summary.stage] : pl.saveTransfer.noStage,
        ...summary.rooms.map((r) => pl.saveTransfer.room(roomName(r.id), r.done, r.total)),
    ];
    box.append(createText('h2', title), ...lines.map((line) => createText('p', line)));
    // DESIGN-GAP 138: one more line when the saved salon does not match the game (R-4); the file is still importable.
    if (summary.mismatch && mismatchLine !== undefined) box.append(createText('p', mismatchLine, 'overlay-muted'));
    return box;
};

/**
 * The line after a failed replace. The "delete the site data" advice destroys the save, so it appears only when a forced
 * write failed in the store; a refusal (`Busy`, `Blocked`, `InvalidSave`) or a rejected promise gets the plain line, because
 * `Autosaver.replace` catches every store error and returns it, so a rejection is never the store (impl-review F2).
 * A timeout comes first (SVB-04): the write may still land, so "Obecne postępy zostały bez zmian" is not known and the line says so.
 */
export const failureText = (result: ReplaceResult | null, forced: boolean, plain: string): string => {
    if (result !== null && !result.ok && isTimeoutError(result.error)) return pl.saveTransfer.replaceUnconfirmed;
    if (result !== null && !result.ok && result.error === NEWER_SAVE) return pl.saveTransfer.deviceNewer;
    if (!forced || result === null || result.ok) return plain;
    return ['Busy', 'Blocked', 'InvalidSave'].includes(result.error) ? plain : pl.saveTransfer.siteDataAdvice;
};

/** O2: the reset lead line announces a list only when a summary follows. */
export const resetLead = (hasList: boolean): string => (hasList ? pl.saveTransfer.resetBody : pl.saveTransfer.resetBody.replace(/:$/, '.'));
