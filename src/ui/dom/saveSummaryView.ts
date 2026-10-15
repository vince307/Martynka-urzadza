import type { ReplaceResult } from '../../core/autosave';
import type { SaveSummary } from '../../core/saveFile';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/** The sentence for a device save that cannot be replaced, one place for the import and reset dialogs. */
export const blockedText = (cause: 'future' | 'timeout' | 'unavailable' | 'fatal' | 'newer'): string =>
    ({ future: pl.saveTransfer.deviceFuture, timeout: pl.saveTransfer.deviceTimeout, unavailable: pl.saveTransfer.deviceUnavailable, fatal: pl.saveTransfer.deviceFatal, newer: pl.saveTransfer.deviceNewer })[cause];

/** The three lines a parent compares before a save is overwritten (stars, stage, rooms); shared by the import and reset dialogs. */
export const createSummaryList = (title: string, summary: SaveSummary, roomName: (id: string) => string): HTMLElement => {
    const box = document.createElement('div');
    box.className = 'import-summary';
    const lines = [
        pl.saveTransfer.stars(summary.stars),
        summary.stage ? pl.stages[summary.stage] : pl.saveTransfer.noStage,
        ...summary.rooms.map((r) => pl.saveTransfer.room(roomName(r.id), r.done, r.total)),
    ];
    box.append(createText('h2', title), ...lines.map((line) => createText('p', line)));
    return box;
};

/**
 * The line after a failed replace. The "delete the site data" advice destroys the save, so it appears only when a forced
 * write failed in the store; a refusal (`Busy`, `Blocked`, `InvalidSave`) or a rejected promise gets the plain line, because
 * `Autosaver.replace` catches every store error and returns it, so a rejection is never the store (impl-review F2).
 */
export const failureText = (result: ReplaceResult | null, forced: boolean, plain: string): string => {
    if (!forced || result === null || result.ok) return plain;
    return ['Busy', 'Blocked', 'InvalidSave'].includes(result.error) ? plain : pl.saveTransfer.siteDataAdvice;
};
