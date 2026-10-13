import type { SaveSummary } from '../../core/saveFile';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/** The three lines a parent compares before a save is overwritten (stars, stage, rooms); shared by the import and reset dialogs. */
export const createSummaryList = (title: string, summary: SaveSummary, roomName: (id: string) => string): HTMLElement => {
    const box = document.createElement('div');
    box.className = 'import-summary';
    const lines = [
        pl.saveTransfer.stars(summary.stars),
        summary.stage ? pl.stages[summary.stage] : pl.saveTransfer.noStage,
        ...summary.rooms.map((r) => pl.saveTransfer.room(roomName(r.id), r.done, r.total)),
    ];
    box.append(createText('h2', title), ...lines.map((line) => createText('p', line)));
    return box;
};
