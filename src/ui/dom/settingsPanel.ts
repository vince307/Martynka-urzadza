import type { ArtHealthView } from '../../core/artHealth';
import type { OfflineView } from '../../core/swStatus';
import type { SaveHealthView } from '../../core/saveHealth';
import type { ProgressView } from '../../core/progress';
import { musicLine, type MusicState, type SoundPrefs } from '../../core/sound';
import type { StageId } from '../../core/types';
import { pl } from '../../data/pl';
import { openDialog } from './dialog';
import { createButton, createText } from './overlay';
import { createProgressView } from './progressView';
import { createArtHealthView } from './artHealthView';
import { createOfflineView } from './offlineView';
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
    /** Service worker record taken when the panel opens; absent = no section. */
    offline?: OfflineView;
    artHealth?: ArtHealthView;
    roomArtHealth?: ArtHealthView;
    uiArtHealth?: ArtHealthView;
    /** Sound preferences as they stand and how many effects did not load; absent = no sound service, no section. */
    sound?: { prefs: SoundPrefs; missing: number; music: MusicState; prefsKept?: boolean };
    /** Takes the pending choices; the caller applies them through core. */
    onConfirm: (result: { stage: StageId; autoRead: boolean | null; sound: SoundPrefs | null }) => void;
    onCancel: () => void;
    /** "Zapisz kopię": the panel closes and the caller opens the export dialog. Absent = no button (no saver). */
    onExport?: () => void;
    onImport?: () => void;
    onReset?: () => void;
    /** Subscribes to "a Polish voice is available" (called at once and on changes); returns the unsubscribe. Absent = no narrator: the line stays visible. */
    watchVoice?: (callback: (available: boolean) => void) => () => void;
    parent?: HTMLElement;
}

/**
 * Parent's settings (US-03): stage, automatic reading, the save health line and the progress preview, applied together by "Zatwierdź" and dropped by
 * "Anuluj" / Escape. The reading choice stays null until the parent taps On or Off. One overlay scroll,
 * the two actions stick to the bottom of it (plan review F2). Returns the function that closes the panel.
 * DESIGN-GAP (docs/design-gaps.md row 26): the kit has no settings view; built from the S-06 dialog parts.
 * DESIGN-GAP (row 114): the kit has no sound settings; a "Dźwięki" section after the reading choice with two On/Off groups in the same
 * pattern and a muted line when effects failed to load, applied by "Zatwierdź".
 * DESIGN-GAP (row 30): the kit has no line for a device without a Polish voice; a muted paragraph under the reading buttons while
 * the voice is missing. The toggle stays active (the parent's choice is kept for later).
 */
export const openSettingsPanel = ({ stage, autoRead, autoReadDefault, progress, saveHealth, offline, artHealth, roomArtHealth, uiArtHealth, sound, onConfirm, onCancel, onExport, onImport, onReset, watchVoice, parent = document.body }: SettingsPanelOptions): (() => void) => {
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

    // Sounds: two On/Off groups built like the reading group; null result = no section, nothing to apply.
    const chosenSound: SoundPrefs | null = sound ? { ...sound.prefs } : null;
    const soundGroup = (heading: string, id: string, key: keyof SoundPrefs): { title: HTMLElement; row: HTMLElement; refresh: () => void } => {
        const onButton = createButton(pl.settings.autoReadOn, () => {
            if (chosenSound) chosenSound[key] = true;
            refresh();
        });
        const offButton = createButton(pl.settings.autoReadOff, () => {
            if (chosenSound) chosenSound[key] = false;
            refresh();
        });
        const row = document.createElement('div');
        row.className = 'parent-choices';
        row.setAttribute('role', 'group');
        row.append(onButton, offButton);
        const title = createText('p', heading);
        title.id = id;
        row.setAttribute('aria-labelledby', id);
        return {
            title,
            row,
            refresh: () => {
                const value = chosenSound?.[key] ?? false;
                onButton.setAttribute('aria-pressed', String(value));
                offButton.setAttribute('aria-pressed', String(!value));
            },
        };
    };
    const effects = soundGroup(pl.settings.effectsHeading, 'settings-panel-effects', 'effects');
    const music = soundGroup(pl.settings.musicHeading, 'settings-panel-music', 'music');
    const soundHeading = createText('h2', pl.settings.soundHeading);
    const soundMissing = createText('p', sound ? pl.settings.soundMissing(sound.missing) : '', 'overlay-muted');
    soundMissing.hidden = !sound || sound.missing <= 0;
    // DESIGN-GAP 120: one muted line under the music group while music is on and not playing.
    const line = sound ? musicLine(sound.prefs, sound.music) : null;
    const musicStatus = createText('p', line ? pl.settings.musicStatus[line] : '', 'overlay-muted');
    musicStatus.hidden = line === null;
    musicStatus.className += ' parent-music-status';

    // DESIGN-GAP 121: one muted line while the device refused to keep the sound choice; it holds for this session only.
    const prefsNotKept = createText('p', pl.settings.soundPrefsNotKept, 'overlay-muted');
    prefsNotKept.hidden = !sound || sound.prefsKept !== false;

    const noVoice = createText('p', pl.settings.noVoice, 'overlay-muted');
    noVoice.hidden = watchVoice !== undefined;
    let unwatch: (() => void) | undefined;

    const refresh = (): void => {
        stageChoices.show(chosenStage);
        const reading = chosenReading ?? autoReadDefault(chosenStage);
        on.setAttribute('aria-pressed', String(reading));
        off.setAttribute('aria-pressed', String(!reading));
        effects.refresh();
        music.refresh();
    };

    const close = (): void => {
        unwatch?.();
        unwatch = undefined;
        handle.close();
    };
    const confirm = createButton(pl.parent.confirm, () => {
        close();
        onConfirm({ stage: chosenStage, autoRead: chosenReading, sound: chosenSound });
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

    if (onReset) {
        saveActions.append(createButton(pl.saveTransfer.resetButton, () => {
            close();
            onReset();
        }));
    }

    const handle = openDialog(parent, createText('h1', pl.settings.title), [...stageChoices.elements, readingTitle, readingRow, noVoice, ...(sound ? [soundHeading, effects.title, effects.row, music.title, music.row, musicStatus, soundMissing, prefsNotKept] : []), ...(saveHealth ? [createSaveHealthView(saveHealth)] : []), ...(offline ? [createOfflineView(offline)] : []), ...(artHealth && artHealth.kind !== 'unknown' ? [createArtHealthView(artHealth, roomArtHealth, uiArtHealth)] : []), ...(onExport || onImport || onReset ? [saveActions] : []), createProgressView(progress), actions], cancel);
    refresh();
    unwatch = watchVoice?.((available) => {
        noVoice.hidden = available;
    });
    return close;
};
