import { Scene, type GameObjects } from 'phaser';
import { createRng, type Rng } from '../core/rng';
import type { StageDef } from '../core/types';
import { answer, next, nextSolutionStep, startRound, type RoundState } from '../core/round';
import { isExpression } from '../core/round/prompt';
import { layoutPieces, splitBlanks } from '../core/round/promptBlank';
import { narrationOf } from '../core/narration/spoken';
import { defaultAutoRead } from '../core/narration/voice';
import { buildRound } from '../core/round/pick';
import { roundView } from '../core/round/view';
import { getStage } from '../data/curriculum';
import { balance } from '../data/balance';
import {
    ANIMATION,
    GAME_HEIGHT,
    PLACEHOLDER_COLORS,
    PLACEHOLDER_FRAME,
    REGISTRY_KEYS,
    SCENE_KEYS,
    TASK_LAYOUT,
    TEXT_COLOR,
} from '../data/layout';
import { pl } from '../data/pl';
import type { Narrator } from '../ui/narrator';
import { AnswerTiles } from '../ui/widgets/AnswerTiles';
import { FeedbackBar } from '../ui/widgets/FeedbackBar';
import { Keypad } from '../ui/widgets/Keypad';
import { ProgressDots } from '../ui/widgets/ProgressDots';
import { SolutionSteps } from '../ui/widgets/SolutionSteps';
import { textStyle } from '../ui/widgets/textStyle';
import { drawStar, starCounterTarget } from '../ui/widgets/StarCounter';

type Point = { x: number; y: number };

/** What the e2e hook may read of a round (frozen copy). */
export interface TaskSnapshot {
    readonly index: number;
    readonly phase: RoundState['phase'];
    readonly solutionStep: number;
    readonly input: 'tiles' | 'keypad';
    readonly answer: unknown;
    readonly choices: readonly (number | string)[];
    readonly outcomes: RoundState['outcomes'];
    readonly starsEarned: number;
    readonly bonusEarned: number;
    readonly starsTotal: number;
    readonly counter: number;
    readonly finished: boolean;
}

export interface TaskTargets {
    readonly tiles: readonly (Point & { value: number | string })[];
    readonly keys: readonly (Point & { key: string })[];
    readonly next: Point | null;
    readonly step: Point | null;
}

/**
 * One round of tasks. The scene keeps a RoundState from core, draws
 * roundView(state) and forwards taps (tiles, keypad, "Dalej", solution steps)
 * back to core; it decides nothing itself.
 */
export class TaskScene extends Scene {
    private state!: RoundState;
    private dots!: ProgressDots;
    private tiles!: AnswerTiles;
    private keypad!: Keypad;
    private bar!: FeedbackBar;
    private steps!: SolutionSteps;
    private promptTexts: GameObjects.Text[] = [];
    private promptBoxes: GameObjects.Graphics[] = [];
    private shownIndex = -1;
    private stage!: StageDef;
    private rng!: Rng;
    private narrator: Narrator | undefined;
    private autoRead = false;   // session default by stage (FR-009); a parent switch comes with S-08
    private sessionStars = 0;   // stars of finished rounds; the open round adds state.starsEarned

    constructor() {
        super(SCENE_KEYS.task);
    }

    create(): void {
        // A restarted scene keeps its fields: start from a clean slate.
        this.promptTexts = [];
        this.shownIndex = -1;
        this.sessionStars = 0;
        const stage = getStage(balance.defaultStage);
        if (!stage) {
            throw new Error(`Unknown default stage ${balance.defaultStage}`);
        }
        this.stage = stage;
        this.narrator = this.registry.get(REGISTRY_KEYS.narrator) as Narrator | undefined;
        this.autoRead = defaultAutoRead(stage.id, balance.narrator.autoReadStages);
        this.registry.set(REGISTRY_KEYS.narration, null);
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
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, textStyle('caption'))
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

    /** What the speaker reads in the current phase (core/narration decides; the words come from pl). */
    private currentNarration(): string | null {
        return narrationOf(this.state, {
            words: pl.speech,
            calculate: pl.round.calculate,
            tryAgain: pl.round.tryAgain,
            answerLine: pl.round.resultLine,
        });
    }

    private render(): void {
        const view = roundView(this.state, pl.round.resultLine);
        this.registry.set(REGISTRY_KEYS.narration, this.currentNarration());
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
            // Steps sit under the expression, on its centre line (kit .equation holds the solution lines).
            const centerX = (view.input === 'tiles' ? TASK_LAYOUT.expressionWide : TASK_LAYOUT.expression).x;
            const maxWidth = TASK_LAYOUT.barSpan[view.input].width;   // same width as the bar under them
            this.steps.show(view.bar, centerX, this.promptBottom() + TASK_LAYOUT.solution.topGap, maxWidth);
        } else {
            this.steps.hide();
        }
    }

    /** Lowest y of the prompt texts, so the solution lines start under them. */
    private promptBottom(): number {
        return Math.max(
            ...this.promptTexts.map((t) => t.getBounds().bottom),
            ...this.promptBoxes.map((g) => g.y + TASK_LAYOUT.blank.height / 2),
        );
    }

    private drawPrompt(input: 'tiles' | 'keypad'): void {
        this.promptTexts.forEach((t) => t.destroy());
        this.promptTexts = [];
        this.promptBoxes.forEach((g) => g.destroy());
        this.promptBoxes = [];
        const task = this.state.tasks[this.state.index];
        const color = TEXT_COLOR;
        const { prompt } = TASK_LAYOUT;
        const sentence = input === 'tiles' ? prompt : TASK_LAYOUT.promptBeside;
        const expression = input === 'tiles' ? TASK_LAYOUT.expressionWide : TASK_LAYOUT.expression;
        // DESIGN-GAP 8 (resolved): the kit has no missing-number frame and the font has no U+25A1, so every "□" is
        // drawn as an outlined box between text pieces (docs/design-gaps.md row 8). The task data keeps "□".
        if (isExpression(task.prompt)) {
            this.promptTexts.push(
                this.add
                    .text(prompt.x, prompt.y, pl.round.calculate, textStyle('prompt', color))
                    .setOrigin(0.5),
            );
            this.drawExpression(task.prompt, expression, color);
        } else {
            this.promptTexts.push(
                this.add
                    .text(sentence.x, sentence.y, task.prompt, {
                        ...textStyle('prompt', color),
                        align: 'center',
                        wordWrap: { width: sentence.maxWidth },
                    })
                    .setOrigin(0.5, 0),
            );
        }
    }

    /** The expression centred on `at`; each "□" becomes an outlined box the size of a digit. */
    private drawExpression(text: string, at: Point, color: string): void {
        const blank = TASK_LAYOUT.blank;
        const pieces = splitBlanks(text);
        const made = pieces.map((p) =>
            p.kind === 'text' ? this.add.text(0, 0, p.text, textStyle('expression', color)).setOrigin(0, 0.5) : null,
        );
        const { placed } = layoutPieces(pieces, (_t, i) => made[i]?.width ?? 0, blank.width, blank.gap);
        placed.forEach(({ piece, left, width }, i) => {
            const t = made[i];
            if (piece.kind === 'text' && t) {
                t.setPosition(at.x + left, at.y);
                this.promptTexts.push(t);
            } else {
                const box = this.add.graphics({ x: at.x + left + width / 2, y: at.y });
                box.lineStyle(blank.lineWidth, parseInt(color.slice(1), 16), 1);
                box.strokeRoundedRect(-width / 2, -blank.height / 2, width, blank.height, blank.radius);
                this.promptBoxes.push(box);
            }
        });
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
        // Auto-reading starts only from a tap on "Dalej" (never at a cold start: there is no gesture yet).
        if (this.autoRead && this.state.phase === 'first') {
            this.narrator?.speak(this.currentNarration() ?? '');
        }
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
        // Start above the tapped tile or key so the star never hides the answer.
        const star = this.add.graphics({ x: from.x, y: from.y - ANIMATION.starStartLift });
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

    /** Read-only copy of the round for the e2e hook; nothing here can change the scene. */
    snapshot(): TaskSnapshot {
        const view = roundView(this.state, pl.round.resultLine);
        const task = this.state.tasks[this.state.index];
        return Object.freeze({
            index: this.state.index,
            phase: this.state.phase,
            solutionStep: this.state.solutionStep,
            input: view.input,
            answer: task.answer,
            choices: Object.freeze([...(view.input === 'tiles' ? view.choices : [])]),
            outcomes: Object.freeze([...this.state.outcomes]),
            starsEarned: this.state.starsEarned,
            bonusEarned: this.state.bonusEarned,
            starsTotal: this.sessionStars + this.state.starsEarned,
            counter: Number(this.registry.get(REGISTRY_KEYS.stars) ?? 0),
            finished: this.state.finished,
        });
    }

    /** Centres of the tappable things in 1920x1080 scene space, for the e2e hook. */
    targets(): TaskTargets {
        return Object.freeze({
            tiles: this.tiles.targets(),
            keys: this.keypad.targets(),
            next: this.bar.nextTarget(),
            step: this.steps.stepTarget(),
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
