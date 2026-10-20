import type { ArtHealthLine } from '../../core/artHealth';
import { pl } from '../../data/pl';
import { createText } from './overlay';

const TABLE_CLASS = { task: '', room: 'parent-room-art', ui: 'parent-ui-art' } as const;

const textOf = (line: ArtHealthLine): string => {
    switch (line.kind) {
        case 'ok':
            return line.table === 'task' ? pl.settings.artOk : line.table === 'room' ? pl.settings.roomArtOk : pl.settings.uiArtOk;
        case 'missing':
            return line.table === 'task' ? pl.settings.artMissing(line.count, line.total) : line.table === 'room' ? pl.settings.roomArtMissing(line.count, line.total) : pl.settings.uiArtMissing(line.count, line.total);
        case 'cut':
            return line.background ? pl.settings.artCutBackground : pl.settings.artCut;
        case 'folder':
            return pl.settings.artFolders(line.folder, line.count);
        case 'skipped':
            return pl.settings.artSkipped;
        case 'labels':
            return pl.settings.artLabels(line.labels);
        case 'font':
            return pl.settings.fontFallback;
        case 'fallback':
            return pl.settings.artFallback(line.where.map((where) => pl.settings.artFallbackNames[where]));
        case 'advice':
            return line.restart ? pl.settings.artRestart : pl.settings.artNoRestart;
        case 'cause':
            return pl.settings.artCause[line.cause];
        case 'code':
            return pl.saveFailed.detail(line.code, line.build);
    }
};

/**
 * Parent's "Obrazki" section: draws the lines the pure `artHealthLines` built (one paragraph each, no style of its own).
 * DESIGN-GAP 67, 119, 140-146 (docs/design-gaps.md): the kit has no such section; plain heading and sentences behind the adult gate.
 */
export const createArtHealthView = (lines: readonly ArtHealthLine[]): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'parent-art';
    section.dataset.state = lines.some((line) => line.kind === 'missing' || line.kind === 'cut' || line.kind === 'font') ? 'missing' : 'ok';
    section.append(createText('h2', pl.settings.artHeading));
    for (const line of lines) {
        const paragraph = createText('p', textOf(line));
        if (line.kind === 'ok' || line.kind === 'missing') {
            paragraph.dataset.state = line.kind;
            if (TABLE_CLASS[line.table]) paragraph.className = TABLE_CLASS[line.table];
        }
        section.append(paragraph);
    }
    return section;
};
