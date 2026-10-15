import type { ArtHealthView } from '../../core/artHealth';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/**
 * Parent's "Obrazki" line: whether the task pictures loaded. Renders an ArtHealthView (the `unknown` case is filtered out by
 * the panel). DESIGN-GAP 67 (docs/design-gaps.md): the kit has no such line; plain heading and one sentence behind the adult gate.
 */
export const createArtHealthView = (view: Exclude<ArtHealthView, { kind: 'unknown' }>, roomView?: ArtHealthView): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'parent-art';
    section.dataset.state = view.kind;
    section.append(createText('h2', pl.settings.artHeading), createText('p', view.kind === 'ok' ? pl.settings.artOk : pl.settings.artMissing(view.count, view.total)));
    // Second line: the salon pictures (S-16a), absent when the boot scene recorded nothing.
    if (roomView && roomView.kind !== 'unknown') {
        const line = createText('p', roomView.kind === 'ok' ? pl.settings.roomArtOk : pl.settings.roomArtMissing(roomView.count, roomView.total));
        line.dataset.state = roomView.kind;
        line.className = 'parent-room-art';
        section.append(line);
    }
    return section;
};
