import type { StageId } from '../../core/types';
import { pl } from '../../data/pl';
import { createButton, createText } from './overlay';

export interface StageChoices {
    /** Heading and the button group, ready to append to a dialog body. */
    elements: HTMLElement[];
    /** Marks one stage as chosen (aria-pressed) and optionally tags one as proposed. */
    show: (chosen: StageId | null, proposed?: StageId | null) => void;
}

const STAGES = Object.keys(pl.stages) as StageId[];

/**
 * The stage button group shared by the start panel (S-06) and the parent settings panel (S-08):
 * role="group" labelled by its heading, one aria-pressed button per stage. `idPrefix` keeps the
 * heading id unique (an IDREF: no spaces).
 */
export const createStageChoices = (idPrefix: string, onPick: (stage: StageId) => void): StageChoices => {
    const buttons = STAGES.map((id) => {
        const button = createButton(pl.stages[id], () => onPick(id));
        const tag = document.createElement('span');
        tag.className = 'parent-tag';
        button.append(tag);
        return { id, button, tag };
    });
    const row = document.createElement('div');
    row.className = 'parent-choices parent-choices-stages';
    row.setAttribute('role', 'group');
    row.append(...buttons.map((b) => b.button));
    const title = createText('p', pl.parent.stageHeading);
    title.id = `${idPrefix}-stage`;
    row.setAttribute('aria-labelledby', title.id);
    return {
        elements: [title, row],
        show: (chosen, proposed = null) => {
            for (const { id, button, tag } of buttons) {
                button.setAttribute('aria-pressed', String(id === chosen));
                tag.textContent = id === proposed ? `(${pl.parent.proposal})` : '';
            }
        },
    };
};
