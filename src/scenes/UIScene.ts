import type { RoomArtLoader } from '../ui/roomArtLoader';
import { Scene, type Time } from 'phaser';
import { openInputSession, type InputSession, type InputSuspender } from '../core/inputSuspend';
import { IDLE, longPress, type LongPressEvent, type LongPressState } from '../core/longPress';
import { effectiveAutoRead } from '../core/narration/voice';
import { changeStageByParent, initialSettings, previousStage, type SessionLearner } from '../core/placement';
import { progressView } from '../core/progress';
import { createRng } from '../core/rng';
import type { Settings } from '../core/types';
import { balance } from '../data/balance';
import { pl, roomText } from '../data/pl';
import { getStage } from '../data/curriculum';
import { GAME_EVENTS, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { openParentGate } from '../ui/dom/parentGate';
import type { Autosaver } from '../core/autosave';
import type { FallbackRecord } from '../core/artPick';
import { artHealthLines, pictureCutCount, type ArtHealth, type ArtTable } from '../core/artHealth';
import type { RoomProblem } from '../core/rooms';
import { newestBackup, saveHealthView } from '../core/saveHealth';
import { offlineView, type SwStatus } from '../core/swStatus';
import { encodeSave, freshSession, saveProblem, type SalonCarried, type SessionSave } from '../core/save';
import { deviceSaveView, exportFileText, saveSummary, type SaveSummary } from '../core/saveFile';
import { FIRST_HOUSE } from '../data/houses';
import { ROOMS } from '../data/rooms';
import { ROOM_ART } from '../data/roomArt';
import { GUIDE_IDS } from '../core/guide';
import { UI_ART_KEYS } from '../data/uiArt';
import { openSaveImportDialog, type BrokenDevice } from '../ui/dom/saveImportDialog';
import { openSaveResetDialog } from '../ui/dom/saveResetDialog';
import { openSaveExportDialog } from '../ui/dom/saveExportDialog';
import type { SoundPrefs } from '../core/sound';
import { createSoundPrefStore, deviceStorage } from '../storage/soundPrefs';
import { openSettingsPanel } from '../ui/dom/settingsPanel';
import { E2E_FORCED_FAILURE } from '../testing/e2eHook';
import type { Narrator } from '../ui/narrator';
import { applySoundPrefs } from '../core/soundPrefsApply';
import { playCues, soundOf } from '../ui/sound';
import { SettingsHint } from '../ui/widgets/SettingsHint';
import { SettingsIcon } from '../ui/widgets/SettingsIcon';
import { RoomSwitchButton } from '../ui/widgets/RoomSwitchButton';
import { SpeakerButton } from '../ui/widgets/SpeakerButton';
import { StarCounter } from '../ui/widgets/StarCounter';
import { HudTitle } from '../ui/widgets/HudTitle';
import type { HudTitleView } from '../core/variants';

/** Labels of the salon pieces whose picture is missing (the stand-in box shows the same text); pieces with no label are left out. */
const missingRoomLabels = (health: ArtHealth | undefined): string[] =>
    ROOM_ART.filter((entry) => entry.label !== '' && health?.missing.includes(entry.key)).map((entry) => entry.label);

/**
 * Overlay above the task and room scenes: the star counter, the speaker and the "Do pokoju" switch.
 * It reads the registry keys the scenes keep up to date (stars: the task scene adds, the room subtracts; narration, roomSwitch) and decides no text itself.
 * The parent's gear (bottom right, outside the notebook) opens the adult gate after a long press (core/longPress,
 * driven here with the loop clock) and then the settings panel; the scene only routes pointer events and applies
 * what core returns.
 * Input is on only for the speaker, the switch and the gear: no full-screen or background zone here, otherwise Phaser
 * would stop a tap from reaching the task scene below.
 * "Do pokoju" shows between tasks only (registry roomSwitch, set by the task scene from roundView.switchVisible).
 * DESIGN-GAP (docs/design-gaps.md row 14): the kit draws the summary and the room without the HUD; the counter stays above them.
 * DESIGN-GAP (docs/design-gaps.md row 13): the kit asks an adult to read the task when there is no Polish voice; the speaker is hidden instead.
 */
export class UIScene extends Scene {
    private counter!: StarCounter;
    private speaker!: SpeakerButton;
    private roomSwitch!: RoomSwitchButton;
    private narrator: Narrator | undefined;
    private settingsIcon!: SettingsIcon;
    private settingsHint!: SettingsHint;
    private hintTimer: Time.TimerEvent | undefined;
    private title!: HudTitle;
    private hold: LongPressState = IDLE;
    private closeDialog: (() => void) | undefined;
    private session: InputSession | undefined;   // this scene's hold on the game's input switch while a parent dialog is open

    constructor() {
        super(SCENE_KEYS.ui);
    }

    create(): void {
        const stars = (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
        this.counter = new StarCounter(this, stars);
        const onStars = (_parent: unknown, value: number): void => this.counter.setValue(value);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        // The number is already right (onStars); the pop only waits for the flying star to land.
        const onStarLanded = (): void => this.counter.pop();
        this.game.events.on(GAME_EVENTS.starLanded, onStarLanded);

        this.narrator = this.registry.get(REGISTRY_KEYS.narrator) as Narrator | undefined;
        this.speaker = new SpeakerButton(this, () => {
            const text = this.registry.get(REGISTRY_KEYS.narration) as string | null | undefined;
            if (text) {
                this.narrator?.speak(text);
            }
        });
        const refreshSpeaker = (): void => {
            const text = this.registry.get(REGISTRY_KEYS.narration) as string | null | undefined;
            this.speaker.setVisible((this.narrator?.available ?? false) && Boolean(text));
        };
        this.registry.events.on(`changedata-${REGISTRY_KEYS.narration}`, refreshSpeaker);
        const unsubscribe = this.narrator?.onAvailability(refreshSpeaker);
        refreshSpeaker();

        this.roomSwitch = new RoomSwitchButton(this, () => { playCues(this, soundOf(this.registry), [{ id: 'tap', delayMs: 0 }]); this.game.events.emit(GAME_EVENTS.toRoom); });
        const refreshSwitch = (): void => this.roomSwitch.setVisible(this.registry.get(REGISTRY_KEYS.roomSwitch) === true);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.roomSwitch}`, refreshSwitch);
        refreshSwitch();

        // The music loads through this scene's loader (it lives for the whole session) and only when the parent turned it on.
        soundOf(this.registry)?.attachLoader(this.load);
        (this.registry.get(REGISTRY_KEYS.roomArtLoader) as RoomArtLoader | undefined)?.attachLoader(this.load);   // rooms the boot skipped load here, on the same session-long loader

        this.title = new HudTitle(this);
        const refreshTitle = (): void => this.title.set((this.registry.get(REGISTRY_KEYS.hudTitle) as HudTitleView | null | undefined) ?? null);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.hudTitle}`, refreshTitle);
        refreshTitle();

        // A restarted scene keeps its fields: start from a clean slate.
        this.hold = IDLE;
        this.closeDialog = undefined;
        this.session = undefined;
        this.settingsIcon = new SettingsIcon(this, {
            down: (p) => this.feed({ type: 'down', id: p.id, x: p.x, y: p.y, now: this.time.now }),
            up: (p) => this.feed(p.wasCanceled ? { type: 'cancel' } : { type: 'up', id: p.id }),
            out: () => this.feed({ type: 'cancel' }),
        });
        this.settingsHint = new SettingsHint(this);
        this.hintTimer = undefined;
        this.input.on('pointermove', (p: { id: number; x: number; y: number }) => this.feed({ type: 'move', id: p.id, x: p.x, y: p.y }));

        this.events.once('shutdown', () => {
            this.hold = IDLE;
            this.hideHint();
            this.closeDialog?.();
            this.closeSettings();
            this.registry.events.off(`changedata-${REGISTRY_KEYS.roomSwitch}`, refreshSwitch);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.hudTitle}`, refreshTitle);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars);
            this.game.events.off(GAME_EVENTS.starLanded, onStarLanded);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.narration}`, refreshSpeaker);
            unsubscribe?.();
        });
        this.input.enabled = true;
    }

    update(): void {
        if (this.hold.kind === 'holding') {
            this.feed({ type: 'tick', now: this.time.now });   // the same clock as 'down'
        }
    }

    private feed(event: LongPressEvent): void {
        const next = longPress(this.hold, event, balance.parentSettings);
        this.hold = next.state;
        if (next.fire) {
            this.openSettings();
        } else if (next.tap) {
            this.showHintOnce();
        }
    }

    /** The first short tap of a page load shows the hint for `hintMs`; later taps do nothing. */
    private showHintOnce(): void {
        if (this.registry.get(REGISTRY_KEYS.settingsHintShown) === true) {
            return;
        }
        this.registry.set(REGISTRY_KEYS.settingsHintShown, true);
        this.settingsHint.show();
        this.hintTimer = this.time.delayedCall(balance.parentSettings.hintMs, () => this.hideHint());
    }

    private hideHint(): void {
        this.hintTimer?.remove(false);
        this.hintTimer = undefined;
        this.settingsHint.hide();
    }

    /** Gate for an adult, then the settings panel; the game input stays off under both and the narrator is silenced. */
    private openSettings(): void {
        this.hideHint();
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined;
        const suspender = this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
        if (!learner || !suspender || this.session?.active()) {
            return;
        }
        const narrator = this.narrator;
        const sound = soundOf(this.registry);
        const saver = this.registry.get(REGISTRY_KEYS.saver) as Autosaver | undefined;
        narrator?.cancel();
        const session = openInputSession(suspender);   // every dialog callback below runs in it: a throw ends the hold and goes on to the error boundary
        this.session = session;
        this.hold = IDLE;   // the lifted finger is lost over the dialog: nothing may stay "held"
        this.closeDialog = openParentGate({
            rng: createRng(Math.floor(Math.random() * 2 ** 32)),
            onCancel: () => session.run(() => this.closeSettings()),
            // The old-version copies are read once, here at panel open (never at game start, never again); a failed read is no copy.
            onPass: () =>
                session.run(() => void (saver ? saver.readBackups() : Promise.resolve([])).then((copies) => {
                if (!session.active()) return;
                session.run(() => {
                const settings = (this.registry.get(REGISTRY_KEYS.settings) as Settings | undefined) ?? initialSettings();
                const readStages = balance.narrator.autoReadStages;
                const swStatus = this.registry.get(REGISTRY_KEYS.swStatus) as SwStatus | undefined;
                const newest = newestBackup(copies);
                const stage = getStage(learner.stage);
                if (!stage) {
                    this.closeSettings();
                    return;
                }
                // DESIGN-GAP 122: the kit's progress preview lists the current stage only; previous-stage skills are drawn too, so they are listed.
                const before = previousStage(stage.id);
                const previousDef = before ? getStage(before) : undefined;
                this.closeDialog = openSettingsPanel({
                    stage: learner.stage,
                    autoRead: settings.autoRead,
                    progress: progressView(stage, learner, { mastery: balance.mastery, view: balance.parentSettings }, previousDef),
                    saveHealth: saver ? saveHealthView(saver.status(), copies.map((c) => c.from), (this.registry.get(REGISTRY_KEYS.roomProblems) as RoomProblem[] | undefined) ?? [], (this.registry.get(REGISTRY_KEYS.salonCarried) as SalonCarried | null | undefined) ?? null) : undefined,
                    ...(swStatus ? { offline: offlineView(swStatus) } : {}),
                    artLines: artHealthLines({
                        task: this.registry.get(REGISTRY_KEYS.artHealth) as ArtHealth | undefined,
                        room: this.registry.get(REGISTRY_KEYS.roomArtHealth) as ArtHealth | undefined,
                        ui: this.registry.get(REGISTRY_KEYS.uiArtHealth) as ArtHealth | undefined,
                        cut: pictureCutCount((this.registry.get(REGISTRY_KEYS.bootLoad) as { cutByTable?: Partial<Record<ArtTable | 'font', readonly string[]>> } | undefined)?.cutByTable),
                        build: __BUILD_ID__,
                        font: this.registry.get(REGISTRY_KEYS.fontHealth) as 'loaded' | 'fallback' | undefined,
                        labels: missingRoomLabels(this.registry.get(REGISTRY_KEYS.roomArtHealth) as ArtHealth | undefined),
                        labelCap: balance.artHealth.labelCap,
                        fallbacks: this.registry.get(REGISTRY_KEYS.artFallbacks) as FallbackRecord | undefined,
                        noStandIn: GUIDE_IDS.map((id) => UI_ART_KEYS[id]),
                    }),
                    ...(sound ? { sound: { prefs: sound.prefs(), missing: sound.status().missing.length, music: sound.status().music, lockedCount: sound.status().lockedCount, device: sound.status().device, musicError: sound.status().musicError, prefsKept: this.registry.get(REGISTRY_KEYS.soundPrefsKept) as boolean | undefined } } : {}),
                    watchVoice: narrator ? (callback) => narrator.onAvailability(callback) : undefined,
                    autoReadDefault: (stage) => effectiveAutoRead({ autoRead: null }, stage, readStages),
                    onCancel: () => session.run(() => this.closeSettings()),
                    ...(saver ? { onExport: () => session.run(() => this.openExport(saver, session)) } : {}),
                    ...(saver ? { onImport: () => session.run(() => this.openImport(saver, session)) } : {}),
                    ...(newest ? { onBackupExport: () => session.run(() => this.openBackupExport(newest, session)) } : {}),
                    ...(saver ? { onReset: () => session.run(() => this.openReset(saver, session)) } : {}),
                    onConfirm: (result) => session.run(() => this.applySettings(result.stage, result.autoRead, result.sound)),
                });
                });
                })),
        });
    }

    /** Raw export of an old-version copy (SV2-04): same dialog and confirmation tap as the save export, `kind: 'raw'` so it imports again through `parseImport`. */
    private openBackupExport(copy: { from: number; raw: unknown }, session: InputSession): void {
        this.closeDialog = openSaveExportDialog({
            file: (now) => ({
                text: exportFileText({ kind: 'raw', build: __BUILD_ID__, exportedAt: now.toISOString(), reason: `backup-v${copy.from}`, raw: copy.raw }),
                fileName: pl.saveFailed.fileName(now.toISOString().slice(0, 10)),
            }),
            onClose: () => session.run(() => this.closeSettings()),
        });
    }

    /** Export step: replaces the panel in the same input session; the file is built at the tap, from the saver's current state. */
    private openExport(saver: Autosaver, session: InputSession): void {
        // A copy of a session the game never loaded is not the child's progress (SIR-04): say so above "Zapisz plik".
        const device = deviceSaveView(saver.status(), saver.current(), ROOMS);
        this.closeDialog = openSaveExportDialog({
            ...(device.kind === 'summary' ? {} : { warning: pl.saveTransfer.exportNotDevice }),
            file: (now) => {
                // S12-04: never write a copy of a state that does not validate.
                const problem = saveProblem(saver.current());
                if (problem !== null) {
                    console.error('export refused: the state does not validate', { problem });
                    return null;
                }
                return {
                    text: exportFileText({ kind: 'save', build: __BUILD_ID__, exportedAt: now.toISOString(), save: saver.current() }),
                    fileName: pl.saveTransfer.fileName(now.toISOString().slice(0, 10)),
                };
            },
            onClose: () => session.run(() => this.closeSettings()),
        });
    }

    /** Import step: replaces the panel in the same input session; the device save is judged by `deviceSaveView`, `apply` is the saver's replace. */
    private openImport(saver: Autosaver, session: InputSession): void {
        const device = deviceSaveView(saver.status(), saver.current(), ROOMS);
        // SVB-04: a state that does not decode is named in the dialog, never a silent close of the panel.
        const view = device.kind === 'broken' ? this.brokenView(saver) : device;
        this.closeDialog = openSaveImportDialog({
            device: view,
            summarize: (s: SessionSave): SaveSummary => saveSummary(s, ROOMS),
            roomName: (id) => roomText.name(id) ?? id,
            maxBytes: balance.save.importMaxBytes,
            apply: (state, force) => saver.replace(state, { force }),
            onClose: () => session.run(() => this.closeSettings()),
        });
    }

    private brokenView(saver: Autosaver): BrokenDevice {
        console.error('import/reset: the current state does not decode', { problem: saveProblem(saver.current()) });
        return { kind: 'blocked', cause: 'broken', forceable: false };
    }

    /** Reset step: replaces the panel in the same input session; the empty save is built at the tap and written by the saver's replace. */
    private openReset(saver: Autosaver, session: InputSession): void {
        const device = deviceSaveView(saver.status(), saver.current(), ROOMS);
        // SVB-04: a state that does not decode is named in the dialog, never a silent close of the panel.
        const view = device.kind === 'broken' ? this.brokenView(saver) : device;
        this.closeDialog = openSaveResetDialog({
            device: view,
            roomName: (id) => roomText.name(id) ?? id,
            fresh: () => encodeSave(freshSession(FIRST_HOUSE)),
            apply: (state, force) => saver.replace(state, { force }),
            onClose: () => session.run(() => this.closeSettings()),
        });
    }

    /** The learner and the settings come from core; the task scene reacts to the event only when the stage changed. */
    private applySettings(stage: SessionLearner['stage'], autoRead: boolean | null, soundPrefs: SoundPrefs | null): void {
        if (__E2E_HOOK__ && this.registry.get(REGISTRY_KEYS.forcedFailure) === 'settings') {
            throw new Error(E2E_FORCED_FAILURE);   // e2e build only
        }
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const changed = changeStageByParent(learner, stage);
        this.registry.set(REGISTRY_KEYS.settings, { autoRead });
        if (soundPrefs) {
            // A failed write is only a warning: the choice holds for this session.
            applySoundPrefs(soundPrefs, {
                service: soundOf(this.registry),
                store: createSoundPrefStore(deviceStorage()),
                setPrefs: (prefs) => this.registry.set(REGISTRY_KEYS.soundPrefs, prefs),
                setKept: (kept) => this.registry.set(REGISTRY_KEYS.soundPrefsKept, kept),
            });
        }
        this.closeSettings();
        if (changed !== learner) {
            this.registry.set(REGISTRY_KEYS.learner, changed);
            this.game.events.emit(GAME_EVENTS.parentStage);
        }
    }

    private closeSettings(): void {
        this.closeDialog = undefined;
        this.session?.end();
        this.session = undefined;
    }

    /** Centre of the settings gear, for the e2e hook. */
    settingsTarget(): { x: number; y: number } {
        return this.settingsIcon.target();
    }

    /** Whether the settings hint is on screen now, for the e2e hook. */
    settingsHintVisible(): boolean {
        return this.settingsHint.visible();
    }

    /** The variant title on screen (text and badge), for the e2e hook; null for an ordinary round. */
    titleText(): string | null {
        return this.title.text();
    }

    /** Shown counter text, for the e2e hook (what is drawn, not the registry value). */
    counterText(): string {
        return this.counter.value();
    }

    /** Centre of "Do pokoju" in the HUD, or null while it is hidden, for the e2e hook. */
    roomSwitchTarget(): { x: number; y: number } | null {
        return this.roomSwitch.target();
    }

    /** Centre of the speaker, or null while it is hidden, for the e2e hook. */
    speakerTarget(): { x: number; y: number } | null {
        return this.speaker.target();
    }
}
