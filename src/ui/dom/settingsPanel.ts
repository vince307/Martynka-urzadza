import type { StageId } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog } from './dialog';
import { createButton, createText } from './overlay';
import { createStageChoices } from './stageChoices';

export interface SettingsPanelOptions {
    /** The learner's current stage (marked as chosen when the panel opens). */
    stage: StageId;
    /** The parent's saved reading choice; null = none yet. */
    autoRead: boolean | null;
    /** Automatic reading in effect for a stage when the parent made no choice (shown until they tap On or Off). */
    autoReadDefault: (stage: StageId) => boolean;
    /** Takes the pending choices; the caller applies them through core. */
    onConfirm: (result: { stage: StageId; autoRead: boolean | null }) => void;
    onCancel: () => void;
    parent?: HTMLElement;
}

/**
 * Parent's settings (US-03): stage and automatic reading, applied together by "Zatwierdź" and dropped by
 * "Anuluj" / Escape. The reading choice stays null until the parent taps On or Off. One overlay scroll,
 * the two actions stick to the bottom of it (plan review F2). Returns the function that closes the panel.
 * DESIGN-GAP (docs/design-gaps.md, phase 9): the kit has no settings view; built from the S-06 dialog parts.
 */
export const openSettingsPanel = ({ stage, autoRead, autoReadDefault, onConfirm, onCancel, parent = document.body }: SettingsPanelOptions): (() => void) => {
    let chosenStage = stage;
    let chosenReading = autoRead;

    const stageChoices = createStageChoices('settings-panel', (id) => {
        chosenStage = id;
        refresh();
    });
    const on = createButton(pl.settings.autoReadOn, () => {
        chosenReading = true;
        refresh();
    });
    const off = createButton(pl.settings.autoReadOff, () => {
        chosenReading = false;
        refresh();
    });
    const readingRow = document.createElement('div');
    readingRow.className = 'parent-choices';
    readingRow.setAttribute('role', 'group');
    readingRow.append(on, off);
    const readingTitle = createText('p', pl.settings.autoReadHeading);
    readingTitle.id = 'settings-panel-reading';
    readingRow.setAttribute('aria-labelledby', readingTitle.id);

    const refresh = (): void => {
        stageChoices.show(chosenStage);
        const reading = chosenReading ?? autoReadDefault(chosenStage);
        on.setAttribute('aria-pressed', String(reading));
        off.setAttribute('aria-pressed', String(!reading));
    };

    const confirm = createButton(pl.parent.confirm, () => {
        handle.close();
        onConfirm({ stage: chosenStage, autoRead: chosenReading });
    });
    confirm.classList.add('parent-primary');
    const cancel = (): void => {
        handle.close();
        onCancel();
    };
    const actions = document.createElement('div');
    actions.className = 'parent-actions parent-actions-sticky';
    actions.append(confirm, createButton(pl.parent.cancel, cancel));

    const handle = openDialog(parent, createText('h1', pl.settings.title), [...stageChoices.elements, readingTitle, readingRow, actions], cancel);
    refresh();
    return handle.close;
};
