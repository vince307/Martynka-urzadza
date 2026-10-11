import { pl } from '../../data/pl';
import { createOverlay, createText } from './overlay';

/**
 * "Rotate your tablet" overlay (FR-002). Visibility is pure CSS:
 * `@media (orientation: portrait)` in public/style.css shows it; the game keeps
 * running underneath. Phaser's lockOrientation() does not work in current
 * browsers, so no JS orientation handling here.
 */
export const mountRotateOverlay = (parent: HTMLElement): void => {
    const icon = document.createElement('div');
    icon.className = 'rotate-icon';
    icon.setAttribute('aria-hidden', 'true');
    parent.append(
        createOverlay('overlay-rotate', [
            icon,
            createText('h1', pl.overlay.rotate),
            createText('p', pl.overlay.rotateHint),
        ]),
    );
};
