import { Scene } from 'phaser';
import type { InputSuspender } from '../core/inputSuspend';
import { IDLE, longPress, type LongPressEvent, type LongPressState } from '../core/longPress';
import { effectiveAutoRead } from '../core/narration/voice';
import { changeStageByParent, initialSettings, type SessionLearner } from '../core/placement';
import { createRng } from '../core/rng';
import type { Settings } from '../core/types';
import { balance } from '../data/balance';
import { GAME_EVENTS, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { openParentGate } from '../ui/dom/parentGate';
import { openSettingsPanel } from '../ui/dom/settingsPanel';
import type { Narrator } from '../ui/narrator';
import { SettingsIcon } from '../ui/widgets/SettingsIcon';
import { RoomSwitchButton } from '../ui/widgets/RoomSwitchButton';
import { SpeakerButton } from '../ui/widgets/SpeakerButton';
import { StarCounter } from '../ui/widgets/StarCounter';

/**
 * Overlay above the task and room scenes: the star counter, the speaker and the "Do pokoju" switch.
 * It reads the registry keys the task scene keeps up to date (stars, narration, roomSwitch) and decides no text itself.
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
    private hold: LongPressState = IDLE;
    private closeDialog: (() => void) | undefined;
    private releaseInput: (() => void) | undefined;   // this scene's hold on the game's input switch while a parent dialog is open

    constructor() {
        super(SCENE_KEYS.ui);
    }

    create(): void {
        const stars = (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
        this.counter = new StarCounter(this, stars);
        const onStars = (_parent: unknown, value: number): void => this.counter.setValue(value);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.stars}`, onStars);

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

        this.roomSwitch = new RoomSwitchButton(this, () => this.game.events.emit(GAME_EVENTS.toRoom));
        const refreshSwitch = (): void => this.roomSwitch.setVisible(this.registry.get(REGISTRY_KEYS.roomSwitch) === true);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.roomSwitch}`, refreshSwitch);
        refreshSwitch();

        // A restarted scene keeps its fields: start from a clean slate.
        this.hold = IDLE;
        this.closeDialog = undefined;
        this.releaseInput = undefined;
        this.settingsIcon = new SettingsIcon(this, {
            down: (p) => this.feed({ type: 'down', id: p.id, x: p.x, y: p.y, now: this.time.now }),
            up: (p) => this.feed(p.wasCanceled ? { type: 'cancel' } : { type: 'up', id: p.id }),
            out: () => this.feed({ type: 'cancel' }),
        });
        this.input.on('pointermove', (p: { id: number; x: number; y: number }) => this.feed({ type: 'move', id: p.id, x: p.x, y: p.y }));

        this.events.once('shutdown', () => {
            this.hold = IDLE;
            this.closeDialog?.();
            this.closeSettings();
            this.registry.events.off(`changedata-${REGISTRY_KEYS.roomSwitch}`, refreshSwitch);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars);
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
        }
    }

    /** Gate for an adult, then the settings panel; the game input stays off under both and the narrator is silenced. */
    private openSettings(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined;
        const suspender = this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
        if (!learner || !suspender || this.releaseInput) {
            return;
        }
        this.narrator?.cancel();
        this.releaseInput = suspender.suspend();
        this.hold = IDLE;   // the lifted finger is lost over the dialog: nothing may stay "held"
        this.closeDialog = openParentGate({
            rng: createRng(Math.floor(Math.random() * 2 ** 32)),
            onCancel: () => this.closeSettings(),
            onPass: () => {
                const settings = (this.registry.get(REGISTRY_KEYS.settings) as Settings | undefined) ?? initialSettings();
                const readStages = balance.narrator.autoReadStages;
                this.closeDialog = openSettingsPanel({
                    stage: learner.stage,
                    autoRead: settings.autoRead,
                    autoReadDefault: (stage) => effectiveAutoRead({ autoRead: null }, stage, readStages),
                    onCancel: () => this.closeSettings(),
                    onConfirm: (result) => this.applySettings(result.stage, result.autoRead),
                });
            },
        });
    }

    /** The learner and the settings come from core; the task scene reacts to the event only when the stage changed. */
    private applySettings(stage: SessionLearner['stage'], autoRead: boolean | null): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const changed = changeStageByParent(learner, stage);
        this.registry.set(REGISTRY_KEYS.settings, { autoRead });
        this.closeSettings();
        if (changed !== learner) {
            this.registry.set(REGISTRY_KEYS.learner, changed);
            this.game.events.emit(GAME_EVENTS.parentStage);
        }
    }

    private closeSettings(): void {
        this.closeDialog = undefined;
        this.releaseInput?.();
        this.releaseInput = undefined;
    }

    /** Centre of the settings gear, for the e2e hook. */
    settingsTarget(): { x: number; y: number } {
        return this.settingsIcon.target();
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
