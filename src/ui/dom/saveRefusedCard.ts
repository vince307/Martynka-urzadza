import { openInputSession, type InputSuspender } from '../../core/inputSuspend';
import { pl } from '../../data/pl';
import { createButton, createOverlay, createText } from './overlay';

/**
 * The card for a save refused because a newer game version or another window saved on this device (DESIGN-GAP 117:
 * the kit has no such view; it reuses the overlay styles). One title, one sentence, an optional `Kod:` line (T-5, the error name and the build), one restart button that takes the
 * focus (a restart is harmless: nothing is overwritten). It holds the one input switch while it is up, so the game
 * below ignores touches; the hold ends with `remove` (and when the restart callback throws).
 */
export const mountSaveRefusedCard = (parent: HTMLElement, onRestart: () => void, suspender?: InputSuspender, detail?: string): (() => void) => {
    const session = suspender ? openInputSession(suspender) : undefined;
    const title = createText('h1', pl.saveRefused.title);
    title.id = 'save-refused-title';
    const restart = createButton(pl.saveRefused.restart, () => (session ? session.run(onRestart) : onRestart()));
    const card = createOverlay('overlay-save-refused', [title, createText('p', pl.saveRefused.body), ...(detail ? [createText('p', detail, 'overlay-muted')] : []), restart]);
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-labelledby', title.id);
    parent.append(card);
    restart.focus();
    return () => {
        card.remove();
        session?.end();
    };
};
