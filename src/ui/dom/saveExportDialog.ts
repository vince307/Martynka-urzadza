import { pl } from '../../data/pl';
import { openDialog } from './dialog';
import { createButton, createText } from './overlay';
import { saveFileToDevice, type ExportOutcome } from './saveExport';

export interface SaveExportDialogOptions {
    /** Builds the file at the moment of the tap ("now" is the tap time); the caller owns the content and the name. */
    file: (now: Date) => { text: string; fileName: string };
    /** Called after the dialog has closed itself (Cancel, Escape or Close). */
    onClose: () => void;
    now?: () => Date;
    parent?: HTMLElement;
}

/**
 * Confirmation before a copy of the save leaves the app (audit L-S2): nothing is shared or downloaded until the
 * parent taps "Zapisz plik". Then one line says what happened; a saved copy turns the buttons into "Zamknij", a
 * cancelled or failed one lets the parent try again. Returns the function that closes the dialog.
 * DESIGN-GAP 47 (docs/design-gaps.md): the kit has no export confirmation; built from the S-06 dialog parts.
 */
export const openSaveExportDialog = ({ file, onClose, now = () => new Date(), parent = document.body }: SaveExportDialogOptions): (() => void) => {
    const result = createText('p', '', 'overlay-muted');
    result.setAttribute('role', 'status');
    result.hidden = true;
    let busy = false;

    const close = (): void => handle.close();
    const finish = (): void => {
        close();
        onClose();
    };
    const save = createButton(pl.saveTransfer.saveFile, () => {
        if (busy) return;
        busy = true;
        const { text, fileName } = file(now());
        void saveFileToDevice(text, fileName).then((outcome: ExportOutcome) => {
            busy = false;
            result.textContent = pl.saveTransfer.exportOutcome[outcome];
            result.hidden = false;
            if (outcome === 'shared' || outcome === 'downloaded') {
                save.hidden = true;
                cancel.textContent = pl.saveTransfer.close;
                cancel.focus();
            }
        });
    });
    save.classList.add('parent-primary');
    const cancel = createButton(pl.parent.cancel, finish);
    const actions = document.createElement('div');
    actions.className = 'parent-actions';
    actions.append(save, cancel);

    const handle = openDialog(
        parent,
        createText('h1', pl.saveTransfer.exportTitle),
        [createText('p', pl.saveTransfer.exportBody), createText('p', pl.saveTransfer.privacy, 'overlay-muted'), result, actions],
        finish,
    );
    return close;
};
