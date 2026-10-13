import { parseImport, type ImportRejection, type SaveSummary } from '../../core/saveFile';
import { encodeSave, type SessionSave } from '../../core/save';
import type { ReplaceResult } from '../../core/autosave';
import type { SaveState } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog, type DomDialog } from './dialog';
import { createButton, createText } from './overlay';
import { createSummaryList } from './saveSummaryView';

export interface SaveImportDialogOptions {
    /** The summary of the save on this device ("Teraz"). */
    current: SaveSummary;
    /** Builds the summary of the file's save ("Z pliku"); the caller owns the room data. */
    summarize: (session: SessionSave) => SaveSummary;
    roomName: (id: string) => string;
    maxBytes: number;
    /** Replaces the save; called only after the summary step and the "Wczytaj" tap. */
    apply: (state: SaveState) => Promise<ReplaceResult>;
    /** Called after the dialog has closed itself (Cancel, Escape or Close). */
    onClose: () => void;
    reload?: () => void;
    parent?: HTMLElement;
}

/**
 * Import in two steps (FR-022): pick a file, then compare "Teraz" and "Z pliku" and tap "Wczytaj". A file that
 * fails is refused with a calm line and the save is never touched; only the second step calls `apply`, and that step
 * opens with the focus on "Anuluj".
 * DESIGN-GAP 48 (docs/design-gaps.md): the kit has no import flow; built from the S-06 dialog parts.
 * Returns the function that closes the dialog.
 */
export const openSaveImportDialog = ({ current, summarize, roomName, maxBytes, apply, onClose, reload = () => window.location.reload(), parent = document.body }: SaveImportDialogOptions): (() => void) => {
    let handle: DomDialog | undefined;
    let busy = false;
    const close = (): void => handle?.close();
    const finish = (): void => {
        close();
        onClose();
    };
    const show = (title: string, body: HTMLElement[]): void => {
        handle?.close();
        handle = openDialog(parent, createText('h1', title), body, finish);
    };

    const stepTwo = (session: SessionSave): void => {
        const message = createText('p', '', 'overlay-muted');
        message.setAttribute('role', 'status');
        message.hidden = true;
        const load = createButton(pl.saveTransfer.load, () => {
            if (busy) return;
            busy = true;
            load.disabled = true;
            cancel.disabled = true;
            void apply(encodeSave(session)).then(
                (result) => {
                    if (result.ok) {
                        reload();
                        return;
                    }
                    failed();
                },
                () => failed(),
            );
            const failed = (): void => {
                busy = false;
                message.textContent = pl.saveTransfer.applyFailed;
                message.hidden = false;
                load.hidden = true;
                cancel.disabled = false;
                cancel.textContent = pl.saveTransfer.close;
                cancel.focus();
            };
        });
        load.classList.add('parent-primary');
        const cancel = createButton(pl.parent.cancel, finish);
        const actions = document.createElement('div');
        actions.className = 'parent-actions';
        actions.append(load, cancel);
        show(pl.saveTransfer.importTitle, [
            createSummaryList(pl.saveTransfer.now, current, roomName),
            createSummaryList(pl.saveTransfer.fromFile, summarize(session), roomName),
            message,
            actions,
        ]);
        // "Wczytaj" overwrites the child's progress: the initial focus goes to the safe "Anuluj", never to the overwrite.
        cancel.focus();
    };

    const stepOne = (rejection?: ImportRejection): void => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.json,text/plain,application/json';
        input.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
        input.tabIndex = -1;
        const message = createText('p', rejection ? pl.saveTransfer.rejected[rejection] : '', 'overlay-muted');
        message.setAttribute('role', 'status');
        message.hidden = !rejection;
        const refuse = (reason: ImportRejection, problem: string | null): void => {
            console.warn('import refused:', reason, problem ?? '');
            stepOne(reason);
        };
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > maxBytes) {
                refuse('too-big', null);
                return;
            }
            file.text().then(
                (text) => {
                    const result = parseImport(text, maxBytes);
                    if (result.kind === 'ok') stepTwo(result.session);
                    else refuse(result.reason, result.problem);
                },
                () => refuse('not-json', null),
            );
        });
        const choose = createButton(rejection ? pl.saveTransfer.chooseOther : pl.saveTransfer.choose, () => input.click());
        choose.classList.add('parent-primary');
        const cancel = createButton(rejection ? pl.saveTransfer.close : pl.parent.cancel, finish);
        const actions = document.createElement('div');
        actions.className = 'parent-actions';
        actions.append(choose, cancel);
        show(pl.saveTransfer.importTitle, [createText('p', pl.saveTransfer.importBody), createText('p', pl.saveTransfer.importPrivacy, 'overlay-muted'), message, input, actions]);
    };

    stepOne();
    return close;
};
