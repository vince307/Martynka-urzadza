import type { SaveHealthView } from '../../core/saveHealth';
import type { ProgressView } from '../../core/progress';
import type { StageId } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog } from './dialog';
import { createButton, createText } from './overlay';
import { createProgressView } from './progressView';
import { createSaveHealthView } from './saveHealthView';
import { createStageChoices } from './stageChoices';

export interface SettingsPanelOptions {
    /** The learner's current stage (marked as chosen when the panel opens). */
    stage: StageId;
    /** The parent's saved reading choice; null = none yet. */
    autoRead: boolean | null;
    /** Automatic reading in effect for a stage when the parent made no choice (shown until they tap On or Off). */
    autoReadDefault: (stage: StageId) => boolean;
    /** Preview of the learner's progress in the current stage (the learner's, not the stage picked in the panel). */
    progress: ProgressView;
    /** Snapshot of the autosaver's health taken when the panel opens; absent = no saver, no section. */
    saveHealth?: SaveHealthView;
    /** Takes the pending choices; the caller applies them through core. */
    onConfirm: (result: { stage: StageId; autoRead: boolean | null }) => void;
    onCancel: () => void;
    /** "Zapisz kopię": the panel closes and the caller opens the export dialog. Absent = no button (no saver). */
    onExport?: () => void;
    onImport?: () => void;
    /** Subscribes to "a Polish voice is available" (called at once and on changes); returns the unsubscribe. Absent = no narrator: the line stays visible. */
    watchVoice?: (callback: (available: boolean) => void) => () => void;
    parent?: HTMLElement;
}

/**
 * Parent's settings (US-03): stage, automatic reading, the save health line and the progress preview, applied together by "Zatwierdź" and dropped by
 * "Anuluj" / Escape. The reading choice stays null until the parent taps On or Off. One overlay scroll,
 * the two actions stick to the bottom of it (plan review F2). Returns the function that closes the panel.
 * DESIGN-GAP (docs/design-gaps.md row 26): the kit has no settings view; built from the S-06 dialog parts.
 * DESIGN-GAP (row 30): the kit has no line for a device without a Polish voice; a muted paragraph under the reading buttons while
 * the voice is missing. The toggle stays active (the parent's choice is kept for later).
 */
export const openSettingsPanel = ({ stage, autoRead, autoReadDefault, progress, saveHealth, onConfirm, onCancel, onExport, onImport, watchVoice, parent = document.body }: SettingsPanelOptions): (() => void) => {
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

    const noVoice = createText('p', pl.settings.noVoice, 'overlay-muted');
    noVoice.hidden = watchVoice !== undefined;
    let unwatch: (() => void) | undefined;

    const refresh = (): void => {
        stageChoices.show(chosenStage);
        const reading = chosenReading ?? autoReadDefault(chosenStage);
        on.setAttribute('aria-pressed', String(reading));
        off.setAttribute('aria-pressed', String(!reading));
    };

    const close = (): void => {
        unwatch?.();
        unwatch = undefined;
        handle.close();
    };
    const confirm = createButton(pl.parent.confirm, () => {
        close();
        onConfirm({ stage: chosenStage, autoRead: chosenReading });
    });
    confirm.classList.add('parent-primary');
    const cancel = (): void => {
        close();
        onCancel();
    };
    const actions = document.createElement('div');
    actions.className = 'parent-actions parent-actions-sticky';
    actions.append(confirm, createButton(pl.parent.cancel, cancel));

    // DESIGN-GAP 46 (docs/design-gaps.md): the kit has no place for save actions; a quiet button row under "Zapis gry".
    const saveActions = document.createElement('div');
    saveActions.className = 'parent-choices';
    if (onExport) {
        saveActions.append(createButton(pl.saveTransfer.exportButton, () => {
            close();
            onExport();
        }));
    }

    if (onImport) {
        saveActions.append(createButton(pl.saveTransfer.importButton, () => {
            close();
            onImport();
        }));
    }

    const handle = openDialog(parent, createText('h1', pl.settings.title), [...stageChoices.elements, readingTitle, readingRow, noVoice, ...(saveHealth ? [createSaveHealthView(saveHealth)] : []), ...(onExport || onImport ? [saveActions] : []), createProgressView(progress), actions], cancel);
    refresh();
    unwatch = watchVoice?.((available) => {
        noVoice.hidden = available;
    });
    return close;
};
