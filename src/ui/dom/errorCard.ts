import { pl } from '../../data/pl';
import { createButton, createOverlay, createText } from './overlay';

let mounted: HTMLDivElement | undefined;

/**
 * The calm card shown when the game breaks (DESIGN-GAP 29: the kit has no such view; it reuses the
 * overlay styles; the muted code line is DESIGN-GAP 51's `Kod:` wording, shared with the save cards). One title,
 * one sentence, one restart button, a small line with the error code and build id for the parent.
 * No stack trace, no promise about saved progress. Idempotent: a second call returns the card (the first code wins).
 */
export const mountErrorCard = (parent: HTMLElement, buildId: string, code: string, onRestart: () => void): HTMLDivElement => {
    if (mounted?.isConnected) {
        return mounted;
    }
    const title = createText('h1', pl.errorCard.title);
    title.id = 'error-card-title';
    const restart = createButton(pl.errorCard.restart, onRestart);
    const card = createOverlay('overlay-error', [
        title,
        createText('p', pl.errorCard.body),
        restart,
        createText('p', pl.saveFailed.detail(code, buildId), 'overlay-muted'),
    ]);
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-labelledby', title.id);
    parent.append(card);
    restart.focus();
    mounted = card;
    return card;
};
