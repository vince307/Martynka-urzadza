import type { SaveHealthView } from '../../core/saveHealth';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/**
 * Parent's "Zapis gry" line (audit C-2): whether progress is being saved on this device. Renders a SaveHealthView and
 * computes nothing beyond the clock time; read once when the panel opens (the panel is modal, so the snapshot is exact).
 * DESIGN-GAP 43 (docs/design-gaps.md): the kit has no save indicator; plain heading and one sentence behind the adult gate.
 */
export const createSaveHealthView = (view: SaveHealthView): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'parent-save';
    section.dataset.state = view.kind;
    const sentence = view.kind === 'off' ? pl.settings.saveOff[view.cause] : view.kind === 'failing' ? pl.settings.saveFailing : pl.settings.saveOk;
    section.append(createText('h2', pl.settings.saveHeading), createText('p', sentence));
    if (view.kind === 'ok' && view.lastWriteAt !== null) {
        const time = new Date(view.lastWriteAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        section.append(createText('p', pl.settings.saveLast(time)));
    }
    return section;
};
