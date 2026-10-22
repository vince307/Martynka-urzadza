import { Scene } from 'phaser';
import { startLearning } from '../core/curriculum';
import { placeByChild, type PlacedLearner, type SessionLearner } from '../core/placement';
import { createRng } from '../core/rng';
import { stages } from '../data/curriculum';
import { balance } from '../data/balance';
import { GAME_HEIGHT, PLACEHOLDER_FRAME, REGISTRY_KEYS, SCENE_KEYS, WELCOME_LAYOUT } from '../data/layout';
import { pl } from '../data/pl';
import { placementData } from '../data/placement';
import { openInputSession, type InputSession, type InputSuspender } from '../core/inputSuspend';
import { openParentGate } from '../ui/dom/parentGate';
import { openStagePanel } from '../ui/dom/stagePanel';
import { AgeButton } from '../ui/widgets/AgeButton';
import { drawNotebook } from '../ui/widgets/notebook';
import { PageButton } from '../ui/widgets/PageButton';
import { textStyle } from '../ui/widgets/textStyle';

/**
 * First screen of a cold start: the brand, "Ile masz lat?" and one button per age. The child taps
 * the age; core/placement turns age and the session's month into the learner (stage), which goes
 * to the registry, and the task scene starts. The scene decides nothing itself.
 */
export class WelcomeScene extends Scene {
    private buttons: { age: number; button: AgeButton }[] = [];
    private chosen = false;
    private parentButton: PageButton | undefined;
    private closeDialog: (() => void) | undefined;
    private session: InputSession | undefined;   // this scene's hold on the game's input switch while a parent dialog is open

    constructor() {
        super(SCENE_KEYS.welcome);
    }

    create(): void {
        // A restarted scene keeps its fields: start from a clean slate.
        this.buttons = [];
        this.chosen = false;
        this.closeDialog = undefined;
        this.session = undefined;
        this.events.once('shutdown', () => {
            this.closeDialog?.();
            this.resumeInput();
        });
        drawNotebook(this);
        const flower = WELCOME_LAYOUT.flower;
        // No stand-in on the welcome: a missing texture draws nothing.
        if (this.textures.exists(flower.key)) {
            this.add.image(flower.left + flower.size / 2, flower.top + flower.size / 2, flower.key).setDisplaySize(flower.size, flower.size).setAngle(flower.angle);
        }
        this.add.text(WELCOME_LAYOUT.brand.x, WELCOME_LAYOUT.brand.y, pl.title, textStyle('brand')).setOrigin(0.5, 0);
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
        // Build id in the corner, like the task screen: shows on a tablet that a silent update has landed.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, textStyle('caption'))
            .setOrigin(0, 1);
    }

    private choose(age: number): void {
        if (this.chosen) {
            return;
        }
        this.start(placeByChild(age, this.sessionMonth(), placementData));
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
                        onConfirm: (learner) => session.run(() => this.start(learner)),
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

    /** Centres of the buttons in 1920x1080 scene space, for the e2e hook. */
    targets(): { ages: readonly { age: number; x: number; y: number }[]; parent: { x: number; y: number } | null } {
        return Object.freeze({
            ages: Object.freeze(this.buttons.map(({ age, button }) => Object.freeze({ age, ...button.target() }))),
            parent: this.parentButton?.target() ?? null,
        });
    }
}
