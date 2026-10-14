import { Scene, type GameObjects } from 'phaser';
import { initialClockSet, stepClockSet, type ClockSetEvent, type ClockSetGeo, type ClockSetState } from '../core/clockSet';
import { clockSetLayout } from '../core/round/pictureLayout';
import { initialBlockDrag, stepBlockDrag, type BlockDragEvent, type BlockDragState, type Mat } from '../core/blockDrag';
import type { InputSuspender } from '../core/inputSuspend';
import { previousStage, type SessionLearner } from '../core/placement';
import { createRng, type Rng } from '../core/rng';
import { nextTaskCost } from '../core/rooms';
import { earn } from '../core/stars';
import type { RoomState, Settings, SkillDef, StageDef, StageId } from '../core/types';
import { answer, next, nextSolutionStep, roundResults, startRound, type RoundState } from '../core/round';
import { isExpression } from '../core/round/prompt';
import { BLANK, layoutPieces, splitBlanks, wrapBlankLines } from '../core/round/promptBlank';
import { narrationOf } from '../core/narration/spoken';
import { effectiveAutoRead } from '../core/narration/voice';
import { buildAdaptiveRound, endRound, roundWeights } from '../core/curriculum';
import type { ArtHealth } from '../core/artHealth';
import { artBlocked } from '../core/round/artFilter';
import { buildWarmup, warmupResult } from '../core/round/warmup';
import { summaryView, type SummaryView } from '../core/round/summary';
import { roundView } from '../core/round/view';
import { dragMode } from '../core/tasks/dragMode';
import { dragGeometry, dragKinds, dragLayout } from '../core/round/dragLayout';
import { answerSpans, belowPrompt, fitSize, pictureLayout } from '../core/round/pictureLayout';
import { distinctTasks } from '../core/round/unique';
import { generateTask } from '../core/tasks/generateTask';
import { visualShape, type AnswerMode, type TaskVisual } from '../core/tasks/visual';
import { getStage } from '../data/curriculum';
import { balance } from '../data/balance';
import {
    ANIMATION,
    FONT_SIZES,
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
import { FIRST_ROOM, ROOMS } from '../data/rooms';
import { E2E_FORCED_FAILURE, forcedSkills } from '../testing/e2eHook';
import { prefersReducedMotion } from '../ui/motion';
import type { Narrator } from '../ui/narrator';
import { drawNotebook } from '../ui/widgets/notebook';
import { AnswerTiles } from '../ui/widgets/AnswerTiles';
import { BlockMat, type BlockMatTargets } from '../ui/widgets/BlockMat';
import { ClockSet, type ClockSetTargets } from '../ui/widgets/ClockSet';
import { SelectTiles } from '../ui/widgets/SelectTiles';
import { FeedbackBar } from '../ui/widgets/FeedbackBar';
import { Keypad } from '../ui/widgets/Keypad';
import { SummaryPanel } from '../ui/widgets/SummaryPanel';
import { TaskPicture } from '../ui/widgets/TaskPicture';
import { UnlockCard } from '../ui/widgets/UnlockCard';
import { ProgressDots } from '../ui/widgets/ProgressDots';
import { SolutionSteps } from '../ui/widgets/SolutionSteps';
import { textStyle } from '../ui/widgets/textStyle';
import { drawStar, starCounterTarget } from '../ui/widgets/StarCounter';
import type { Autosaver } from '../core/autosave';

type Point = { x: number; y: number };

/** What the e2e hook may read of a round (frozen copy). */
export interface TaskSnapshot {
    readonly stage: StageId;
    readonly index: number;
    readonly phase: RoundState['phase'];
    readonly solutionStep: number;
    readonly input: AnswerMode;
    readonly answer: unknown;
    readonly visual: TaskVisual | null;   // the drawing of the open task (a copy)
    readonly art: readonly { readonly key: string; readonly loaded: boolean }[];   // the art images on screen now, read from the widget (S-14)
    readonly choices: readonly (number | string)[];
    readonly selected: readonly (number | string)[];   // the tiles marked in the 'select' mode
    readonly mat: Readonly<Mat>;   // the blocks on the mat of the 'drag' mode
    readonly carrying: boolean;    // a block is under a finger ('drag' mode)
    readonly clock: { readonly hour: number; readonly minute: number; readonly carrying: 'hour' | 'minute' | null } | null;   // the hands of a clock to set (S-13b)
    readonly outcomes: RoundState['outcomes'];
    readonly starsEarned: number;
    readonly bonusEarned: number;
    readonly starsTotal: number;
    readonly stars: number;   // the registry balance (the same value as starsTotal)
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
    readonly selectTiles: readonly (Point & { value: number | string })[];
    readonly selectOk: Point | null;
    readonly drag: BlockMatTargets;
    readonly clock: ClockSetTargets | null;   // the hand tips, centre and "OK" of a clock to set
    readonly next: Point | null;
    readonly step: Point | null;
    readonly picture: { x: number; y: number; width: number; height: number } | null;   // the drawing's rectangle; the hook aims at its interior
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
    private select!: SelectTiles;
    private blockMat!: BlockMat;
    private dragState: BlockDragState = initialBlockDrag();
    private dragGeo = dragGeometry(dragLayout(TASK_LAYOUT.drag, []), []);
    private clockSet!: ClockSet;
    private clockState: ClockSetState = initialClockSet({ hour: 12, minute: 0 });
    private clockStart = { hour: 12, minute: 0 };
    private clockSnap: 60 | 5 = 60;
    private clockGeo: ClockSetGeo = this.makeClockGeo();
    private clockTask = false;   // the open 'drag' task is a clock to set (core/tasks/dragMode), not a block build
    private dragLive = false;   // the 'drag' task is open and takes the child's touches
    private keypad!: Keypad;
    private bar!: FeedbackBar;
    private steps!: SolutionSteps;
    private picture!: TaskPicture;
    private summary!: SummaryPanel;
    private unlockCard!: UnlockCard;
    private unlockShown = false;   // the "Nowa umiejętność!" card is open: render() draws it instead of the summary
    private promptTexts: GameObjects.Text[] = [];
    private promptBoxes: GameObjects.Graphics[] = [];
    private shownIndex = -1;
    private stage!: StageDef;
    private rng!: Rng;
    private narrator: Narrator | undefined;
    private warmup = false;       // the open round is the placement warm-up (6 tasks); its end may lower the stage silently
    private flyingStars: GameObjects.Graphics[] = [];   // stars still in flight; "Do pokoju" ends them (the sleeping scene's tweens stand still)

    constructor() {
        super(SCENE_KEYS.task);
    }

    update(): void {
        if (__E2E_HOOK__ && this.registry.get(REGISTRY_KEYS.forcedFailure) === 'step') {
            this.registry.set(REGISTRY_KEYS.forcedFailure, null);   // once
            throw new Error(E2E_FORCED_FAILURE);   // e2e build only
        }
        // A dialog over the canvas swallows the lift of the finger: a block in the air must not survive it.
        if ((this.dragState.carrying || this.clockState.carrying) && (this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined)?.suspended()) {
            this.feedDrag({ type: 'reset' });
        }
    }

    create(): void {
        // A restarted scene keeps its fields: start from a clean slate.
        this.promptTexts = [];
        this.shownIndex = -1;
        this.flyingStars = [];
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
        this.registry.set(REGISTRY_KEYS.narration, null);
        this.registry.set(REGISTRY_KEYS.roomSwitch, false);
        this.rng = createRng(Date.now() >>> 0);
        this.state = this.freshRound();
        this.scene.launch(SCENE_KEYS.ui);
        drawNotebook(this);
        this.picture = new TaskPicture(this);
        this.dots = new ProgressDots(this);
        this.tiles = new AnswerTiles(this, (value) => this.submit(value));
        this.select = new SelectTiles(this, (value) => this.submit(value));
        this.keypad = new Keypad(this, balance.keypad.maxDigits, (value) => this.submit(value));
        this.blockMat = new BlockMat(this, (value) => this.submit(value));
        this.clockSet = new ClockSet(this, (value) => this.submit(value));
        this.clockState = initialClockSet(this.clockStart);
        this.clockTask = false;
        this.dragState = initialBlockDrag();
        this.dragLive = false;
        // The whole scene feeds the block-drag reducer with raw pointer events (core/blockDrag decides); it acts only while a 'drag' task takes touches.
        type Raw = { id: number; x: number; y: number; wasCanceled?: boolean };
        const lift = (p: Raw): BlockDragEvent => (p.wasCanceled ? { type: 'cancel' } : { type: 'up', pointerId: p.id, x: p.x, y: p.y });
        this.input.on('pointerdown', (p: Raw) => this.feedDrag({ type: 'down', pointerId: p.id, x: p.x, y: p.y }));
        this.input.on('pointermove', (p: Raw) => this.feedDrag({ type: 'move', pointerId: p.id, x: p.x, y: p.y }));
        this.input.on('pointerup', (p: Raw) => this.feedDrag(lift(p)));
        // A finger lifted outside the canvas (the letterbox) is not a drop: like a system cancel it leaves the mat as it was.
        this.input.on('pointerupoutside', () => this.feedDrag({ type: 'cancel' }));
        const onSleep = (): void => this.feedDrag({ type: 'reset' });
        this.events.on('sleep', onSleep);
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
            this.feedDrag({ type: 'reset' });
            this.narrator?.cancel();
            this.endFlyingStars();
            this.registry.set(REGISTRY_KEYS.narration, null);
            this.registry.set(REGISTRY_KEYS.roomSwitch, false);
            this.scene.switch(SCENE_KEYS.room);
        };
        this.game.events.on(GAME_EVENTS.toRoom, toRoom);
        // Back from the room: redraw the same state (summary), re-arm its buttons, no auto-reading.
        // A stage change made from the room (the parent panel) waits here: the round is replaced when the scene wakes.
        const onWake = (): void => {
            const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
            if (learner.stage !== this.stage.id) {
                this.applyParentStage(false);
            } else {
                this.render();
            }
        };
        this.events.on('wake', onWake);
        // The parent confirmed another stage over the task screen; a sleeping scene (room open) waits for its wake.
        const onParentStage = (): void => {
            if (!this.sys.isSleeping()) {
                this.applyParentStage(true);
            }
        };
        this.game.events.on(GAME_EVENTS.parentStage, onParentStage);
        this.events.once('shutdown', () => {
            this.game.events.off(GAME_EVENTS.toRoom, toRoom);
            this.game.events.off(GAME_EVENTS.parentStage, onParentStage);
            this.events.off('wake', onWake);
            this.events.off('sleep', onSleep);
        });

        // Build id in the corner: the only way to see on a tablet that a silent
        // PWA update has landed. Technical identifier, not player-facing text.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, textStyle('caption'))
            .setOrigin(0, 1);
    }

    /** Automatic reading in effect now: the parent's choice, else the stage default (FR-009); read at the moment of use. */
    private get autoRead(): boolean {
        const settings = this.registry.get(REGISTRY_KEYS.settings) as Settings;
        return effectiveAutoRead(settings, this.stage.id, balance.narrator.autoReadStages);
    }

    /**
     * The parent moved the child to another stage (core/placement changeStageByParent wrote it into the learner).
     * The open round, whatever its phase, gives way to a fresh round of the new stage; its stars stay on the counter.
     * No scene restart: the stars and the session state survive. Same stage: nothing (a confirmed auto-reading choice
     * must not break the round).
     */
    private applyParentStage(read: boolean): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const stage = getStage(learner.stage);
        if (!stage) {
            throw new Error(`Unknown stage ${learner.stage}`);
        }
        if (stage.id === this.stage.id) {
            return;
        }
        this.narrator?.cancel();
        this.tweens.killTweensOf(this.cameras.main);
        this.cameras.main.scrollX = 0;
        this.stage = stage;
        this.warmup = false;
        this.unlockShown = false;
        this.state = this.freshRound();
        this.shownIndex = -1;
        this.render();
        if (read) {
            this.autoReadFirst();
        }
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
        const task0 = this.state.tasks[this.state.index];
        if (this.shownIndex !== this.state.index) {
            this.shownIndex = this.state.index;
            this.drawPrompt(view.input);
            this.keypad.reset();
            if (view.input === 'tiles') {
                this.tiles.setChoices(view.choices, answerSpans(TASK_LAYOUT.picture, view.input, task0.visual ? visualShape(task0.visual) : 'wide').tiles ?? undefined);
            }
            if (view.input === 'select') {
                this.select.setChoices(view.choices);
            }
            // A new task starts with an empty mat and nothing in the air.
            this.dragState = initialBlockDrag();
            this.clockTask = view.input === 'drag' && dragMode(task0) === 'clock';
            if (this.clockTask && task0.visual?.kind === 'clock') {
                this.clockStart = { hour: task0.visual.hour, minute: task0.visual.minute };
                this.clockSnap = task0.visual.snap ?? 60;
                this.clockState = initialClockSet(this.clockStart);
            }
            // Only the blocks branch of 'drag' has a tray; the branch comes from the drawing (core/tasks/dragMode), not from the answer's type.
            const kinds = view.input === 'drag' && dragMode(task0) === 'blocks' ? dragKinds(typeof task0.answer === 'number' ? task0.answer : 0) : [];
            const layout = dragLayout(TASK_LAYOUT.drag, kinds);
            this.dragGeo = dragGeometry(layout, kinds);
            this.blockMat.setLayout(layout, kinds);
        }
        const task = this.state.tasks[this.state.index];
        // DESIGN-GAP 52 and 57 (docs/design-gaps.md): the picture area and the solution lines beside it come from pictureLayout.
        const solutionShown = view.bar.kind === 'solution';
        const layout = pictureLayout(TASK_LAYOUT.picture, view.input, solutionShown, view.visual ? visualShape(view.visual) : 'wide');
        // A prompt too long for its room never runs over the drawing: the drawing gives way under it (visual gate S-13).
        const pictureRect = view.visual ? belowPrompt(layout.picture, this.promptBottom(), TASK_LAYOUT.picture.promptGap, TASK_LAYOUT.picture.minHeight) : layout.picture;
        this.picture.render(this.clockTask ? null : view.visual, pictureRect);   // a clock to set is drawn by ClockSet
        const finishedTask = this.state.phase === 'done';
        this.tiles.setVisible(view.input === 'tiles');
        this.keypad.setVisible(view.input === 'keypad');
        this.select.setVisible(view.input === 'select');
        this.dragLive = view.input === 'drag' && view.inputActive;
        if (!this.dragLive && this.dragState.carrying) {
            this.dragState = { mat: this.dragState.mat, carrying: null };
        }
        if (!this.dragLive && this.clockState.carrying) {
            this.clockState = stepClockSet(this.clockState, { type: 'cancel' }, this.clockGeo, this.clockRules());
        }
        this.blockMat.setVisible(view.input === 'drag' && !this.clockTask);
        this.clockSet.setVisible(view.input === 'drag' && this.clockTask);
        if (this.clockTask) {
            this.clockSet.render(this.clockState, this.clockSnap, this.dragLive, view.bar.kind !== 'solution');
        } else {
            this.blockMat.render(this.dragState, this.dragLive, view.bar.kind !== 'solution');
        }
        this.select.setActive(view.input === 'select' && view.inputActive);
        this.tiles.setActive(view.input === 'tiles' && view.inputActive);
        this.keypad.setActive(view.input === 'keypad' && view.inputActive);
        if (finishedTask) {
            this.tiles.markCorrect(view.input === 'tiles' ? (task.answer as number | string) : null);
            this.keypad.markCorrect();
            this.select.markCorrect(view.input === 'select' ? (task.answer as number[]) : []);
        }
        this.tiles.markHint(view.bar.kind === 'retype' && view.input === 'tiles' ? (task.answer as number | string) : null);
        this.select.markHint(view.bar.kind === 'retype' && view.input === 'select' ? (task.answer as number[]) : []);
        this.bar.update(view.bar, view.input, answerSpans(TASK_LAYOUT.picture, view.input, view.visual ? visualShape(view.visual) : 'wide').bar ?? undefined);
        if (view.bar.kind === 'solution') {
            // Steps sit under the expression, on its centre line (kit .equation holds the solution lines).
            // A drawing keeps its place and the lines take the rectangle beside or below it (DESIGN-GAP 57).
            const lines = view.input === 'drag' ? TASK_LAYOUT.drag.solutionLines : view.visual ? layout.lines : null;
            if (lines) {
                this.steps.show(view.bar, lines.x + lines.width / 2, lines.y, lines.width, lines.y + lines.height);
            } else {
                const beside = view.input === 'keypad';
                const centerX = (beside ? TASK_LAYOUT.expression : TASK_LAYOUT.expressionWide).x;
                const maxWidth = TASK_LAYOUT.barSpan[beside ? 'keypad' : 'tiles'].width;   // same width as the bar under them
                // The select tiles sit higher than the single-answer tiles: the lines stop above them.
                const limit = view.input === 'select' ? TASK_LAYOUT.select.top - TASK_LAYOUT.solution.bottomGap : undefined;
                this.steps.show(view.bar, centerX, this.promptBottom() + TASK_LAYOUT.solution.topGap, maxWidth, limit);
            }
        } else {
            this.steps.hide();
        }
    }

    /** Hides everything of the task layer (dots, answers, bar, steps, prompt) for a page drawn over the notebook. */
    private hideTaskLayer(input: AnswerMode): void {
        this.dots.update([]);
        this.dragLive = false;
        this.blockMat.setVisible(false);
        this.clockSet.setVisible(false);
        this.tiles.setVisible(false);
        this.select.setVisible(false);
        this.select.setActive(false);
        this.keypad.setVisible(false);
        this.tiles.setActive(false);
        this.keypad.setActive(false);
        this.bar.update({ kind: 'none' }, input);
        this.steps.hide();
        this.picture.hide();
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

    private drawPrompt(input: AnswerMode): void {
        this.promptTexts.forEach((t) => t.destroy());
        this.promptTexts = [];
        this.promptBoxes.forEach((g) => g.destroy());
        this.promptBoxes = [];
        const task = this.state.tasks[this.state.index];
        const color = TEXT_COLOR;
        // A pictured task moves its prompt up so the drawing has room under it (DESIGN-GAP 52).
        const promptY = task.visual ? TASK_LAYOUT.picture.promptY : undefined;
        const prompt = { ...TASK_LAYOUT.prompt, y: promptY ?? TASK_LAYOUT.prompt.y };
        const sentence = input !== 'keypad' ? prompt : { ...TASK_LAYOUT.promptBeside, y: promptY ?? TASK_LAYOUT.promptBeside.y };
        const expression = input !== 'keypad' ? TASK_LAYOUT.expressionWide : TASK_LAYOUT.expression;
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
            const text = this.add
                .text(sentence.x, sentence.y, task.prompt, {
                    ...textStyle('prompt', color),
                    align: 'center',
                    wordWrap: { width: sentence.maxWidth },
                })
                .setOrigin(0.5, 0);
            if (task.visual) {
                // A pictured task's prompt ends above its drawing: a long one steps its font down (visual gate S-13).
                const { promptGap, promptMinSize, promptSizeStep } = TASK_LAYOUT.picture;
                const limit = pictureLayout(TASK_LAYOUT.picture, input, false, visualShape(task.visual)).picture.y - promptGap;
                const size = fitSize(FONT_SIZES.prompt, promptMinSize, promptSizeStep, (s) => text.setFontSize(s).getBounds().bottom <= limit);
                text.setFontSize(size);
            }
            this.promptTexts.push(text);
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
            this.select.clear();   // a wrong set is cleared too
            this.dragState = initialBlockDrag();   // and a wrong build: the mat is emptied
            this.clockState = initialClockSet(this.clockStart);   // and a wrong time: the hands go back to the start
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

    /**
     * "Kolejna runda" on the summary: the unlock card when a step is pending, else a fresh round.
     * DESIGN-GAP (docs/design-gaps.md row 24): the kit shows the card only after "Kolejna runda"; a pending unlock also
     * waits through "Do pokoju" and back, because it lives in the learner (pendingUnlock), not in the summary.
     */
    private startNextRound(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        if (learner.pendingUnlock !== null) {
            // A step was unlocked at the end of the round: the card comes first; "Dalej" starts the round.
            this.unlockShown = true;
            if (this.unlockView() === null) {
                // No card to draw (a step without a child name): never leave the child on the summary; clear it and play on.
                this.closeUnlock();
                return;
            }
            this.render();
            this.autoReadUnlock();
            return;
        }
        this.beginRound();
    }

    /** A fresh round starts; the finished round's stars are already on the balance (syncStars). */
    private beginRound(): void {
        this.state = this.freshRound();
        this.shownIndex = -1;
        this.render();
        this.autoReadFirst();
    }

    /**
     * The tap on "Kolejna runda" was the gesture: the card is read when auto-reading is on.
     * DESIGN-GAP (docs/design-gaps.md row 23): the kit does not say whether the card is read aloud.
     */
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
        // Pictures that did not load (BootScene's record; none recorded = nothing missing): tasks that need them are not drawn.
        const missingIds = (this.registry.get(REGISTRY_KEYS.artHealth) as ArtHealth | undefined)?.missingIds ?? new Set<string>();
        const previous = this.warmup ? getStage(previousStage(this.stage.id) ?? this.stage.id) : undefined;
        if (this.warmup && previous) {
            const rules = { ...balance.round, length: balance.warmup.length };
            const blocked = missingIds.size > 0 ? (skill: SkillDef): boolean => artBlocked(skill, missingIds) : undefined;
            return startRound(buildWarmup(this.stage, previous, this.rng, balance.warmup, balance.tiles.count, balance.round.uniqueRetries, blocked), rules);
        }
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        if (__E2E_HOOK__) {
            // e2e build only: ?e2eSkills=<ids> fills every ordinary round with those skills (ids that cannot be played are ignored).
            const forced = forcedSkills(this.stage, this.registry.get(REGISTRY_KEYS.forcedSkills) as readonly string[] | null | undefined, balance.round.length);
            if (forced) {
                const tasks = distinctTasks(forced, this.rng, (skill) => generateTask(skill, this.rng, { tileCount: balance.tiles.count }), balance.round.uniqueRetries);
                return startRound(tasks, balance.round);
            }
        }
        const previousId = previousStage(this.stage.id);
        const tasks = buildAdaptiveRound(
            this.stage,
            previousId ? getStage(previousId) : undefined,
            learner,
            roundWeights(learner, balance),
            this.rng,
            balance.round,
            balance.tiles.count,
            { missingIds, unlockShare: balance.curriculum.unlockShare },
        );
        return startRound(tasks, balance.round);
    }

    /**
     * The round just finished (once per round: "Do pokoju" and coming back cannot skip or repeat it): core updates mastery
     * and, after an ordinary round, unlocks a step and the easing counters; the warm-up then settles the stage.
     */
    private finishRound(): void {
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        const results = roundResults(this.state);
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
        // The end of a round is saved at once, after the last registry write (the warm-up sets the learner a second time).
        void (this.registry.get(REGISTRY_KEYS.saver) as Pick<Autosaver, 'flush'> | undefined)?.flush('now');
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
        this.warmup = false;
    }

    /** The counter shows the new total at once; the star flies after it without blocking input. */
    private syncStars(before: number, from: { x: number; y: number } | null): void {
        // The only write of the balance in this scene: the round's new stars (a delta) join it.
        const balanceNow = (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
        this.registry.set(REGISTRY_KEYS.stars, earn(balanceNow, this.state.starsEarned - before));
        if (this.state.starsEarned > before && from && !prefersReducedMotion()) {
            this.flyStar(from);
        }
    }

    /** Where the answer was given: the tapped tile, or the OK key of the keypad. */
    private answerSpot(value: unknown): { x: number; y: number } | null {
        const view = roundView(this.state, pl.round.resultLine);
        if (view.input === 'tiles') {
            return this.tiles.targets().find((t) => t.value === value) ?? null;
        }
        if (view.input === 'select') {
            return this.select.okTarget();
        }
        if (view.input === 'drag') {
            return this.clockTask ? this.clockSet.targets()?.ok ?? null : this.blockMat.okTarget();
        }
        return this.keypad.targets().find((k) => k.key === 'ok') ?? null;
    }

    private starBalance(): number {
        return (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
    }

    /** Stars in flight end at once (their tweens would stand still while the scene sleeps). */
    private endFlyingStars(): void {
        this.flyingStars.forEach((star) => {
            this.tweens.killTweensOf(star);
            star.destroy();
        });
        this.flyingStars = [];
    }

    private flyStar(from: { x: number; y: number }): void {
        const to = starCounterTarget();
        // Start above the tapped tile or key so the star never hides the answer.
        const star = this.add.graphics({ x: from.x, y: from.y - ANIMATION.starStartLift });
        drawStar(star, 0, 0, TASK_LAYOUT.starCounter.starRadius, PLACEHOLDER_COLORS.butter);
        this.flyingStars.push(star);
        this.tweens.chain({
            targets: star,
            tweens: [
                { scale: ANIMATION.starPopScale, duration: ANIMATION.starPopMs },
                { x: to.x, y: to.y, scale: 1, duration: ANIMATION.starFlightMs - ANIMATION.starPopMs, ease: 'Sine.easeInOut' },
            ],
            onComplete: () => {
                this.flyingStars = this.flyingStars.filter((flying) => flying !== star);
                star.destroy();
            },
        });
    }

    /** Cost of the next renovation task of the current room, or null when none is left. */
    private nextRoomTaskCost(): number | null {
        const roomId = (this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined) ?? FIRST_ROOM;
        const room = ROOMS[roomId];
        const rooms = this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined;
        const state = rooms?.[roomId];
        return room && state ? nextTaskCost(room, state) : null;
    }

    private currentSummary(): SummaryView | null {
        return summaryView(this.state, { starsTotal: this.starBalance(), nextRoomTaskCost: this.nextRoomTaskCost() });
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
            answer: Array.isArray(task.answer) ? [...task.answer] : task.answer,
            visual: task.visual ? structuredClone(task.visual) : null,
            art: Object.freeze(this.picture.art().map((entry) => Object.freeze({ ...entry }))),
            choices: Object.freeze([...(view.input === 'tiles' || view.input === 'select' ? view.choices : [])]),
            selected: Object.freeze([...this.select.selected()]),
            mat: Object.freeze({ ...this.dragState.mat }),
            carrying: this.dragState.carrying !== null,
            clock: this.clockTask ? Object.freeze({ hour: this.clockState.hour, minute: this.clockState.minute, carrying: this.clockState.carrying }) : null,
            outcomes: Object.freeze([...this.state.outcomes]),
            starsEarned: this.state.starsEarned,
            bonusEarned: this.state.bonusEarned,
            starsTotal: this.starBalance(),
            stars: this.starBalance(),
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
            selectTiles: this.select.targets(),
            selectOk: this.select.okTarget(),
            drag: this.blockMat.targets(),
            clock: this.clockTask ? this.clockSet.targets() : null,
            next: this.bar.nextTarget(),
            step: this.steps.stepTarget(),
            picture: this.picture.bounds(),
            nextRound: this.summary.targets().nextRound,
            toRoom: this.summary.targets().toRoom,
            unlockNext: this.unlockCard.target(),
        });
    }

    /** The reducer geometry of the dial, from the same layout the widget draws (core/round/pictureLayout). */
    private makeClockGeo(): ClockSetGeo {
        const layout = clockSetLayout(TASK_LAYOUT.drag, TASK_LAYOUT.clockSet.dial);
        return { centre: layout.centre, hourLength: layout.hourLength, minuteLength: layout.minuteLength };
    }

    private clockRules(): { snapMinutes: 60 | 5; grabRadius: number; startDistance: number } {
        return { snapMinutes: this.clockSnap, grabRadius: balance.clockSet.grabRadius, startDistance: balance.clockSet.startDistance };
    }

    /** One raw pointer event for the drag reducers (blocks or the clock to set); touches count only while a 'drag' task is open, a cancel or reset always does. */
    private feedDrag(event: BlockDragEvent & ClockSetEvent): void {
        if (!this.dragLive && event.type !== 'cancel' && event.type !== 'reset') {
            return;
        }
        if (this.clockTask) {
            const before = this.clockState;
            this.clockState = stepClockSet(before, event, this.clockGeo, this.clockRules());
            if (this.clockState !== before) {
                this.clockSet.render(this.clockState, this.clockSnap, this.dragLive, this.state.phase !== 'solution');
            }
            return;
        }
        const before = this.dragState;
        this.dragState = stepBlockDrag(before, event, this.dragGeo, balance.blockDrag);
        if (this.dragState !== before) {
            this.blockMat.render(this.dragState, this.dragLive, this.state.phase !== 'solution');
        }
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
