import { createButton, createOverlay, createText } from './overlay';

export interface SaveCardCopy {
    title: string;
    body: string;
    continue: string;
    note: string;
    export?: string;
    /** The wait button and its states; present only on the slow-read card. */
    wait?: string;
    waiting?: string;
    stillSlow?: string;
}

export interface SaveFailedHandlers {
    copy: SaveCardCopy;
    onContinue: () => void;
    /** Present only for a save that exists and can be kept; the button is absent without it. */
    onExport?: () => void;
    /** Muted line under the note: the reason code and the build, for the parent to quote (audit M-S3). */
    detail?: string;
    /**
     * Present only for a read that timed out: "Poczekaj dłużej" waits on the same read and answers whether the card was
     * closed by a result ('loaded') or the second limit passed too ('still-slow': the button goes, the body becomes `stillSlow`).
     */
    onWait?: () => Promise<'loaded' | 'still-slow'>;
}

/**
 * The card for a save that could not be read or reached (DESIGN-GAP 42, 45, 51: the kit has no such view; it reuses
 * the overlay styles). The copy is a parameter; "Zachowaj kopię" appears only when there is something to export. Mounted before the game exists, so there is no canvas below and no input switch to hold.
 * "Graj dalej" is the main button and takes the focus; "Zachowaj kopię" is the quiet one for the parent.
 */
export const mountSaveFailedCard = (parent: HTMLElement, handlers: SaveFailedHandlers): { remove(): void } => {
    const { copy, onExport, onContinue, detail, onWait } = handlers;
    const title = createText('h1', copy.title);
    title.id = 'save-failed-title';
    const continueButton = createButton(copy.continue, onContinue);
    const actions = document.createElement('div');
    actions.className = 'overlay-actions';
    if (onExport && copy.export) {
        const exportButton = createButton(copy.export, onExport);
        exportButton.classList.add('overlay-secondary');
        actions.append(exportButton);
    }
    const body = createText('p', copy.body);
    if (onWait && copy.wait) {
        const waitButton = createButton(copy.wait, () => {
            waitButton.disabled = true;
            waitButton.textContent = copy.waiting ?? copy.wait ?? '';
            // A disabled button drops the focus to the page: "Graj dalej" keeps the keyboard path (it never overwrites the save).
            continueButton.focus();
            void onWait().then((result) => {
                if (result === 'still-slow') {
                    waitButton.remove();
                    body.textContent = copy.stillSlow ?? copy.body;
                }
            });
        });
        waitButton.classList.add('overlay-secondary');
        actions.append(waitButton);
    }
    actions.append(continueButton);
    const card = createOverlay('overlay-save-failed', [
        title,
        body,
        actions,
        createText('p', copy.note, 'overlay-muted'),
        ...(detail ? [createText('p', detail, 'overlay-muted')] : []),
    ]);
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-labelledby', title.id);
    parent.append(card);
    continueButton.focus();
    return { remove: () => card.remove() };
};
