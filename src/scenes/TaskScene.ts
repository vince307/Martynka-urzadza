import { Scene, type GameObjects } from 'phaser';
import { previousStage, type SessionLearner } from '../core/placement';
import { createRng, type Rng } from '../core/rng';
import type { StageDef, StageId } from '../core/types';
import { answer, next, nextSolutionStep, startRound, type RoundState } from '../core/round';
import { isExpression } from '../core/round/prompt';
import { BLANK, layoutPieces, splitBlanks, wrapBlankLines } from '../core/round/promptBlank';
import { narrationOf } from '../core/narration/spoken';
import { defaultAutoRead } from '../core/narration/voice';
import { buildAdaptiveRound, endRound, roundWeights } from '../core/curriculum';
import { buildWarmup, warmupResult } from '../core/round/warmup';
import { summaryView, type SummaryView } from '../core/round/summary';
import { roundView } from '../core/round/view';
import { getStage } from '../data/curriculum';
import { balance } from '../data/balance';
import {
    ANIMATION,
    GAME_EVENTS,
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
import { drawNotebook } from '../ui/widgets/notebook';
import { AnswerTiles } from '../ui/widgets/AnswerTiles';
import { FeedbackBar } from '../ui/widgets/FeedbackBar';
import { Keypad } from '../ui/widgets/Keypad';
import { SummaryPanel } from '../ui/widgets/SummaryPanel';
import { UnlockCard } from '../ui/widgets/UnlockCard';
import { ProgressDots } from '../ui/widgets/ProgressDots';
import { SolutionSteps } from '../ui/widgets/SolutionSteps';
import { textStyle } from '../ui/widgets/textStyle';
import { drawStar, starCounterTarget } from '../ui/widgets/StarCounter';

type Point = { x: number; y: number };

/** What the e2e hook may read of a round (frozen copy). */
export interface TaskSnapshot {
    readonly stage: StageId;
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
    readonly finished: boolean;
    readonly summary: SummaryView | null;
    readonly narration: string | null;
    readonly autoRead: boolean;
    readonly warmup: boolean;
    readonly unlock: { readonly step: number; readonly name: string } | null;   // the open "Nowa umiejętność!" card
}

export interface TaskTargets {
    readonly tiles: readonly (Point & { value: number | string })[];
    readonly keys: readonly (Point & { key: string })[];
    readonly next: Point | null;
    readonly step: Point | null;
    readonly nextRound: Point | null;
    readonly toRoom: Point | null;
    readonly unlockNext: Point | null;
}

/**
 * One round of tasks. The scene keeps a RoundState from core, draws
 * roundView(state) and forwards taps (tiles, keypad, "Dalej", solution steps,
 * the summary's "Kolejna runda" and "Do pokoju") back to core; it decides nothing itself.
 */
export class TaskScene extends Scene {
    private state!: RoundState;
    private dots!: ProgressDots;
    private tiles!: AnswerTiles;
    private keypad!: Keypad;
    private bar!: FeedbackBar;
    private steps!: SolutionSteps;
    private summary!: SummaryPanel;
    private unlockCard!: UnlockCard;
    private unlockShown = false;   // the "Nowa umiejętność!" card is open: render() draws it instead of the summary
    private promptTexts: GameObjects.Text[] = [];
    private promptBoxes: GameObjects.Graphics[] = [];
    private shownIndex = -1;
    private stage!: StageDef;
    private rng!: Rng;
    private narrator: Narrator | undefined;
    private autoRead = false;   // session default by stage (FR-009); a parent switch comes with S-08
    private warmup = false;       // the open round is the placement warm-up (6 tasks); its end may lower the stage silently
    private sessionStars = 0;   // stars of finished rounds; the open round adds state.starsEarned

    constructor() {
        super(SCENE_KEYS.task);
    }

    create(): void {
        // A restarted scene keeps its fields: start from a clean slate.
        this.promptTexts = [];
        this.shownIndex = -1;
        this.sessionStars = 0;
        this.unlockShown = false;
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined;
        if (!learner) {
            throw new Error('The task scene needs a learner in the registry (the welcome scene places one)');
        }
        const stage = getStage(learner.stage);
        if (!stage) {
            throw new Error(`Unknown stage ${learner.stage}`);
        }
        this.stage = stage;
        this.warmup = learner.warmupPending && previousStage(stage.id) !== null;
        this.narrator = this.registry.get(REGISTRY_KEYS.narrator) as Narrator | undefined;
        this.autoRead = defaultAutoRead(stage.id, balance.narrator.autoReadStages);
        this.registry.set(REGISTRY_KEYS.narration, null);
        this.registry.set(REGISTRY_KEYS.roomSwitch, false);
        this.rng = createRng(Date.now() >>> 0);
        this.state = this.freshRound();
        this.registry.set(REGISTRY_KEYS.stars, 0);
        this.scene.launch(SCENE_KEYS.ui);
        drawNotebook(this);
        this.dots = new ProgressDots(this);
        this.tiles = new AnswerTiles(this, (value) => this.submit(value));
        this.keypad = new Keypad(this, balance.keypad.maxDigits, (value) => this.submit(value));
        this.bar = new FeedbackBar(this, () => this.advance());
        this.steps = new SolutionSteps(this, () => this.step());
        this.summary = new SummaryPanel(this, () => this.startNextRound(), () => this.game.events.emit(GAME_EVENTS.toRoom));
        this.unlockCard = new UnlockCard(this, () => this.closeUnlock());
        this.render();
        // The child's tap on an age (welcome) was the gesture that unlocks speech: the first task may be read.
        this.autoReadFirst();
        // "Do pokoju": the round stays as it is while this scene sleeps; no speech runs over the room.
        // game.events listeners also run while this scene sleeps (the room is open), so a stale tap is ignored.
        const toRoom = (): void => {
            if (this.sys.isSleeping()) {
                return;
            }
            this.narrator?.cancel();
            this.registry.set(REGISTRY_KEYS.narration, null);
            this.registry.set(REGISTRY_KEYS.roomSwitch, false);
            this.scene.switch(SCENE_KEYS.room);
        };
        this.game.events.on(GAME_EVENTS.toRoom, toRoom);
        // Back from the room: redraw the same state (summary), re-arm its buttons, no auto-reading.
        const onWake = (): void => this.render();
        this.events.on('wake', onWake);
        this.events.once('shutdown', () => {
            this.game.events.off(GAME_EVENTS.toRoom, toRoom);
            this.events.off('wake', onWake);
        });

        // Build id in the corner: the only way to see on a tablet that a silent
        // PWA update has landed. Technical identifier, not player-facing text.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, textStyle('caption'))
            .setOrigin(0, 1);
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
        this.registry.set(REGISTRY_KEYS.roomSwitch, view.switchVisible);
        const summary = this.currentSummary();
        const unlock = this.unlockView();
        if (unlock) {
            // The card comes before the summary: nothing may redraw the summary over it.
            this.registry.set(REGISTRY_KEYS.roomSwitch, false);
            this.registry.set(REGISTRY_KEYS.narration, pl.unlock.spoken(unlock.name));
            this.hideTaskLayer(view.input);
            this.summary.hide();
            this.unlockCard.show(unlock.name);
            return;
        }
        this.unlockCard.hide();
        if (summary) {
            // The round is over: the notebook stays, the task layer gives way to the summary page.
            this.registry.set(REGISTRY_KEYS.narration, null);
            this.narrator?.cancel();
            this.hideTaskLayer(view.input);
            this.summary.show(summary);
            return;
        }
        this.summary.hide();
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

    /** Hides everything of the task layer (dots, answers, bar, steps, prompt) for a page drawn over the notebook. */
    private hideTaskLayer(input: 'tiles' | 'keypad'): void {
        this.dots.update([]);
        this.tiles.setVisible(false);
        this.keypad.setVisible(false);
        this.tiles.setActive(false);
        this.keypad.setActive(false);
        this.bar.update({ kind: 'none' }, input);
        this.steps.hide();
        this.promptTexts.forEach((t) => t.setVisible(false));
        this.promptBoxes.forEach((g) => g.setVisible(false));
    }

    /** The card to draw: the learner's pending step with its child-facing name, only while the card is open. */
    private unlockView(): { step: number; name: string } | null {
        if (!this.unlockShown) {
            return null;
        }
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const step = learner.pendingUnlock;
        const name = step === null ? undefined : this.stage.steps.find((s) => s.step === step)?.childName;
        return step !== null && name ? { step, name } : null;
    }

    /** "Dalej" on the card: the pending unlock is cleared (the step was raised at the end of the round) and the next round starts. */
    private closeUnlock(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        this.registry.set(REGISTRY_KEYS.learner, { ...learner, pendingUnlock: null } satisfies SessionLearner);
        this.unlockShown = false;
        this.beginRound();
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
        } else if (task.prompt.includes(BLANK)) {
            this.drawSentence(task.prompt, sentence, color);
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

    /** A sentence prompt with "□": wrapped by core into lines of text phrases and outlined boxes (top edge at `at.y`). */
    private drawSentence(text: string, at: { x: number; y: number; maxWidth: number }, color: string): void {
        const blank = TASK_LAYOUT.blankInline;
        const style = textStyle('prompt', color);
        const measure = (t: string): number => {
            const m = this.add.text(0, 0, t, style).setVisible(false);
            const w = m.width;
            m.destroy();
            return w;
        };
        const space = measure('a a') - measure('aa');
        wrapBlankLines(text, measure, blank.width, space, at.maxWidth).forEach(({ placed }, row) => {
            const y = at.y + blank.lineHeight * row + blank.lineHeight / 2;
            placed.forEach(({ piece, left, width }) => {
                if (piece.kind === 'text') {
                    this.promptTexts.push(this.add.text(at.x + left, y, piece.text, style).setOrigin(0, 0.5));
                } else {
                    const box = this.add.graphics({ x: at.x + left + width / 2, y });
                    box.lineStyle(blank.lineWidth, parseInt(color.slice(1), 16), 1);
                    box.strokeRoundedRect(-width / 2, -blank.height / 2, width, blank.height, blank.radius);
                    this.promptBoxes.push(box);
                }
            });
        });
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

    /** "Dalej" after a correct answer; after the fifth task it opens the summary. */
    private advance(): void {
        const before = this.state.starsEarned;
        const wasFinished = this.state.finished;
        this.state = next(this.state);
        this.syncStars(before, this.bar.nextTarget());
        if (!wasFinished && this.state.finished) {
            this.finishRound();
        }
        this.render();
        this.autoReadFirst();
    }

    /** "Kolejna runda" on the summary: the finished round's stars join the session, a fresh round starts. */
    private startNextRound(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        if (learner.pendingUnlock !== null) {
            // A step was unlocked at the end of the round: the card comes first; "Dalej" starts the round.
            this.unlockShown = true;
            this.render();
            this.autoReadUnlock();
            return;
        }
        this.beginRound();
    }

    /** The finished round's stars join the session and a fresh round starts. */
    private beginRound(): void {
        this.sessionStars += this.state.starsEarned;
        this.state = this.freshRound();
        this.shownIndex = -1;
        this.render();
        this.autoReadFirst();
    }

    /** The tap on "Kolejna runda" was the gesture: the card is read when auto-reading is on. */
    private autoReadUnlock(): void {
        if (this.autoRead && this.unlockShown) {
            this.narrator?.speak((this.registry.get(REGISTRY_KEYS.narration) as string | null) ?? '');
        }
    }

    /** Auto-reading starts from a tap on "Dalej" or "Kolejna runda", or once at the scene start (the age tap or the parent confirmation was the gesture). */
    private autoReadFirst(): void {
        if (this.autoRead && this.state.phase === 'first') {
            this.narrator?.speak(this.currentNarration() ?? '');
        }
    }

    private freshRound(): RoundState {
        const previous = this.warmup ? getStage(previousStage(this.stage.id) ?? this.stage.id) : undefined;
        if (this.warmup && previous) {
            const rules = { ...balance.round, length: balance.warmup.length };
            return startRound(buildWarmup(this.stage, previous, this.rng, balance.warmup, balance.tiles.count, balance.round.uniqueRetries), rules);
        }
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const previousId = previousStage(this.stage.id);
        const tasks = buildAdaptiveRound(
            this.stage,
            previousId ? getStage(previousId) : undefined,
            learner,
            roundWeights(learner, balance),
            this.rng,
            balance.round,
            balance.tiles.count,
        );
        return startRound(tasks, balance.round);
    }

    /**
     * The round just finished (once per round: "Do pokoju" and coming back cannot skip or repeat it): core updates mastery
     * and, after an ordinary round, unlocks a step and the easing counters; the warm-up then settles the stage.
     */
    private finishRound(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const results = this.state.tasks.map((task, i) => ({ skillId: task.skillId, outcome: this.state.outcomes[i] }));
        const { adaptation, unlocked } = endRound(learner, this.stage, results, Date.now(), this.warmup ? 'warmup' : 'round', balance);
        // The unlock card shows pendingUnlock after "Kolejna runda" (closeUnlock clears it).
        this.registry.set(REGISTRY_KEYS.learner, {
            ...learner,
            ...adaptation,
            pendingUnlock: unlocked ?? learner.pendingUnlock,
        } satisfies SessionLearner);
        if (this.warmup) {
            this.finishWarmup();
        }
    }

    /**
     * The warm-up is over: core decides whether the stage drops by one; the child sees an ordinary summary.
     * Done now, not at "Kolejna runda", so "Do pokoju" and coming back cannot skip it.
     */
    private finishWarmup(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const stageId = warmupResult(this.stage.id, this.state.outcomes, balance.warmup.minFirstTry);
        const stage = getStage(stageId);
        if (!stage) {
            throw new Error(`Unknown stage ${stageId}`);
        }
        this.registry.set(REGISTRY_KEYS.learner, { ...learner, stage: stageId, warmupPending: false } satisfies SessionLearner);
        this.stage = stage;
        this.autoRead = defaultAutoRead(stage.id, balance.narrator.autoReadStages);
        this.warmup = false;
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

    private currentSummary(): SummaryView | null {
        return summaryView(this.state, { starsTotal: this.sessionStars + this.state.starsEarned, nextRoomTaskCost: null });
    }

    /** Read-only copy of the round for the e2e hook; nothing here can change the scene. */
    snapshot(): TaskSnapshot {
        const view = roundView(this.state, pl.round.resultLine);
        const task = this.state.tasks[this.state.index];
        const current = this.currentSummary();
        const frozenSummary = current ? Object.freeze({ ...current, stars: Object.freeze([...current.stars]) as unknown as boolean[] }) : null;
        return Object.freeze({
            stage: this.stage.id,
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
            finished: this.state.finished,
            summary: frozenSummary,
            narration: (this.registry.get(REGISTRY_KEYS.narration) as string | null | undefined) ?? null,
            autoRead: this.autoRead,
            warmup: this.warmup,
            unlock: this.unlockView(),
        });
    }

    /** Centres of the tappable things in 1920x1080 scene space, for the e2e hook. */
    targets(): TaskTargets {
        return Object.freeze({
            tiles: this.tiles.targets(),
            keys: this.keypad.targets(),
            next: this.bar.nextTarget(),
            step: this.steps.stepTarget(),
            nextRound: this.summary.targets().nextRound,
            toRoom: this.summary.targets().toRoom,
            unlockNext: this.unlockCard.target(),
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
            duration: ANIMATION.shakeMs / ANIMATION.shakeSegments,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                camera.scrollX = 0;
            },
        });
    }
}
