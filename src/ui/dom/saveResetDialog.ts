import type { DeviceSaveView } from '../../core/saveFile';
import type { ReplaceResult } from '../../core/autosave';
import type { SaveState } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog, type DomDialog } from './dialog';
import { createButton, createText } from './overlay';
import { blockedText, createSummaryList, failureText } from './saveSummaryView';

export interface SaveResetDialogOptions {
    /** What the device save is (S12-01): a summary of what will disappear, unreadable, or not readable at all. */
    device: Exclude<DeviceSaveView, { kind: 'broken' }>;
    roomName: (id: string) => string;
    /** The empty save to write; called only after the tap on "Zacznij od nowa". */
    fresh: () => SaveState;
    apply: (state: SaveState, force: boolean) => Promise<ReplaceResult>;
    /** Called after the dialog has closed itself (Cancel, Escape or Close). */
    onClose: () => void;
    reload?: () => void;
    parent?: HTMLElement;
}

/**
 * Reset (FR-022): says what will disappear, advises a copy first and needs one more tap. Initial focus is on the
 * safe "Anuluj" (the destructive button is plain, not the primary style, and never focused); a failed write leaves the save as it was.
 * A device save that was not read (`blocked`) offers no reset, only "Zamknij"; a refused read (`forceable`) adds "Zastąp mimo to", a second step that
 * lists the warning in the place of the summary and then resets with `force`. An `unreadable` one shows a warning in the place of the summary.
 * DESIGN-GAP 49 (docs/design-gaps.md): the kit has no reset confirmation; built from the S-06 dialog parts.
 * DESIGN-GAP 68 (docs/design-gaps.md): the kit has no line for a device save that was not read.
 * Returns the function that closes the dialog.
 */
export const openSaveResetDialog = ({ device, roomName, fresh, apply, onClose, reload = () => window.location.reload(), parent = document.body }: SaveResetDialogOptions): (() => void) => {
    let busy = false;
    let handle: DomDialog | undefined;
    const finish = (): void => {
        handle?.close();
        onClose();
    };
    const show = (body: HTMLElement[]): void => {
        handle?.close();
        handle = openDialog(parent, createText('h1', pl.saveTransfer.resetTitle), body, finish);
    };

    const blockedStep = (cause: Parameters<typeof blockedText>[0], forceable: boolean): void => {
        const cancel = createButton(pl.saveTransfer.close, finish);
        const actions = document.createElement('div');
        actions.className = 'parent-actions';
        // The overwrite path is a plain button, never the primary style and never focused; "Zamknij" holds the focus.
        if (forceable) actions.append(createButton(pl.saveTransfer.force, () => confirmStep(true)));
        actions.append(cancel);
        show([createText('p', blockedText(cause)), actions]);
        cancel.focus();
    };

    const confirmStep = (forced: boolean): void => {
        const message = createText('p', '', 'overlay-muted');
        message.setAttribute('role', 'status');
        message.hidden = true;
        const cancel = createButton(pl.parent.cancel, finish);
        const confirm = createButton(pl.saveTransfer.resetConfirm, () => {
            if (busy) return;
            busy = true;
            confirm.disabled = true;
            cancel.disabled = true;
            const failed = (result: ReplaceResult | null): void => {
                busy = false;
                message.textContent = failureText(result, forced, pl.saveTransfer.resetFailed);
                message.hidden = false;
                confirm.hidden = true;
                cancel.disabled = false;
                cancel.textContent = pl.saveTransfer.close;
                cancel.focus();
            };
            void apply(fresh(), forced).then((result) => (result.ok ? reload() : failed(result)), () => failed(null));
        });
        const actions = document.createElement('div');
        actions.className = 'parent-actions';
        actions.append(cancel, confirm);
        show([
            createText('p', pl.saveTransfer.resetBody),
            device.kind === 'summary'
                ? createSummaryList(pl.saveTransfer.now, device.summary, roomName)
                : createText('p', forced ? pl.saveTransfer.forcedWarning : pl.saveTransfer.deviceUnreadable, 'overlay-muted'),
            createText('p', pl.saveTransfer.resetHint, 'overlay-muted'),
            message,
            actions,
        ]);
        // The destructive button is plain and never focused: the initial focus goes to the safe "Anuluj".
        cancel.focus();
    };

    if (device.kind === 'blocked') blockedStep(device.cause, device.forceable);
    else confirmStep(false);
    return () => handle?.close();
};
