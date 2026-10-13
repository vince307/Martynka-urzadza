import { placeByParent, proposeStage, type PlacedLearner } from '../../core/placement';
import type { StageId } from '../../core/types';
import { pl } from '../../data/pl';
import { placementData } from '../../data/placement';
import { openDialog } from './dialog';
import { createStageChoices } from './stageChoices';
import { createButton, createText } from './overlay';

export interface StagePanelOptions {
    /** Month of the session (0-11), as the placement needs it. */
    month: number;
    onConfirm: (learner: PlacedLearner) => void;
    onCancel: () => void;
    parent?: HTMLElement;
}

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
    const stageChoices = createStageChoices('parent-panel', (id) => {
        stage = id;
        stageChosenByParent = true;
        refresh();
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
        stageChoices.show(stage, proposed);
        confirm.disabled = age === null || stage === null;
    };

    const ageGroup = (): HTMLElement[] => {
        const row = document.createElement('div');
        row.className = 'parent-choices';
        row.setAttribute('role', 'group');
        row.append(...ageButtons.map((a) => a.button));
        const title = createText('p', pl.parent.ageHeading);
        title.id = 'parent-panel-age'; // an IDREF: no spaces (aria-labelledby is a space-separated list)
        row.setAttribute('aria-labelledby', title.id);
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
            ...ageGroup(),
            ...stageChoices.elements,
            actions,
        ],
        cancel,
    );
    refresh();
    return handle.close;
};
