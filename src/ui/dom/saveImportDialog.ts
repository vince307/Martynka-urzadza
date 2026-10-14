import { parseImport, type DeviceSaveView, type ImportRejection, type SaveSummary } from '../../core/saveFile';
import { encodeSave, type SessionSave } from '../../core/save';
import type { ReplaceResult } from '../../core/autosave';
import type { SaveState } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog, type DomDialog } from './dialog';
import { createButton, createText } from './overlay';
import { blockedText, createSummaryList, failureText } from './saveSummaryView';

export interface SaveImportDialogOptions {
    /** What the device save is: a summary ("Teraz"), unreadable, or not readable at all (S12-01). Never a fresh session. */
    device: Exclude<DeviceSaveView, { kind: 'broken' }>;
    /** Builds the summary of the file's save ("Z pliku"); the caller owns the room data. */
    summarize: (session: SessionSave) => SaveSummary;
    roomName: (id: string) => string;
    maxBytes: number;
    /** Replaces the save; called only after the summary step and the "Wczytaj" tap. */
    apply: (state: SaveState, force: boolean) => Promise<ReplaceResult>;
    /** Called after the dialog has closed itself (Cancel, Escape or Close). */
    onClose: () => void;
    reload?: () => void;
    parent?: HTMLElement;
}

/**
 * Import in two steps (FR-022): pick a file, then compare "Teraz" and "Z pliku" and tap "Wczytaj". A file that
 * fails is refused with a calm line and the save is never touched; only the second step calls `apply`, and that step
 * opens with the focus on "Anuluj".
 * A device save that was not read (`blocked`) offers no file, only "Zamknij"; a refused read (`forceable`) adds "Zastąp mimo to", a second step with the
 * file choice and the warning, and then replaces with `force`. An `unreadable` one shows a warning in the place of "Teraz".
 * DESIGN-GAP 48 (docs/design-gaps.md): the kit has no import flow; built from the S-06 dialog parts.
 * DESIGN-GAP 68 (docs/design-gaps.md): the kit has no line for a device save that was not read.
 * Returns the function that closes the dialog.
 */
export const openSaveImportDialog = ({ device, summarize, roomName, maxBytes, apply, onClose, reload = () => window.location.reload(), parent = document.body }: SaveImportDialogOptions): (() => void) => {
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

    const stepTwo = (session: SessionSave, forced: boolean, file: { build: string | null; exportedAt: string | null }): void => {
        const message = createText('p', '', 'overlay-muted');
        message.setAttribute('role', 'status');
        message.hidden = true;
        const load = createButton(pl.saveTransfer.load, () => {
            if (busy) return;
            busy = true;
            load.disabled = true;
            cancel.disabled = true;
            void apply(encodeSave(session), forced).then(
                (result) => {
                    if (result.ok) {
                        reload();
                        return;
                    }
                    failed(result);
                },
                () => failed(null),
            );
            const failed = (result: ReplaceResult | null): void => {
                busy = false;
                message.textContent = failureText(result, forced, pl.saveTransfer.applyFailed);
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
            device.kind === 'summary' ? createSummaryList(pl.saveTransfer.now, device.summary, roomName) : createText('p', unreadableLine(forced), 'overlay-muted'),
            createSummaryList(pl.saveTransfer.fromFile, summarize(session), roomName),
            ...fileInfoLine(file),
            message,
            actions,
        ]);
        // "Wczytaj" overwrites the child's progress: the initial focus goes to the safe "Anuluj", never to the overwrite.
        cancel.focus();
    };

    // S12-09: the date and build the file says about itself; nothing when the file names neither (a hand-made one).
    const fileInfoLine = (file: { build: string | null; exportedAt: string | null }): HTMLElement[] => {
        const parsed = file.exportedAt === null ? Number.NaN : Date.parse(file.exportedAt);
        const date = Number.isNaN(parsed) ? null : new Date(parsed).toLocaleDateString('pl-PL');
        const text = pl.saveTransfer.fileInfo(date, file.build);
        return text === '' ? [] : [createText('p', text, 'overlay-muted')];
    };

    const unreadableLine = (forced: boolean): string => (forced ? pl.saveTransfer.forcedWarning : pl.saveTransfer.deviceUnreadable);

    const blockedStep = (cause: Parameters<typeof blockedText>[0], forceable: boolean): void => {
        const cancel = createButton(pl.saveTransfer.close, finish);
        const actions = document.createElement('div');
        actions.className = 'parent-actions';
        // The overwrite path is a plain button, never the primary style and never focused; "Zamknij" holds the focus.
        if (forceable) actions.append(createButton(pl.saveTransfer.force, () => stepOne(undefined, true)));
        actions.append(cancel);
        show(pl.saveTransfer.importTitle, [createText('p', blockedText(cause)), actions]);
        cancel.focus();
    };

    const stepOne = (rejection?: ImportRejection, forced = false): void => {
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
            stepOne(reason, forced);
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
                    if (result.kind === 'ok') stepTwo(result.session, forced, result.file);
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
        show(pl.saveTransfer.importTitle, [
            createText('p', pl.saveTransfer.importBody),
            ...(device.kind !== 'summary' ? [createText('p', unreadableLine(forced), 'overlay-muted')] : []),
            createText('p', pl.saveTransfer.importPrivacy, 'overlay-muted'),
            message,
            input,
            actions,
        ]);
    };

    if (device.kind === 'blocked') blockedStep(device.cause, device.forceable);
    else stepOne();
    return close;
};
