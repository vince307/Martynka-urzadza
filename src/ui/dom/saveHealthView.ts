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
    const sentence =
        view.kind === 'off'
            ? pl.settings.saveOff[view.cause]
            : view.kind === 'failing'
              ? view.slow
                  ? pl.settings.saveFailingTimeout
                  : pl.settings.saveFailing
              : view.kind === 'notYet'
                ? pl.settings.saveNotYet
                : pl.settings.saveOk;
    section.append(createText('h2', pl.settings.saveHeading), createText('p', sentence));
    // DESIGN-GAP 69: the code the parent can quote, same format as on the start card.
    if (view.kind === 'off' && view.code !== null) section.append(createText('p', pl.saveFailed.detail(view.code, __BUILD_ID__), 'overlay-muted'));
    if (view.kind === 'failing') section.append(createText('p', pl.settings.saveFailingDetail(view.count, view.stage, view.error), 'overlay-muted'));
    if (view.kind === 'ok') {
        if (view.lastWriteAt !== null) {
            const time = new Date(view.lastWriteAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
            section.append(createText('p', pl.settings.saveLast(time)));
        }
        if (view.earlierFailures !== null) section.append(createText('p', pl.settings.saveEarlier(view.earlierFailures.count, view.earlierFailures.error)));
    }
    if (view.migration !== null) {
        section.append(createText('p', pl.settings.saveMigrated[view.migration.copy](view.migration.from)));
        if (view.migration.code !== null) section.append(createText('p', pl.saveFailed.detail(view.migration.code, __BUILD_ID__), 'overlay-muted'));
    }
    // DESIGN-GAP 137: report only; the saved rooms are never changed.
    if (view.roomMismatch) section.append(createText('p', pl.settings.roomMismatch));
    if (view.olderWriter) section.append(createText('p', pl.settings.olderWriter));
    if (view.persistence !== 'unknown') section.append(createText('p', pl.settings.savePersist[view.persistence]));
    return section;
};
