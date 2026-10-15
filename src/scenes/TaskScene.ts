import { Scene, type GameObjects } from 'phaser';
import { initialClockSet, stepClockSet, type ClockSetEvent, type ClockSetGeo, type ClockSetState } from '../core/clockSet';
import { clockSetLayout } from '../core/round/pictureLayout';
import { initialBlockDrag, stepBlockDrag, type BlockDragEvent, type BlockDragState, type Mat } from '../core/blockDrag';
import type { InputSuspender } from '../core/inputSuspend';
import { previousStage, type SessionLearner } from '../core/placement';
import { createRng, type Rng } from '../core/rng';
import { nextTaskCost } from '../core/rooms';
import { earn } from '../core/stars';
import type { RoomState, Settings, SkillDef, StageDef, StageId, VariantState } from '../core/types';
import { answer, next, nextSolutionStep, roundResults, startRound, type RoundState } from '../core/round';
import { isExpression } from '../core/round/prompt';
import { BLANK, fitPieces, splitBlanks, wrapBlankLines } from '../core/round/promptBlank';
import { narrationOf } from '../core/narration/spoken';
import { effectiveAutoRead } from '../core/narration/voice';
import { buildAdaptiveRound, endRound, roundWeights } from '../core/curriculum';
import { pictureMode } from '../core/pictureMode';
import { localDay } from '../core/day';
import { coveredAfter, diceBoard, type DiceThrow } from '../core/minigames/dice';
import { buildWordRound, lettersUncovered, revealed, wordAvailable } from '../core/minigames/word';
import { puzzleTask, puzzlePool } from '../core/puzzles';
import { afterRound, nextRoundKind, pickPuzzle, variantRules, variantTitle, type RoundKind, type VariantKind } from '../core/variants';
import type { ArtHealth } from '../core/artHealth';
import { artBlocked } from '../core/round/artFilter';
import { buildWarmup, warmupResult } from '../core/round/warmup';
import { summaryView, type SummaryView } from '../core/round/summary';
import { roundView } from '../core/round/view';
import { digitBoxCount, startDigitBoxes, stepDigitBoxes, type DigitBoxes } from '../core/round/digitBoxes';
import type { KeypadKey } from '../core/round/keypad';
import { columnMarks } from '../core/tasks/written';
import { dragMode, type DragMode } from '../core/tasks/dragMode';
import { emptyWallet, walletCoins } from '../core/coins';
import { stepTrayDrag, type TrayDragGeo, type TrayDragState } from '../core/trayDrag';
import type { MoneyId } from '../data/measures';
import { coinGeometry, coinLayout, dragGeometry, dragKinds, dragLayout } from '../core/round/dragLayout';
import { answerSpans, belowPrompt, fitSize, hintPictureLayout, pictureLayout } from '../core/round/pictureLayout';
import { distinctTasks } from '../core/round/unique';
import { generateTask } from '../core/tasks/generateTask';
import type { Task } from '../core/tasks/types';
import { visualShape, type AnswerMode, type TaskVisual } from '../core/tasks/visual';
import { getStage } from '../data/curriculum';
import { balance } from '../data/balance';
import {
    ANIMATION,
    FONT_SIZES,
    GAME_EVENTS,
    GAME_HEIGHT,
    MINIGAME_LAYOUT,
    PLACEHOLDER_COLORS,
    PLACEHOLDER_FRAME,
    REGISTRY_KEYS,
    SCENE_KEYS,
    TASK_LAYOUT,
    TEXT_COLOR,
} from '../data/layout';
import { pl } from '../data/pl';
import { MINIGAME_WORDS } from '../data/minigames';
import { PUZZLES } from '../data/puzzles';
import { FIRST_ROOM, ROOMS } from '../data/rooms';
import { E2E_FORCED_FAILURE, forcedSkills } from '../testing/e2eHook';
import { prefersReducedMotion } from '../ui/motion';
import type { Narrator } from '../ui/narrator';
import { drawNotebook } from '../ui/widgets/notebook';
import { AnswerTiles } from '../ui/widgets/AnswerTiles';
import { CoverBoard } from '../ui/widgets/CoverBoard';
import { Dice } from '../ui/widgets/Dice';
import { BlockMat, type BlockMatTargets } from '../ui/widgets/BlockMat';
import { CoinWallet, type CoinWalletTargets } from '../ui/widgets/CoinWallet';
import { ClockSet, type ClockSetTargets } from '../ui/widgets/ClockSet';
import { SelectTiles } from '../ui/widgets/SelectTiles';
import { FeedbackBar } from '../ui/widgets/FeedbackBar';
import { Keypad } from '../ui/widgets/Keypad';
import { LetterTiles } from '../ui/widgets/LetterTiles';
import { MinigameDoneCard } from '../ui/widgets/MinigameDoneCard';
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
    readonly digits: { readonly count: number; readonly filled: readonly number[] } | null;   // the result boxes of a written column ('digits' mode), from the ones; null in any other mode
    readonly correctChoices: readonly (number | string)[] | null;   // the tiles the task's `check` accepts, null for a task without `check`
    readonly markedTile: number | string | null;   // the tile painted as correct now, read from the widget
    readonly hintVisual: TaskVisual['kind'] | null;   // the kind of the hint drawing on screen now (S-14b), else null
    readonly art: readonly { readonly key: string; readonly loaded: boolean }[];   // the art images on screen now, read from the widget (S-14)
    readonly choices: readonly (number | string)[];
    readonly selected: readonly (number | string)[];   // the tiles marked in the 'select' mode
    readonly mat: Readonly<Mat>;   // the blocks on the mat of the 'drag' mode
    readonly carrying: boolean;    // a block is under a finger ('drag' mode)
    readonly dragMode: DragMode | null;   // the branch of the open 'drag' task
    readonly wallet: readonly number[] | null;   // the grosze of every coin in the wallet of a payment task, largest first
    readonly walletCarrying: boolean | null;   // a coin is under a finger (payment task)
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
    readonly variant: { readonly kind: VariantKind; readonly puzzleId: string | null; readonly letters: readonly (string | null)[] | null; readonly covered: readonly number[] | null } | null;   // the open round is a variant (S-15); null for an ordinary round or the warm-up
    readonly today: string;   // the calendar day the scheduler sees
}

export interface TaskTargets {
    readonly tiles: readonly (Point & { value: number | string })[];
    readonly keys: readonly (Point & { key: string })[];
    readonly selectTiles: readonly (Point & { value: number | string })[];
    readonly selectOk: Point | null;
    readonly drag: BlockMatTargets;
    readonly coins: CoinWalletTargets | null;   // the tray, wallet, "OK" and placed coins of a payment task
    readonly clock: ClockSetTargets | null;   // the hand tips, centre and "OK" of a clock to set
    readonly next: Point | null;
    readonly step: Point | null;
    readonly picture: { x: number; y: number; width: number; height: number } | null;   // the drawing's rectangle; the hook aims at its interior
    readonly hintPicture: { x: number; y: number; width: number; height: number } | null;   // the hint number line's rectangle (S-14b)
    readonly nextRound: Point | null;
    readonly toRoom: Point | null;
    readonly doneNext: Point | null;   // "Kolejna runda" of a minigame's done card
    readonly doneRoom: Point | null;
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
    private reported: { index: number; value: unknown } | null = null;   // the right value the child gave for the open task (several right tiles)
    private select!: SelectTiles;
    private blockMat!: BlockMat;
    private dragState: BlockDragState = initialBlockDrag();
    private dragGeo = dragGeometry(dragLayout(TASK_LAYOUT.drag, []), []);
    private clockSet!: ClockSet;
    private clockState: ClockSetState = initialClockSet({ hour: 12, minute: 0 });
    private clockStart = { hour: 12, minute: 0 };
    private clockSnap: 60 | 5 = 60;
    private clockGeo: ClockSetGeo = this.makeClockGeo();
    private coinWallet!: CoinWallet;
    private coinState: TrayDragState<MoneyId> = { mat: emptyWallet(), carrying: null };
    private coinGeo: TrayDragGeo<MoneyId> = coinGeometry(coinLayout(TASK_LAYOUT.coinDrag, []), []);
    private dragKind: DragMode | null = null;   // the branch of the open 'drag' task (core/tasks/dragMode), null while no 'drag' task is open
    private get clockTask(): boolean {
        return this.dragKind === 'clock';
    }
    private dragLive = false;   // the 'drag' task is open and takes the child's touches
    private keypad!: Keypad;
    private boxes: DigitBoxes = startDigitBoxes(0);   // the result boxes of the open 'digits' task
    private bar!: FeedbackBar;
    private steps!: SolutionSteps;
    private picture!: TaskPicture;
    private hintPicture!: TaskPicture;   // the hint number line of an ADD_SUB task (S-14b), apart from the task's own drawing
    private summary!: SummaryPanel;
    private letters!: LetterTiles;
    private diceView!: Dice;
    private board!: CoverBoard;
    private doneCard!: MinigameDoneCard;
    private unlockCard!: UnlockCard;
    private unlockShown = false;   // the "Nowa umiejętność!" card is open: render() draws it instead of the summary
    private promptTexts: GameObjects.Text[] = [];
    private promptBoxes: GameObjects.Graphics[] = [];
    private shownIndex = -1;
    private stage!: StageDef;
    private rng!: Rng;
    private narrator: Narrator | undefined;
    private promptShrunk = false;   // the prompt font was stepped down for the solution lines (fitPromptToSteps)
    private promptBaseSize: number = FONT_SIZES.prompt;   // the size the prompt was drawn at (a long sentence is smaller), restored when the steps close
    private kind: RoundKind = 'round';   // the kind of the open round (S-15); only a started round assigns it
    private puzzleId: string | null = null;
    private word: string | null = null;   // the word of an open 'word' round
    private dice: DiceThrow[] | null = null;   // the throws of an open 'dice' round, in task order
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
        if ((this.dragState.carrying || this.clockState.carrying || this.coinState.carrying) && (this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined)?.suspended()) {
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
        this.registry.set(REGISTRY_KEYS.hudTitle, null);
        this.rng = createRng(Date.now() >>> 0);
        this.kind = 'round';
        this.puzzleId = null;
        this.word = null;
        this.dice = null;
        this.applyRound(this.freshRound());
        this.scene.launch(SCENE_KEYS.ui);
        drawNotebook(this);
        this.picture = new TaskPicture(this);
        this.hintPicture = new TaskPicture(this);
        this.dots = new ProgressDots(this);
        this.tiles = new AnswerTiles(this, (value) => this.submit(value));
        this.select = new SelectTiles(this, (value) => this.submit(value));
        this.keypad = new Keypad(this, balance.keypad.maxDigits, (value) => this.submit(value), (key) => this.pressBoxKey(key));
        this.blockMat = new BlockMat(this, (value) => this.submit(value));
        this.coinWallet = new CoinWallet(this, (grosze) => this.submit(grosze));
        // "OK" under a second finger while a hand is still held is ignored: the held pose is not settled yet, and
        // ending the task would cancel the grab and draw the hands back to the pose before it (impl review).
        this.clockSet = new ClockSet(this, (value) => {
            if (this.clockState.carrying === null) this.submit(value);
        });
        this.clockState = initialClockSet(this.clockStart);
        this.dragKind = null;
        this.dragState = initialBlockDrag();
        this.coinState = { mat: emptyWallet(), carrying: null };
        this.dragLive = false;
        // The whole scene feeds raw pointer events to the drag reducer of the task (core/blockDrag, core/clockSet or the coin wallet over core/trayDrag, chosen by dragMode); it acts only while a 'drag' task takes touches.
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
        this.doneCard = new MinigameDoneCard(this, () => this.startNextRound(), () => this.game.events.emit(GAME_EVENTS.toRoom));
        this.letters = new LetterTiles(this);
        this.diceView = new Dice(this);
        this.board = new CoverBoard(this, balance.variants.dice.max + 1, (value) => this.submit(value));
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
            this.registry.set(REGISTRY_KEYS.hudTitle, null);   // render() puts it back on wake
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
        this.applyRound(this.freshRound());
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
        this.registry.set(REGISTRY_KEYS.hudTitle, variantTitle(this.kind, pl.minigames));
        this.registry.set(REGISTRY_KEYS.roomSwitch, view.switchVisible);
        const summary = this.currentSummary();
        const unlock = this.unlockView();
        if (unlock) {
            // The card comes before the summary: nothing may redraw the summary over it.
            this.registry.set(REGISTRY_KEYS.roomSwitch, false);
            this.registry.set(REGISTRY_KEYS.narration, pl.unlock.spoken(unlock.name));
            this.hideTaskLayer(view.input);
            this.summary.hide();
            this.doneCard.hide();
            this.unlockCard.show(unlock.name);
            return;
        }
        this.unlockCard.hide();
        if (summary) {
            // The round is over: the notebook stays, the task layer gives way to the summary page.
            this.registry.set(REGISTRY_KEYS.narration, null);
            this.narrator?.cancel();
            this.hideTaskLayer(view.input);
            if (this.kind === 'word' && this.word !== null) {
                // The minigame ends on its own card with the uncovered word instead of the summary page.
                this.summary.hide();
                this.doneCard.show({ title: pl.round.correct, line: this.word, earned: summary.earned, roomHighlighted: summary.roomHighlighted });
            } else if (this.kind === 'dice' && this.dice !== null) {
                this.summary.hide();
                this.doneCard.show({ title: pl.round.correct, line: pl.minigames.diceAllCovered, earned: summary.earned, roomHighlighted: summary.roomHighlighted });
            } else {
                this.doneCard.hide();
                this.summary.show(summary);
            }
            return;
        }
        this.summary.hide();
        this.doneCard.hide();
        if (this.kind === 'word' && this.word !== null) {
            this.letters.show(revealed(this.word, lettersUncovered(this.state.outcomes)));
        } else {
            this.letters.hide();
        }
        const diceRound = this.kind === 'dice' && this.dice !== null;
        if (diceRound && this.dice) {
            this.board.show(this.coveredNow(), this.state.phase === 'retype' ? (this.state.tasks[this.state.index].answer as number) : null);
        } else {
            this.diceView.hide();
            this.board.hide();
        }
        this.registry.set(REGISTRY_KEYS.narration, this.currentNarration());
        // A variant has the HUD title in the dots' place (kit minigame screens): the letters or the board show its progress.
        this.dots.update(this.kind === 'round' ? view.dots : []);
        const task0 = this.state.tasks[this.state.index];
        if (this.shownIndex !== this.state.index) {
            this.shownIndex = this.state.index;
            this.drawPrompt(view.input);
            this.keypad.reset();
            this.boxes = view.input === 'digits' ? startDigitBoxes(digitBoxCount(task0)) : startDigitBoxes(0);
            if (diceRound && this.dice) {
                const thrown = this.dice[this.state.index];
                this.diceView.show({ a: thrown.a, b: thrown.b, op: thrown.op });
            }
            if (view.input === 'tiles' && !diceRound) {
                this.tiles.setChoices(view.choices, answerSpans(TASK_LAYOUT.picture, view.input, task0.visual ? visualShape(task0.visual) : 'wide').tiles ?? undefined);
            }
            if (view.input === 'select') {
                this.select.setChoices(view.choices);
            }
            // A new task starts with an empty mat and nothing in the air.
            this.dragState = initialBlockDrag();
            this.coinState = { mat: emptyWallet(), carrying: null };
            this.dragKind = view.input === 'drag' ? dragMode(task0) : null;
            if (this.clockTask && task0.visual?.kind === 'clock') {
                this.clockStart = { hour: task0.visual.hour, minute: task0.visual.minute };
                this.clockSnap = task0.visual.snap ?? 60;
                this.clockState = initialClockSet(this.clockStart);
            }
            // Only the blocks branch of 'drag' has a tray; the branch comes from the drawing (core/tasks/dragMode), not from the answer's type.
            const kinds = this.dragKind === 'blocks' ? dragKinds(typeof task0.answer === 'number' ? task0.answer : 0) : [];
            const layout = dragLayout(TASK_LAYOUT.drag, kinds);
            this.dragGeo = dragGeometry(layout, kinds);
            this.blockMat.setLayout(layout, kinds);
            const coinKinds = this.dragKind === 'coins' && task0.visual?.kind === 'money' && task0.visual.pay ? task0.visual.pay.tray : [];
            const coins = coinLayout(TASK_LAYOUT.coinDrag, coinKinds);
            this.coinGeo = coinGeometry(coins, coinKinds);
            this.coinWallet.setLayout(coins, coinKinds);
        }
        const task = this.state.tasks[this.state.index];
        // DESIGN-GAP 52 and 57 (docs/design-gaps.md): the picture area and the solution lines beside it come from pictureLayout.
        const solutionShown = view.bar.kind === 'solution';
        const layout = pictureLayout(TASK_LAYOUT.picture, view.input, solutionShown, view.visual ? visualShape(view.visual) : 'wide');
        // A prompt too long for its room never runs over the drawing: the drawing gives way under it (visual gate S-13).
        const pictureRect = view.visual ? belowPrompt(layout.picture, this.promptBottom(), TASK_LAYOUT.picture.promptGap, TASK_LAYOUT.picture.minHeight) : layout.picture;
        const columnState = view.visual?.kind === 'column' ? { marks: columnMarks(view.visual, this.marksShown()), boxes: this.boxes, mode: this.state.phase === 'done' ? ('correct' as const) : view.inputActive ? ('active' as const) : ('locked' as const) } : undefined;
        this.picture.render(this.dragKind === 'clock' || this.dragKind === 'coins' ? null : view.visual, pictureRect, columnState);   // a clock to set is drawn by ClockSet, a payment by CoinWallet
        // S-14b: after a first miss a keypad task with a hint drawing shows it under the expression (DESIGN-GAP 92, docs/design-gaps.md).
        const hintLayout = view.hintPicture && !view.visual ? hintPictureLayout(TASK_LAYOUT.picture, view.input) : null;
        this.hintPicture.render(view.hintPicture && hintLayout ? view.hintPicture : null, hintLayout ? hintLayout.picture : pictureRect);
        const finishedTask = this.state.phase === 'done';
        const shows = this.widgetsOf(view.input);
        this.tiles.setVisible(shows.tiles && !diceRound);
        this.keypad.setKeyMode(view.input === 'digits');
        this.keypad.setVisible(shows.keypad);
        this.select.setVisible(shows.select);
        this.dragLive = view.input === 'drag' && view.inputActive;
        if (!this.dragLive && this.dragState.carrying) {
            this.dragState = { mat: this.dragState.mat, carrying: null };
        }
        if (!this.dragLive && this.clockState.carrying) {
            this.clockState = stepClockSet(this.clockState, { type: 'cancel' }, this.clockGeo, this.clockRules());
        }
        if (!this.dragLive && this.coinState.carrying) {
            this.coinState = { mat: this.coinState.mat, carrying: null };
        }
        this.blockMat.setVisible(view.input === 'drag' && this.dragKind === 'blocks');
        this.clockSet.setVisible(view.input === 'drag' && this.dragKind === 'clock');
        this.coinWallet.setVisible(view.input === 'drag' && this.dragKind === 'coins');
        if (view.input === 'drag') {
            const trayShown = view.bar.kind !== 'solution';
            switch (this.dragKind) {
                case 'clock': this.clockSet.render(this.clockState, this.clockSnap, this.dragLive, trayShown); break;
                case 'coins': this.coinWallet.render(this.coinState, this.dragLive, trayShown); break;
                case 'blocks': this.blockMat.render(this.dragState, this.dragLive, trayShown); break;
                case null: break;
                default: { const unreachable: never = this.dragKind; return unreachable; }
            }
        }
        this.select.setActive(view.input === 'select' && view.inputActive);
        this.tiles.setActive(view.input === 'tiles' && !diceRound && view.inputActive);
        this.board.setActive(diceRound && view.inputActive);
        this.keypad.setActive(shows.keypad && view.inputActive);
        if (finishedTask) {
            // DESIGN-GAP (docs/design-gaps.md row 98): a task with several right tiles lights the tile the child tapped, not the canonical one.
            const tapped = this.reported !== null && this.reported.index === this.state.index && task.check ? this.reported.value : null;
            this.tiles.markCorrect(view.input === 'tiles' && !diceRound ? ((tapped ?? task.answer) as number | string) : null);
            this.keypad.markCorrect();
            this.select.markCorrect(view.input === 'select' ? (task.answer as number[]) : []);
        }
        this.tiles.markHint(view.bar.kind === 'retype' && view.input === 'tiles' && !diceRound ? (task.answer as number | string) : null);
        this.select.markHint(view.bar.kind === 'retype' && view.input === 'select' ? (task.answer as number[]) : []);
        this.bar.update(view.bar, view.input, answerSpans(TASK_LAYOUT.picture, view.input, view.visual ? visualShape(view.visual) : 'wide').bar ?? undefined);
        if (view.bar.kind === 'solution') {
            // Steps sit under the expression, on its centre line (kit .equation holds the solution lines).
            // A drawing keeps its place and the lines take the rectangle beside or below it (DESIGN-GAP 57).
            const lines = view.input === 'drag' ? TASK_LAYOUT.drag.solutionLines : view.visual ? layout.lines : hintLayout ? hintLayout.lines : null;
            if (diceRound) {
                // Above the dice: the board below them keeps its place (DESIGN-GAP 86).
                const above = MINIGAME_LAYOUT.dice;
                this.steps.show(view.bar, above.centerX, above.solutionTop, TASK_LAYOUT.prompt.maxWidth, above.solutionLimit);
            } else if (lines) {
                this.steps.show(view.bar, lines.x + lines.width / 2, lines.y, lines.width, lines.y + lines.height);
            } else {
                const beside = view.input === 'keypad';
                const centerX = (beside ? TASK_LAYOUT.expression : TASK_LAYOUT.expressionWide).x;
                const maxWidth = TASK_LAYOUT.barSpan[beside ? 'keypad' : 'tiles'].width;   // same width as the bar under them
                // The lines stop above the answer tiles (select tiles sit higher than single-answer tiles); beside the keypad they stop above the bar zone.
                const limit = view.input === 'select' || view.input === 'tiles' ? (view.input === 'select' ? TASK_LAYOUT.select.top : TASK_LAYOUT.tiles.top) - TASK_LAYOUT.solution.bottomGap : undefined;
                const top = (): number => this.promptBottom() + TASK_LAYOUT.solution.topGap;
                const bar = view.bar;
                this.fitPromptToSteps(task, (): boolean => this.steps.fits(bar, top(), maxWidth, limit));
                this.steps.show(view.bar, centerX, top(), maxWidth, limit);
            }
        } else {
            this.steps.hide();
            this.fitPromptToSteps(task, null);
        }
    }

    /**
     * A plain sentence prompt (no drawing, no expression, no "□") steps its font down from the size it was drawn at while
     * the solution lines would not fit under it at their smallest scale (visual gate S-15: a daily puzzle of 5-9 lines),
     * and gets that size back when the steps close. `fits` null restores it.
     */
    private fitPromptToSteps(task: Task, fits: (() => boolean) | null): void {
        const [text] = this.promptTexts;
        if (task.visual || isExpression(task.prompt) || this.promptTexts.length !== 1 || this.promptBoxes.length > 0 || !text) {
            return;
        }
        if (fits === null) {
            if (this.promptShrunk) {
                text.setFontSize(this.promptBaseSize);
                this.promptShrunk = false;
            }
            return;
        }
        const { promptMinSize, promptSizeStep } = TASK_LAYOUT.picture;
        const size = fitSize(this.promptBaseSize, promptMinSize, promptSizeStep, (s) => {
            text.setFontSize(s);
            return fits();
        });
        text.setFontSize(size);
        this.promptShrunk = size !== this.promptBaseSize;
    }

    /** Hides everything of the task layer (dots, answers, bar, steps, prompt) for a page drawn over the notebook. */
    private hideTaskLayer(input: AnswerMode): void {
        this.dots.update([]);
        this.letters.hide();
        this.diceView.hide();
        this.board.hide();
        this.dragLive = false;
        this.blockMat.setVisible(false);
        this.clockSet.setVisible(false);
        this.coinWallet.setVisible(false);
        this.tiles.setVisible(false);
        this.select.setVisible(false);
        this.select.setActive(false);
        this.keypad.setVisible(false);
        this.tiles.setActive(false);
        this.keypad.setActive(false);
        this.bar.update({ kind: 'none' }, input);
        this.steps.hide();
        this.picture.hide();
        this.hintPicture.hide();
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
        this.promptShrunk = false;
        this.promptBaseSize = FONT_SIZES.prompt;
        if (this.kind === 'dice') {
            return;   // the dice are drawn by Dice; there is no prompt text
        }
        const task = this.state.tasks[this.state.index];
        const color = TEXT_COLOR;
        // A pictured task moves its prompt up so the drawing has room under it (DESIGN-GAP 52).
        // A word round has the letters above the task: a sentence starts lower and an expression stands alone under them (DESIGN-GAP 85).
        const wordRound = this.kind === 'word';
        const promptY = task.visual ? TASK_LAYOUT.picture.promptY : wordRound ? MINIGAME_LAYOUT.promptY : undefined;
        const prompt = { ...TASK_LAYOUT.prompt, y: promptY ?? TASK_LAYOUT.prompt.y };
        const beside = this.widgetsOf(input).keypad;   // the keypad sits right of the prompt
        const sentence = !beside ? prompt : { ...TASK_LAYOUT.promptBeside, y: promptY ?? TASK_LAYOUT.promptBeside.y };
        const expression = wordRound ? { ...TASK_LAYOUT.expressionWide, y: MINIGAME_LAYOUT.expressionY } : !beside ? TASK_LAYOUT.expressionWide : TASK_LAYOUT.expression;
        // DESIGN-GAP 8 (resolved): the kit has no missing-number frame and the font has no U+25A1, so every "□" is
        // drawn as an outlined box between text pieces (docs/design-gaps.md row 8). The task data keeps "□".
        if (isExpression(task.prompt)) {
            if (!wordRound) {
                this.promptTexts.push(
                    this.add
                        .text(prompt.x, prompt.y, pl.round.calculate, textStyle('prompt', color))
                        .setOrigin(0.5),
                );
            }
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
            const { promptGap, promptMinSize, promptSizeStep } = TASK_LAYOUT.picture;
            if (task.visual) {
                // A pictured task's prompt ends above its drawing: a long one steps its font down (visual gate S-13).
                const limit = pictureLayout(TASK_LAYOUT.picture, input, false, visualShape(task.visual)).picture.y - promptGap;
                const size = fitSize(FONT_SIZES.prompt, promptMinSize, promptSizeStep, (s) => text.setFontSize(s).getBounds().bottom <= limit);
                text.setFontSize(size);
            } else if (input === 'keypad' || input === 'tiles') {
                // A long sentence (a daily puzzle) ends above the hint bar beside the keypad or above the answer tiles (visual gate S-15).
                const { bar, solution, tiles } = TASK_LAYOUT;
                const limit = input === 'keypad' ? bar.bottom - bar.height - solution.bottomGap : tiles.top - solution.bottomGap;
                const size = fitSize(FONT_SIZES.prompt, promptMinSize, promptSizeStep, (s) => text.setFontSize(s).getBounds().bottom <= limit);
                text.setFontSize(size);
                this.promptBaseSize = size;
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
    private drawExpression(text: string, at: Point & { maxWidth: number }, color: string): void {
        const blank = TASK_LAYOUT.blank;
        const pieces = splitBlanks(text);
        const made = pieces.map((p) =>
            p.kind === 'text' ? this.add.text(0, 0, p.text, textStyle('expression', color)).setOrigin(0, 0.5) : null,
        );
        // A long expression shrinks to its room (visual gate S-14c: an E6.9 decomposition ran under the keypad).
        const { placed, scale } = fitPieces(pieces, (_t, i) => made[i]?.width ?? 0, blank.width, blank.gap, at.maxWidth);
        placed.forEach(({ piece, left, width }, i) => {
            const t = made[i];
            if (piece.kind === 'text' && t) {
                t.setScale(scale).setPosition(at.x + left, at.y);
                this.promptTexts.push(t);
            } else {
                const box = this.add.graphics({ x: at.x + left + width / 2, y: at.y });
                box.lineStyle(blank.lineWidth * scale, parseInt(color.slice(1), 16), 1);
                box.strokeRoundedRect(-width / 2, (-blank.height * scale) / 2, width, blank.height * scale, blank.radius * scale);
                this.promptBoxes.push(box);
            }
        });
    }

    /** A tile or the keypad's OK handed in an answer: core decides, the scene redraws. */
    private submit(value: unknown): void {
        const before = this.state.starsEarned;
        const open = this.state.tasks[this.state.index];
        this.reported = open?.check?.(value) ? { index: this.state.index, value } : null;
        this.state = answer(this.state, value);
        this.syncStars(before, this.answerSpot(value));
        if (this.state.phase !== 'done') {
            this.keypad.reset();   // a wrong number is cleared; the tiles keep their place
            this.boxes = startDigitBoxes(this.boxes.count);   // and wrong digits: every box is emptied, so the right ones are not given away
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
        this.applyRound(this.freshRound());
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

    /** The one place a built round becomes the open one: freshRound() commits nothing, so a throw while building leaves the old round whole. */
    private applyRound(round: { kind: RoundKind; state: RoundState; puzzleId?: string; word?: string; dice?: DiceThrow[] }): void {
        this.state = round.state;
        this.kind = round.kind;
        this.puzzleId = round.puzzleId ?? null;
        this.word = round.word ?? null;
        this.dice = round.dice ?? null;
    }

    /** The results covered so far: one per finished throw (a throw settled by the solution and retyping counts too). */
    private coveredNow(): number[] {
        return this.dice ? coveredAfter(this.dice, lettersUncovered(this.state.outcomes)) : [];
    }

    /** The calendar day, as the scheduler sees it (main.ts owns the clock). */
    private today(): string {
        const read = this.registry.get(REGISTRY_KEYS.today) as (() => string) | undefined;
        return read ? read() : localDay(new Date());
    }

    /** The kind of the next round: a variant replaces only an adaptive round (the warm-up and ?e2eSkills come first). Pure: the counter changes in finishRound. */
    private nextKind(): RoundKind {
        const variants = this.registry.get(REGISTRY_KEYS.variants) as VariantState;
        const forced = __E2E_HOOK__ ? ((this.registry.get(REGISTRY_KEYS.forcedVariant) as VariantKind | 'off' | null | undefined) ?? undefined) : undefined;
        return nextRoundKind(variants, {
            stageId: this.stage.id,
            today: this.today(),
            hasPool: (stageId) => puzzlePool(stageId as StageId, PUZZLES, balance.variants.puzzleStages).length > 0,
            minigames: balance.variants.minigames,
            wordAvailable: wordAvailable(this.stage, this.previousStageDef(), this.learnerAdaptation(), MINIGAME_WORDS),
            rules: balance.variants,
            forced,
        });
    }

    private previousStageDef(): StageDef | undefined {
        const id = previousStage(this.stage.id);
        return id ? getStage(id) : undefined;
    }

    private learnerAdaptation(): SessionLearner {
        return this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
    }

    private freshRound(): { kind: RoundKind; state: RoundState; puzzleId?: string; word?: string; dice?: DiceThrow[] } {
        // Pictures that did not load (BootScene's record; none recorded = nothing missing): tasks that need them are not drawn.
        const missingIds = (this.registry.get(REGISTRY_KEYS.artHealth) as ArtHealth | undefined)?.missingIds ?? new Set<string>();
        const previous = this.warmup ? getStage(previousStage(this.stage.id) ?? this.stage.id) : undefined;
        if (this.warmup && previous) {
            const rules = { ...balance.round, length: balance.warmup.length };
            const blocked = missingIds.size > 0 ? (skill: SkillDef): boolean => artBlocked(skill, missingIds) : undefined;
            return { kind: 'round', state: startRound(buildWarmup(this.stage, previous, this.rng, balance.warmup, balance.tiles.count, balance.round.uniqueRetries, blocked), rules) };
        }
        const learner = this.registry.get(REGISTRY_KEYS.learner) as SessionLearner;
        if (__E2E_HOOK__) {
            // e2e build only: ?e2eSkills=<ids> fills every ordinary round with those skills (ids that cannot be played are ignored).
            const forced = forcedSkills(this.stage, this.registry.get(REGISTRY_KEYS.forcedSkills) as readonly string[] | null | undefined, balance.round.length);
            if (forced) {
                const tasks = distinctTasks(forced, this.rng, (skill) => generateTask(skill, this.rng, { tileCount: balance.tiles.count }), balance.round.uniqueRetries);
                return { kind: 'round', state: startRound(tasks, balance.round) };
            }
        }
        const kind = this.nextKind();
        if (kind === 'puzzle') {
            const variants = this.registry.get(REGISTRY_KEYS.variants) as VariantState;
            const pool = puzzlePool(this.stage.id, PUZZLES, balance.variants.puzzleStages);
            const puzzle = pickPuzzle(pool, variants.puzzlesDone, this.rng);
            return { kind, state: startRound([puzzleTask(puzzle)], variantRules(kind, 1, balance)), puzzleId: puzzle.id };
        }
        if (kind === 'word') {
            const built = buildWordRound(this.stage, this.previousStageDef(), learner, this.rng, { tiles: balance.variants.word.tiles, uniqueRetries: balance.round.uniqueRetries, words: MINIGAME_WORDS });
            if (built) {
                return { kind, state: startRound(built.tasks, variantRules(kind, built.tasks.length, balance)), word: built.word };
            }
        }
        // A word round that cannot be drawn falls to the dice board when it is on (plan phase 6), so the due variant is not
        // replaced by an ordinary round that would keep the counter due and pick the word round again.
        if (kind === 'dice' || (kind === 'word' && balance.variants.minigames.includes('dice'))) {
            const board = diceBoard(this.rng, balance.variants.dice, {
                addHint: pl.minigames.diceAddHint,
                subHint: pl.minigames.diceSubHint,
                addStepHint: pl.minigames.diceAddStepHint,
                subStepHint: pl.minigames.diceSubStepHint,
            });
            return { kind: 'dice', state: startRound(board.map((t) => t.task), variantRules('dice', board.length, balance)), dice: board };
        }
        // A variant that cannot be built (a word round without a fitting word, dice off) is an ordinary round.
        const previousId = previousStage(this.stage.id);
        const month = this.registry.get(REGISTRY_KEYS.month) as number | undefined;
        const tasks = buildAdaptiveRound(
            this.stage,
            previousId ? getStage(previousId) : undefined,
            learner,
            roundWeights(learner, balance),
            this.rng,
            balance.round,
            balance.tiles.count,
            { missingIds, unlockShare: balance.curriculum.unlockShare },
            { picture: month !== undefined && pictureMode(learner, month) },
        );
        return { kind: 'round', state: startRound(tasks, balance.round) };
    }

    /**
     * The round just finished (once per round: "Do pokoju" and coming back cannot skip or repeat it): core updates mastery
     * and, after an ordinary round, unlocks a step and the easing counters; the warm-up then settles the stage.
     */
    private finishRound(): void {
        if (this.kind !== 'round') {
            this.finishVariant(this.kind);
            return;
        }
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
        } else {
            this.countRound('round');   // the warm-up is not an ordinary round for the schedule
        }
        // The end of a round is saved at once, after the last registry write (the warm-up sets the learner a second time).
        void (this.registry.get(REGISTRY_KEYS.saver) as Pick<Autosaver, 'flush'> | undefined)?.flush('now');
    }

    /**
     * A variant ends: the schedule moves on (counter back to 0, today's puzzle recorded) and nothing else changes.
     * No endRound: the variant never touches mastery, unlocks or the easing counters. One registry write, then the save.
     */
    private finishVariant(kind: VariantKind): void {
        this.countRound(kind);
        void (this.registry.get(REGISTRY_KEYS.saver) as Pick<Autosaver, 'flush'> | undefined)?.flush('now');
    }

    /** The pure schedule step (core/variants afterRound) and its single registry write. */
    private countRound(kind: RoundKind): void {
        const variants = this.registry.get(REGISTRY_KEYS.variants) as VariantState;
        const poolIds = puzzlePool(this.stage.id, PUZZLES, balance.variants.puzzleStages).map((p) => p.id);
        const puzzle = kind === 'puzzle' && this.puzzleId !== null ? { id: this.puzzleId, poolIds } : undefined;
        this.registry.set(REGISTRY_KEYS.variants, afterRound(variants, kind, this.today(), puzzle));
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
        if (this.kind === 'dice') {
            return this.board.targets().find((t) => t.value === value) ?? null;
        }
        switch (view.input) {
            case 'tiles': return this.tiles.targets().find((t) => t.value === value) ?? null;
            case 'select': return this.select.okTarget();
            case 'drag':
                switch (this.dragKind) {
                    case 'clock': return this.clockSet.targets()?.ok ?? null;
                    case 'coins': return this.coinWallet.okTarget();
                    case 'blocks': case null: return this.blockMat.okTarget();
                    default: { const unreachable: never = this.dragKind; return unreachable; }
                }
            case 'keypad': case 'digits': return this.keypad.targets().find((k) => k.key === 'ok') ?? null;
            default: { const unreachable: never = view.input; return unreachable; }
        }
    }

    /** Which input widgets an answer mode shows; the one place that maps a mode to its widgets (the switch is exhaustive). */
    private widgetsOf(input: AnswerMode): { tiles: boolean; keypad: boolean; select: boolean } {
        switch (input) {
            case 'tiles': return { tiles: true, keypad: false, select: false };
            case 'keypad': case 'digits': return { tiles: false, keypad: true, select: false };
            case 'select': return { tiles: false, keypad: false, select: true };
            case 'drag': return { tiles: false, keypad: false, select: false };
            default: { const unreachable: never = input; return unreachable; }
        }
    }

    /** The signs of a written column's method: none on the first try, the first carry or borrow in the hint, all of them once the solution is shown. */
    private marksShown(): 'none' | 'first' | 'all' {
        switch (this.state.phase) {
            case 'first': return 'none';
            case 'second': return 'first';
            case 'solution': case 'retype': return 'all';
            case 'done': return this.state.outcomes[this.state.index] === 'first' ? 'none' : 'all';
            default: { const unreachable: never = this.state.phase; return unreachable; }
        }
    }

    /** A key of the keypad in key mode: core fills the boxes; a full row sent with "OK" is the answer. */
    private pressBoxKey(key: KeypadKey): void {
        const result = stepDigitBoxes(this.boxes, key);
        this.boxes = result.state;
        if (result.submit !== null) {
            this.submit(result.submit);
        } else {
            this.render();
        }
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
            digits: view.input === 'digits' ? Object.freeze({ count: this.boxes.count, filled: Object.freeze([...this.boxes.digits]) }) : null,
            answer: Array.isArray(task.answer) ? [...task.answer] : task.answer,
            visual: task.visual ? structuredClone(task.visual) : null,
            correctChoices: task.check && view.input === 'tiles' ? Object.freeze(view.choices.filter((c) => task.check?.(c))) : null,
            markedTile: this.tiles.markedValue(),
            hintVisual: view.hintPicture ? view.hintPicture.kind : null,
            art: Object.freeze(this.picture.art().map((entry) => Object.freeze({ ...entry }))),
            choices: Object.freeze([...(view.input === 'tiles' || view.input === 'select' ? view.choices : [])]),
            selected: Object.freeze([...this.select.selected()]),
            mat: Object.freeze({ ...this.dragState.mat }),
            carrying: this.dragState.carrying !== null,
            clock: this.clockTask ? Object.freeze({ hour: this.clockState.hour, minute: this.clockState.minute, carrying: this.clockState.carrying }) : null,
            dragMode: this.dragKind,
            wallet: this.dragKind === 'coins' ? Object.freeze(walletCoins(this.coinState.mat)) : null,
            walletCarrying: this.dragKind === 'coins' ? this.coinState.carrying !== null : null,
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
            variant: this.kind === 'round' ? null : Object.freeze({ kind: this.kind, puzzleId: this.puzzleId, letters: this.word === null ? null : Object.freeze(this.letters.letters()), covered: this.dice === null ? null : Object.freeze(this.board.coveredValues()) }),
            today: this.today(),
        });
    }

    /** Centres of the tappable things in 1920x1080 scene space, for the e2e hook. */
    targets(): TaskTargets {
        return Object.freeze({
            tiles: this.kind === 'dice' ? this.board.targets() : this.tiles.targets(),   // a dice round answers on the board's fields
            keys: this.keypad.targets(),
            selectTiles: this.select.targets(),
            selectOk: this.select.okTarget(),
            drag: this.blockMat.targets(),
            clock: this.clockTask ? this.clockSet.targets() : null,
            coins: this.dragKind === 'coins' ? this.coinWallet.targets() : null,
            next: this.bar.nextTarget(),
            step: this.steps.stepTarget(),
            picture: this.picture.bounds(),
            hintPicture: this.hintPicture.bounds(),
            nextRound: this.summary.targets().nextRound,
            toRoom: this.summary.targets().toRoom,
            doneNext: this.doneCard.targets().nextRound,
            doneRoom: this.doneCard.targets().toRoom,
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

    /** One raw pointer event for the drag reducers (blocks, the clock to set or coins to pay); touches count only while a 'drag' task is open, a cancel or reset always does. */
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
        if (this.dragKind === 'coins') {
            const before = this.coinState;
            this.coinState = stepTrayDrag(before, event, this.coinGeo, balance.coinDrag);
            if (this.coinState !== before) {
                this.coinWallet.render(this.coinState, this.dragLive, this.state.phase !== 'solution');
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
