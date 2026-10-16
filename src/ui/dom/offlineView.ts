import type { OfflineView } from '../../core/swStatus';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/**
 * Parent's "Gra bez internetu" line (audit P-1): whether the game will start without internet and whether a newer build
 * waits for the next launch. Renders an OfflineView read once when the panel opens.
 * DESIGN-GAP 118 (docs/design-gaps.md): the kit has no such line; plain heading and one sentence behind the adult gate.
 */
export const createOfflineView = (view: OfflineView): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'parent-offline';
    section.dataset.state = view.line;
    section.append(createText('h2', pl.settings.offline.heading), createText('p', pl.settings.offline[view.line]));
    if (view.code !== null) section.append(createText('p', pl.saveFailed.detail(view.code, __BUILD_ID__), 'overlay-muted'));
    if (view.takenOver) section.append(createText('p', pl.settings.offline.takenOver));
    return section;
};
