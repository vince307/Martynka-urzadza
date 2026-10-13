import type { SaveSummary } from '../../core/saveFile';
import type { ReplaceResult } from '../../core/autosave';
import type { SaveState } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog, type DomDialog } from './dialog';
import { createButton, createText } from './overlay';
import { createSummaryList } from './saveSummaryView';

export interface SaveResetDialogOptions {
    /** The summary of the save on this device: what will disappear. */
    current: SaveSummary;
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
 * DESIGN-GAP 49 (docs/design-gaps.md): the kit has no reset confirmation; built from the S-06 dialog parts.
 * Returns the function that closes the dialog.
 */
export const openSaveResetDialog = ({ current, roomName, fresh, apply, onClose, reload = () => window.location.reload(), parent = document.body }: SaveResetDialogOptions): (() => void) => {
    let busy = false;
    const message = createText('p', '', 'overlay-muted');
    message.setAttribute('role', 'status');
    message.hidden = true;
    const finish = (): void => {
        handle.close();
        onClose();
    };
    const cancel = createButton(pl.parent.cancel, finish);
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
    actions.append(cancel, confirm);
    const handle: DomDialog = openDialog(
        parent,
        createText('h1', pl.saveTransfer.resetTitle),
        [createText('p', pl.saveTransfer.resetBody), createSummaryList(pl.saveTransfer.now, current, roomName), createText('p', pl.saveTransfer.resetHint, 'overlay-muted'), message, actions],
        finish,
    );
    return handle.close;
};
