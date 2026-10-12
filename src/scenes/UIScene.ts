import { Scene } from 'phaser';
import { GAME_EVENTS, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import type { Narrator } from '../ui/narrator';
import { RoomSwitchButton } from '../ui/widgets/RoomSwitchButton';
import { SpeakerButton } from '../ui/widgets/SpeakerButton';
import { StarCounter } from '../ui/widgets/StarCounter';

/**
 * Overlay above the task scene: the star counter and the speaker. It reads the registry keys
 * the task scene keeps up to date (stars, narration) and decides no text itself.
 * Input is on only for the speaker: no full-screen or background zone here, otherwise Phaser
 * would stop a tap from reaching the task scene below.
 * "Do pokoju" shows between tasks only (registry roomSwitch, set by the task scene from roundView.switchVisible).
 * DESIGN-GAP: the kit asks an adult to read the task when there is no Polish voice; the speaker is hidden instead.
 */
export class UIScene extends Scene {
    private counter!: StarCounter;
    private speaker!: SpeakerButton;
    private roomSwitch!: RoomSwitchButton;
    private narrator: Narrator | undefined;

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

        this.events.once('shutdown', () => {
            this.registry.events.off(`changedata-${REGISTRY_KEYS.roomSwitch}`, refreshSwitch);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.narration}`, refreshSpeaker);
            unsubscribe?.();
        });
        this.input.enabled = true;
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
