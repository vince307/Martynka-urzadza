import type { DeviceSaveView } from '../../core/saveFile';
import type { ReplaceResult } from '../../core/autosave';
import type { SaveState } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog, type DomDialog } from './dialog';
import { createButton, createText } from './overlay';
import { createSummaryList } from './saveSummaryView';

export interface SaveResetDialogOptions {
    /** What the device save is (S12-01): a summary of what will disappear, unreadable, or not readable at all. */
    device: Exclude<DeviceSaveView, { kind: 'broken' }>;
    roomName: (id: string) => string;
    /** The empty save to write; called only after the tap on "Zacznij od nowa". */
    fresh: () => SaveState;
    apply: (state: SaveState) => Promise<ReplaceResult>;
    /** Called after the dialog has closed itself (Cancel, Escape or Close). */
    onClose: () => void;
    reload?: () => void;
    parent?: HTMLElement;
}

/**
 * Reset (FR-022): says what will disappear, advises a copy first and needs one more tap. Initial focus is on the
 * safe "Anuluj" (the destructive button is plain, not the primary style, and never focused); a failed write leaves the save as it was.
 * A device save that was not read (`blocked`) offers no reset, only "Zamknij"; an `unreadable` one shows a warning in the place of the summary.
 * DESIGN-GAP 49 (docs/design-gaps.md): the kit has no reset confirmation; built from the S-06 dialog parts.
 * DESIGN-GAP 68 (docs/design-gaps.md): the kit has no line for a device save that was not read.
 * Returns the function that closes the dialog.
 */
export const openSaveResetDialog = ({ device, roomName, fresh, apply, onClose, reload = () => window.location.reload(), parent = document.body }: SaveResetDialogOptions): (() => void) => {
    let busy = false;
    const message = createText('p', '', 'overlay-muted');
    message.setAttribute('role', 'status');
    message.hidden = true;
    const finish = (): void => {
        handle.close();
        onClose();
    };
    const blocked = device.kind === 'blocked';
    const cancel = createButton(blocked ? pl.saveTransfer.close : pl.parent.cancel, finish);
    const confirm = createButton(pl.saveTransfer.resetConfirm, () => {
        if (busy) return;
        busy = true;
        confirm.disabled = true;
        cancel.disabled = true;
        const failed = (): void => {
            busy = false;
            message.textContent = pl.saveTransfer.applyFailed;
            message.hidden = false;
            confirm.hidden = true;
            cancel.disabled = false;
            cancel.textContent = pl.saveTransfer.close;
            cancel.focus();
        };
        void apply(fresh()).then((result) => (result.ok ? reload() : failed()), failed);
    });
    const actions = document.createElement('div');
    actions.className = 'parent-actions';
    if (blocked) actions.append(cancel);
    else actions.append(cancel, confirm);
    const handle: DomDialog = openDialog(
        parent,
        createText('h1', pl.saveTransfer.resetTitle),
        blocked
            ? [createText('p', pl.saveTransfer.deviceUnavailable), actions]
            : [
                  createText('p', pl.saveTransfer.resetBody),
                  device.kind === 'summary' ? createSummaryList(pl.saveTransfer.now, device.summary, roomName) : createText('p', pl.saveTransfer.deviceUnreadable, 'overlay-muted'),
                  createText('p', pl.saveTransfer.resetHint, 'overlay-muted'),
                  message,
                  actions,
              ],
        finish,
    );
    return handle.close;
};
