import { Renderer, Scene } from 'phaser';
import { startLearning } from '../core/curriculum';
import { buildingStart } from '../core/house';
import { hasPurchase, placeByChild, type PlacedLearner, type SessionLearner } from '../core/placement';
import { createRng } from '../core/rng';
import { stages } from '../data/curriculum';
import { balance } from '../data/balance';
import { GAME_HEIGHT, PLACEHOLDER_FRAME, REGISTRY_KEYS, SCENE_KEYS, WELCOME_LAYOUT } from '../data/layout';
import { pl } from '../data/pl';
import { placementData } from '../data/placement';
import { BUILDING_CHOICES, HOUSES } from '../data/houses';
import { recordFallback } from '../ui/artFallbacks';
import type { Narrator } from '../ui/narrator';
import { ChoiceCard } from '../ui/widgets/ChoiceCard';
import { SpeakerButton } from '../ui/widgets/SpeakerButton';
import { openInputSession, type InputSession, type InputSuspender } from '../core/inputSuspend';
import { openParentGate } from '../ui/dom/parentGate';
import { openStagePanel } from '../ui/dom/stagePanel';
import { AgeButton } from '../ui/widgets/AgeButton';
import { drawNotebook } from '../ui/widgets/notebook';
import { SalonBackdrop, plainBackdropSnapshot, type BackdropCause, type BackdropSnapshot } from '../ui/widgets/SalonBackdrop';
import type { BuildingChoice, RoomState } from '../core/types';
import { PageButton } from '../ui/widgets/PageButton';
import { textStyle } from '../ui/widgets/textStyle';

/** What a restart of the welcome scene may carry: a placement already made, and whether the child made it on the age view. */
interface WelcomeData {
    placed?: PlacedLearner;
    fromAge?: boolean;
}

const isPlaced = (value: unknown): value is PlacedLearner => {
    if (typeof value !== 'object' || value === null) return false;
    const p = value as Record<string, unknown>;
    return typeof p.age === 'number' && typeof p.stage === 'string' && typeof p.stageOverriddenByParent === 'boolean' && typeof p.warmupPending === 'boolean';
};

/**
 * First screen of a cold start: the brand, "Ile masz lat?" and one button per age (the `age` view). The child taps
 * the age (or a parent confirms a stage); core/placement turns age and the session's month into the placement, and the
 * `choice` view asks which building to furnish first (S-28). The card tap sets the building (`buildingStart`), then the
 * learner, and the task scene starts. The scene decides nothing itself. Both views are the same scene started again
 * (`create(data)`), so each begins from a clean slate.
 */
export class WelcomeScene extends Scene {
    private buttons: { age: number; button: AgeButton }[] = [];
    private chosen = false;
    private parentButton: PageButton | undefined;
    private closeDialog: (() => void) | undefined;
    private backdrop: SalonBackdrop | undefined;
    private session: InputSession | undefined;   // this scene's hold on the game's input switch while a parent dialog is open
    private view: 'age' | 'choice' = 'age';
    private placed: PlacedLearner | undefined;
    private fromAge = false;
    private cards: Partial<Record<BuildingChoice['id'], ChoiceCard>> = {};
    private choiceBack: PageButton | undefined;
    private speaker: SpeakerButton | undefined;

    constructor() {
        super(SCENE_KEYS.welcome);
    }

    create(data?: WelcomeData): void {
        // A restarted scene keeps its fields: start from a clean slate.
        this.buttons = [];
        this.chosen = false;
        this.closeDialog = undefined;
        this.session = undefined;
        this.parentButton = undefined;
        this.cards = {};
        this.choiceBack = undefined;
        this.speaker = undefined;
        this.placed = isPlaced(data?.placed) ? data.placed : undefined;
        this.fromAge = this.placed !== undefined && data?.fromAge === true;
        this.view = this.placed ? 'choice' : 'age';
        this.events.once('shutdown', () => {
            this.closeDialog?.();
            this.backdrop?.destroy();
            this.resumeInput();
        });
        this.backdrop = new SalonBackdrop(this);
        this.refreshBackdrop();
        // A lost and restored WebGL context empties every texture; the backdrop is drawn again at once (audit B-1).
        const onRestore = (): void => this.refreshBackdrop('restore');
        this.game.renderer.on(Renderer.Events.RESTORE_WEBGL, onRestore);
        this.events.once('shutdown', () => {
            this.game.renderer.off(Renderer.Events.RESTORE_WEBGL, onRestore);
        });
        drawNotebook(this);
        const flower = WELCOME_LAYOUT.flower;
        // No stand-in on the welcome: a missing texture draws nothing.
        if (this.textures.exists(flower.key)) {
            this.add.image(flower.left + flower.size / 2, flower.top + flower.size / 2, flower.key).setDisplaySize(flower.size, flower.size).setAngle(flower.angle);
        }
        this.add.text(WELCOME_LAYOUT.brand.x, WELCOME_LAYOUT.brand.y, pl.title, textStyle('brand')).setOrigin(0.5, 0);
        if (this.view === 'choice' && this.placed) {
            this.createChoice(this.placed);
        } else {
            this.createAges();
        }
        // Build id in the corner, like the task screen: shows on a tablet that a silent update has landed.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, textStyle('caption'))
            .setOrigin(0, 1);
    }

    private createAges(): void {
        this.add.text(WELCOME_LAYOUT.question.x, WELCOME_LAYOUT.question.y, pl.welcome.question, textStyle('summaryTitle')).setOrigin(0.5, 0);
        const { left, top, width, gap } = WELCOME_LAYOUT.ages;
        placementData.ages.forEach((age, i) => {
            const button = new AgeButton(this, String(age), left + i * (width + gap), top, () => this.choose(age));
            this.buttons.push({ age, button });
        });
        // DESIGN-GAP (docs/design-gaps.md rows 15-17): the kit has no parent entry. The adult gate and the stage panel are DOM dialogs.
        const { left: pl0, top: pt0, ...size } = WELCOME_LAYOUT.parent;
        this.parentButton = new PageButton(this, () => this.openParent());
        this.parentButton.show(pl.parent.entry, pl0, pt0, 'secondary', false, size);
    }

    /** The choice view (S-28): the question, one card per building, the speaker (while a voice exists) and, on the child path, "Wróć". */
    private createChoice(placed: PlacedLearner): void {
        const { title, cards, speaker, back } = WELCOME_LAYOUT.choice;
        this.add.text(title.x, title.y, pl.welcome.choice.question, textStyle('summaryTitle')).setOrigin(0.5, 0);
        BUILDING_CHOICES.forEach((choice, i) => {
            const card = new ChoiceCard(this, pl.welcome.choice[choice.id], choice.art, cards.left + i * (cards.pictureWidth + cards.gap), cards.top, () => this.pick(choice.id, placed));
            this.cards[choice.id] = card;
            if (card.drawn) {
                recordFallback(this, 'choice', 'drawn');
            }
        });
        const narrator = this.registry.get(REGISTRY_KEYS.narrator) as Narrator | undefined;
        this.speaker = new SpeakerButton(this, () => narrator?.speak(pl.welcome.choice.spoken), speaker);
        if (narrator) {
            this.speaker.setVisible(narrator.available);
            const off = narrator.onAvailability((available) => this.speaker?.setVisible(available));
            this.events.once('shutdown', () => {
                off();
                narrator.cancel();
            });
        }
        if (this.fromAge && !placed.stageOverriddenByParent) {
            const { left, top, ...size } = back;
            this.choiceBack = new PageButton(this, () => this.backToAge());
            this.choiceBack.show(pl.welcome.choice.back, left, top, 'secondary', false, size);
        }
    }

    private choose(age: number): void {
        if (this.chosen) {
            return;
        }
        this.place(placeByChild(age, this.sessionMonth(), placementData), true);
    }

    /**
     * Both placement paths end here. A learner-less save that already bought something keeps its building (no choice, nothing dropped);
     * otherwise the scene starts again on the choice view.
     */
    private place(placed: PlacedLearner, fromAge: boolean): void {
        const rooms = (this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined) ?? {};
        if (hasPurchase(rooms)) {
            this.start(placed);
            return;
        }
        this.chosen = true;
        this.closeDialog = undefined;
        this.resumeInput();
        this.scene.restart({ placed, fromAge } satisfies WelcomeData);
    }

    private pick(choice: BuildingChoice['id'], placed: PlacedLearner): void {
        if (this.chosen) {
            return;
        }
        const first = buildingStart(choice, BUILDING_CHOICES, HOUSES);
        this.registry.set(REGISTRY_KEYS.house, first.house);
        this.registry.set(REGISTRY_KEYS.rooms, first.rooms);
        this.registry.set(REGISTRY_KEYS.currentRoom, first.currentRoom);
        this.start(placed);
    }

    private backToAge(): void {
        if (this.chosen) {
            return;
        }
        this.chosen = true;
        this.scene.restart({} satisfies WelcomeData);   // explicit empty data: Phaser keeps the last start's data otherwise (the choice view would reopen)
    }

    /** Parent path: game input off under the dialogs, back on when either is cancelled. */
    private openParent(): void {
        if (this.chosen || this.closeDialog) {
            return;
        }
        const month = this.sessionMonth();
        const suspender = this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
        if (!suspender || this.session?.active()) {
            return;
        }
        const resume = (): void => {
            this.closeDialog = undefined;
            this.resumeInput();
        };
        // Every dialog callback runs in the session: a throw ends the hold (touch never stays dead) and goes on to the error boundary.
        const session = openInputSession(suspender);
        this.session = session;
        this.closeDialog = openParentGate({
            rng: createRng(Math.floor(Math.random() * 2 ** 32)),
            onCancel: () => session.run(resume),
            onPass: () =>
                session.run(() => {
                    this.closeDialog = openStagePanel({
                        month,
                        onCancel: () => session.run(resume),
                        onConfirm: (learner) => session.run(() => this.place(learner, false)),
                    });
                }),
        });
    }

    private start(placed: PlacedLearner): void {
        const learner: SessionLearner = {
            ...placed,
            ...startLearning(stages, placed.age, this.sessionMonth(), placementData, balance.curriculum),
            pendingUnlock: null,
        };
        this.chosen = true;
        this.closeDialog = undefined;
        this.resumeInput();
        this.registry.set(REGISTRY_KEYS.learner, learner);
        this.scene.start(SCENE_KEYS.task);
    }

    private resumeInput(): void {
        this.session?.end();
        this.session = undefined;
    }

    private sessionMonth(): number {
        const month = this.registry.get(REGISTRY_KEYS.month) as number | undefined;
        if (month === undefined) {
            throw new Error('Session month is not set (main.ts sets it before the scenes start)');
        }
        return month;
    }

    private refreshBackdrop(cause: BackdropCause = 'capture'): void {
        this.backdrop?.render(this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined, this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined, cause);
    }

    backdropState(): BackdropSnapshot {
        return this.backdrop?.snapshot() ?? plainBackdropSnapshot(this);
    }

    backdropPixel(): [number, number, number, number] | null {
        return this.backdrop?.pixel() ?? null;
    }

    /** Centres of the buttons in 1920x1080 scene space, for the e2e hook. */
    targets(): {
        ages: readonly { age: number; x: number; y: number }[];
        parent: { x: number; y: number } | null;
        choices: Record<BuildingChoice['id'], { x: number; y: number }> | null;
        choiceBack: { x: number; y: number } | null;
    } {
        const house = this.cards.house?.target();
        const space = this.cards.space?.target();
        return Object.freeze({
            ages: Object.freeze(this.buttons.map(({ age, button }) => Object.freeze({ age, ...button.target() }))),
            parent: this.parentButton?.target() ?? null,
            choices: house && space ? { house, space } : null,
            choiceBack: this.choiceBack?.target() ?? null,
        });
    }

    /** Which view is open and whether the speaker shows, for the e2e hook. */
    viewState(): { welcomeView: 'age' | 'choice'; choiceSpeaker: boolean } {
        return { welcomeView: this.view, choiceSpeaker: this.speaker?.target() != null };
    }
}
