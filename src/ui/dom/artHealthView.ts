import type { ArtHealthView } from '../../core/artHealth';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/**
 * Parent's "Obrazki" line: whether the task pictures loaded. Renders an ArtHealthView (the `unknown` case is filtered out by
 * the panel). DESIGN-GAP 67 (docs/design-gaps.md): the kit has no such line; plain heading and one sentence behind the adult gate.
 */
export const createArtHealthView = (view: Exclude<ArtHealthView, { kind: 'unknown' }>): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'parent-art';
    section.dataset.state = view.kind;
    section.append(createText('h2', pl.settings.artHeading), createText('p', view.kind === 'ok' ? pl.settings.artOk : pl.settings.artMissing(view.count, view.total)));
    return section;
};
