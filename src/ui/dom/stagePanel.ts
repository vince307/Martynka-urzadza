import { placeByParent, proposeStage, type SessionLearner } from '../../core/placement';
import type { StageId } from '../../core/types';
import { pl } from '../../data/pl';
import { placementData } from '../../data/placement';
import { openDialog } from './dialog';
import { createButton, createText } from './overlay';

export interface StagePanelOptions {
    /** Month of the session (0-11), as the placement needs it. */
    month: number;
    onConfirm: (learner: SessionLearner) => void;
    onCancel: () => void;
    parent?: HTMLElement;
}

const STAGES = Object.keys(pl.stages) as StageId[];

/**
 * Parent's start settings: child's age (marks the proposed stage), stage, "Zatwierdź". The result
 * is core/placement's placeByParent. Returns the function that closes the panel.
 */
export const openStagePanel = ({ month, onConfirm, onCancel, parent = document.body }: StagePanelOptions): (() => void) => {
    let age: number | null = null;
    let stage: StageId | null = null;
    let proposed: StageId | null = null;
    let stageChosenByParent = false;

    const ageButtons = placementData.ages.map((value, i) => {
        const button = createButton(pl.parent.ageOption(value, i === placementData.ages.length - 1), () => {
            age = value;
            proposed = proposeStage(value, month, placementData);
            if (!stageChosenByParent) {
                stage = proposed;
            }
            refresh();
        });
        return { value, button };
    });
    const stageButtons = STAGES.map((id) => {
        const button = createButton(pl.stages[id], () => {
            stage = id;
            stageChosenByParent = true;
            refresh();
        });
        const tag = document.createElement('span');
        tag.className = 'parent-tag';
        button.append(tag);
        return { id, button, tag };
    });
    const confirm = createButton(pl.parent.confirm, () => {
        if (age === null || stage === null) {
            return;
        }
        handle.close();
        onConfirm(placeByParent(age, stage, month, placementData));
    });
    confirm.classList.add('parent-primary');

    const refresh = (): void => {
        for (const { value, button } of ageButtons) {
            button.setAttribute('aria-pressed', String(value === age));
        }
        for (const { id, button, tag } of stageButtons) {
            button.setAttribute('aria-pressed', String(id === stage));
            tag.textContent = id === proposed ? `(${pl.parent.proposal})` : '';
        }
        confirm.disabled = age === null || stage === null;
    };

    const group = (key: 'age' | 'stage', heading: string, className: string, buttons: HTMLButtonElement[]): HTMLElement[] => {
        const row = document.createElement('div');
        row.className = className;
        row.setAttribute('role', 'group');
        row.append(...buttons);
        const title = createText('p', heading);
        const id = `parent-panel-${key}`; // an IDREF: no spaces (aria-labelledby is a space-separated list)
        title.id = id;
        row.setAttribute('aria-labelledby', id);
        return [title, row];
    };
    const cancel = (): void => {
        handle.close();
        onCancel();
    };
    const actions = document.createElement('div');
    actions.className = 'parent-actions';
    actions.append(confirm, createButton(pl.parent.cancel, cancel));

    const handle = openDialog(
        parent,
        createText('h1', pl.parent.panelTitle),
        [
            ...group('age', pl.parent.ageHeading, 'parent-choices', ageButtons.map((a) => a.button)),
            ...group('stage', pl.parent.stageHeading, 'parent-choices parent-choices-stages', stageButtons.map((s) => s.button)),
            actions,
        ],
        cancel,
    );
    refresh();
    return handle.close;
};
