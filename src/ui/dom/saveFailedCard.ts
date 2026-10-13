import { pl } from '../../data/pl';
import { createButton, createOverlay, createText } from './overlay';

export interface SaveFailedHandlers {
    onExport: () => void;
    onContinue: () => void;
}

/**
 * The card for a save that could not be read (DESIGN-GAP 42: the kit has no such view; it reuses the overlay
 * styles). Mounted before the game exists, so there is no canvas below and no input switch to hold.
 * "Graj dalej" is the main button and takes the focus; "Zachowaj kopię" is the quiet one for the parent.
 */
export const mountSaveFailedCard = (parent: HTMLElement, handlers: SaveFailedHandlers): { remove(): void } => {
    const title = createText('h1', pl.saveFailed.title);
    title.id = 'save-failed-title';
    const exportButton = createButton(pl.saveFailed.export, handlers.onExport);
    exportButton.classList.add('overlay-secondary');
    const continueButton = createButton(pl.saveFailed.continue, handlers.onContinue);
    const actions = document.createElement('div');
    actions.className = 'overlay-actions';
    actions.append(exportButton, continueButton);
    const card = createOverlay('overlay-save-failed', [
        title,
        createText('p', pl.saveFailed.body),
        actions,
        createText('p', pl.saveFailed.note, 'overlay-muted'),
    ]);
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-labelledby', title.id);
    parent.append(card);
    continueButton.focus();
    return { remove: () => card.remove() };
};
