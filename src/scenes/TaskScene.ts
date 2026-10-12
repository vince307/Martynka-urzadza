import { Scene, type GameObjects } from 'phaser';
import { createRng, type Rng } from '../core/rng';
import type { StageDef } from '../core/types';
import { answer, next, nextSolutionStep, startRound, type RoundState } from '../core/round';
import { isExpression } from '../core/round/prompt';
import { buildRound } from '../core/round/pick';
import { roundView } from '../core/round/view';
import { getStage } from '../data/curriculum';
import { balance } from '../data/balance';
import {
    FONT_FAMILY,
    ANIMATION,
    FONT_SIZES,
    GAME_HEIGHT,
    PLACEHOLDER_COLORS,
    PLACEHOLDER_FRAME,
    REGISTRY_KEYS,
    SCENE_KEYS,
    TASK_LAYOUT,
} from '../data/layout';
import { pl } from '../data/pl';
import { AnswerTiles } from '../ui/widgets/AnswerTiles';
import { FeedbackBar } from '../ui/widgets/FeedbackBar';
import { Keypad } from '../ui/widgets/Keypad';
import { ProgressDots } from '../ui/widgets/ProgressDots';
import { SolutionSteps } from '../ui/widgets/SolutionSteps';
import { drawStar, starCounterTarget } from '../ui/widgets/StarCounter';

const toCssColor = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

/**
 * One round of tasks. The scene keeps a RoundState from core and draws
 * roundView(state); input arrives in the next phases.
 */
export class TaskScene extends Scene {
    private state!: RoundState;
    private dots!: ProgressDots;
    private tiles!: AnswerTiles;
    private keypad!: Keypad;
    private bar!: FeedbackBar;
    private steps!: SolutionSteps;
    private promptTexts: GameObjects.Text[] = [];
    private shownIndex = -1;
    private stage!: StageDef;
    private rng!: Rng;
    private sessionStars = 0;   // stars of finished rounds; the open round adds state.starsEarned

    constructor() {
        super(SCENE_KEYS.task);
    }

    create(): void {
        const stage = getStage(balance.defaultStage);
        if (!stage) {
            throw new Error(`Unknown default stage ${balance.defaultStage}`);
        }
        this.stage = stage;
        this.rng = createRng(Date.now() >>> 0);
        this.state = this.freshRound();
        this.registry.set(REGISTRY_KEYS.stars, 0);
        this.scene.launch(SCENE_KEYS.ui);
        this.drawNotebook();
        this.dots = new ProgressDots(this);
        this.tiles = new AnswerTiles(this, (value) => this.submit(value));
        this.keypad = new Keypad(this, balance.keypad.maxDigits, (value) => this.submit(value));
        this.bar = new FeedbackBar(this, () => this.advance());
        this.steps = new SolutionSteps(this, () => this.step());
        this.render();

        // Build id in the corner: the only way to see on a tablet that a silent
        // PWA update has landed. Technical identifier, not player-facing text.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, {
                fontFamily: FONT_FAMILY,
                fontSize: `${FONT_SIZES.caption}px`,
                color: toCssColor(PLACEHOLDER_COLORS.deepTeal),
            })
            .setOrigin(0, 1);
    }

    private drawNotebook(): void {
        const { left, top, width, height, border, radius } = TASK_LAYOUT.notebook;
        const graphics = this.add.graphics();
        graphics.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
        graphics.fillRoundedRect(left, top, width, height, radius);
        graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        graphics.fillRoundedRect(left + border, top + border, width - 2 * border, height - 2 * border, radius - border / 2);
    }

    private render(): void {
        const view = roundView(this.state, pl.round.resultLine);
        this.dots.update(view.dots);
        if (this.shownIndex !== this.state.index) {
            this.shownIndex = this.state.index;
            this.drawPrompt(view.input);
            this.keypad.reset();
            if (view.input === 'tiles') {
                this.tiles.setChoices(view.choices);
            }
        }
        const task = this.state.tasks[this.state.index];
        const finishedTask = this.state.phase === 'done';
        this.tiles.setVisible(view.input === 'tiles');
        this.keypad.setVisible(view.input === 'keypad');
        this.tiles.setActive(view.input === 'tiles' && view.inputActive);
        this.keypad.setActive(view.input === 'keypad' && view.inputActive);
        if (finishedTask) {
            this.tiles.markCorrect(view.input === 'tiles' ? (task.answer as number | string) : null);
            this.keypad.markCorrect();
        }
        this.tiles.markHint(view.bar.kind === 'retype' && view.input === 'tiles' ? (task.answer as number | string) : null);
        this.bar.update(view.bar, view.input);
        if (view.bar.kind === 'solution') {
            const span = TASK_LAYOUT.barSpan[view.input];
            const centerX = span.x + span.width / 2;
            this.steps.show(view.bar, centerX, this.promptBottom() + TASK_LAYOUT.solution.topGap);
        } else {
            this.steps.hide();
        }
    }

    /** Lowest y of the prompt texts, so the solution lines start under them. */
    private promptBottom(): number {
        return Math.max(...this.promptTexts.map((t) => t.getBounds().bottom));
    }

    private drawPrompt(input: 'tiles' | 'keypad'): void {
        this.promptTexts.forEach((t) => t.destroy());
        this.promptTexts = [];
        const task = this.state.tasks[this.state.index];
        const color = toCssColor(PLACEHOLDER_COLORS.deepTeal);
        const { prompt } = TASK_LAYOUT;
        const sentence = input === 'tiles' ? prompt : TASK_LAYOUT.promptBeside;
        const expression = input === 'tiles' ? TASK_LAYOUT.expressionWide : TASK_LAYOUT.expression;
        if (isExpression(task.prompt)) {
            this.promptTexts.push(
                this.add
                    .text(prompt.x, prompt.y, pl.round.calculate, { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZES.prompt}px`, color })
                    .setOrigin(0.5),
                this.add
                    .text(expression.x, expression.y, task.prompt, { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZES.expression}px`, color })
                    .setOrigin(0.5),
            );
        } else {
            this.promptTexts.push(
                this.add
                    .text(sentence.x, sentence.y, task.prompt, {
                        fontFamily: FONT_FAMILY,
                        fontSize: `${FONT_SIZES.prompt}px`,
                        color,
                        align: 'center',
                        wordWrap: { width: sentence.maxWidth },
                    })
                    .setOrigin(0.5, 0),
            );
        }
    }

    /** A tile or the keypad's OK handed in an answer: core decides, the scene redraws. */
    private submit(value: unknown): void {
        const before = this.state.starsEarned;
        this.state = answer(this.state, value);
        this.syncStars(before, this.answerSpot(value));
        if (this.state.phase !== 'done') {
            this.keypad.reset();   // a wrong number is cleared; the tiles keep their place
            this.shake();
        }
        this.render();
    }

    /** "Dalej" after a correct answer. */
    private advance(): void {
        if (this.state.finished) {
            this.sessionStars += this.state.starsEarned;
            this.state = this.freshRound();
            this.shownIndex = -1;
        } else {
            const before = this.state.starsEarned;
            this.state = next(this.state);
            this.syncStars(before, this.bar.nextTarget());
        }
        this.render();
    }

    private freshRound(): RoundState {
        return startRound(buildRound(this.stage, this.rng, balance.round, balance.tiles.count), balance.round);
    }

    /** The counter shows the new total at once; the star flies after it without blocking input. */
    private syncStars(before: number, from: { x: number; y: number } | null): void {
        const total = this.sessionStars + this.state.starsEarned;
        this.registry.set(REGISTRY_KEYS.stars, total);
        if (this.state.starsEarned > before && from) {
            this.flyStar(from);
        }
    }

    /** Where the answer was given: the tapped tile, or the OK key of the keypad. */
    private answerSpot(value: unknown): { x: number; y: number } | null {
        const view = roundView(this.state, pl.round.resultLine);
        if (view.input === 'tiles') {
            return this.tiles.targets().find((t) => t.value === value) ?? null;
        }
        return this.keypad.targets().find((k) => k.key === 'ok') ?? null;
    }

    private flyStar(from: { x: number; y: number }): void {
        const to = starCounterTarget();
        const star = this.add.graphics({ x: from.x, y: from.y });
        drawStar(star, 0, 0, TASK_LAYOUT.starCounter.starRadius, PLACEHOLDER_COLORS.butter);
        this.tweens.chain({
            targets: star,
            tweens: [
                { scale: ANIMATION.starPopScale, duration: ANIMATION.starPopMs },
                { x: to.x, y: to.y, scale: 1, duration: ANIMATION.starFlightMs - ANIMATION.starPopMs, ease: 'Sine.easeInOut' },
            ],
            onComplete: () => star.destroy(),
        });
    }

    /** "Następny krok" / "Już wiem". */
    private step(): void {
        this.state = nextSolutionStep(this.state);
        this.render();
    }

    /** A short sideways wobble after a mistake; it never blocks input. */
    private shake(): void {
        const camera = this.cameras.main;
        this.tweens.killTweensOf(camera);
        camera.scrollX = 0;
        this.tweens.add({
            targets: camera,
            scrollX: { from: -ANIMATION.shakeDistance, to: ANIMATION.shakeDistance },
            duration: ANIMATION.shakeMs / 6,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                camera.scrollX = 0;
            },
        });
    }
}
