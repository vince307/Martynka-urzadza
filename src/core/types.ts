// Domain types from the design plan (Martynka-urzadza.md, section 5).
// This module must stay free of Phaser imports: everything in src/core is
// pure TypeScript so it can be unit-tested without the engine.

// --- static content ---

export type StageId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';

/** Every way a child can answer; the one source of the `SkillDef.answer` union. `digits` is a digit per box of a written column (S-14b); `playable` lists every mode the scene can answer. */
export const ANSWER_MODES = ['tiles', 'keypad', 'drag', 'select', 'digits'] as const;

export interface SkillDef {
    id: string;               // e.g. "E2.3.add_bridge_9"
    stage: StageId;
    step: number;             // curriculum step within the stage (ZADANIA.md, section 3)
    type: string;             // task type (ZADANIA.md, section 4), e.g. "ADD_SUB"
    params: Record<string, unknown>;
    answer: (typeof ANSWER_MODES)[number];
}

export interface StepDef {
    step: number;             // 1-based order within the stage (ZADANIA.md, section 3)
    title: string;            // author-facing step name (Polish), not shown to the child
    childName?: string;       // short nominative name shown to the child on the "Nowa umiejętność!" card; set on playable steps only
    types: string[];          // task types the catalogue lists for this step
    skills: SkillDef[];       // skills with parameters; empty until a generator exists
    review?: true;            // review step: no own skills, draws from the stage's other steps (S-14c)
}

export interface StageDef {
    id: StageId;
    steps: StepDef[];
}

export interface SlotDef {
    id: string;               // e.g. "sofa"
    x: number;
    y: number;                // position in the 1920×1080 scene
    depth: number;            // draw order
    emptyFrame?: string;      // look before renovation (optional)
    variants: [string, string, string]; // atlas frame keys
}

export interface RoomTaskDef {
    id: string;
    slot: string;             // slot this task furnishes
    label: string;            // text key, e.g. "Wstaw kanapę"
    cost: number;             // stars
}

export interface RoomDef {
    id: string;               // e.g. "salon"
    name: string;
    background: string;       // neglected-state background
    slots: SlotDef[];
    tasks: RoomTaskDef[];     // completed in order
}

/** One entry of the room list shown on the "Pokój gotowy!" card: a room, or a teaser for a room that does not exist yet. */
export type RoomListEntry =
    | { room: string; unlockAfter?: string }
    | { teaser: true; unlockAfter: string };

// --- saved state ---

/** A mistake the parent can read in the progress preview: the first wrong try of a task. Raw JSON-safe values, formatted on display. */
export interface MistakeExample {
    prompt: string;
    given: number | string;
    answer: number | string | number[];
}

export interface LearnerState {
    age: number;
    stage: StageId;
    stageOverriddenByParent: boolean;
    unlockedStep: Record<StageId, number>;  // highest unlocked step per stage
    mastery: Record<string, number>;        // skillId -> 0..5
    streak: Record<string, number>;         // consecutive correct answers
    history: { skillId: string; ok: boolean; firstTry: boolean; at: number; example?: MistakeExample }[]; // last ~200; example only for a miss on the first try
    weakStreak: number;                     // consecutive rounds with fewer than 3 first-try answers
    easedRounds: number;                    // rounds still to be drawn with the easing weights
}

/** The part of the learner that adapts to answers (S-07). */
export type Adaptation = Pick<LearnerState, 'unlockedStep' | 'mastery' | 'streak' | 'history' | 'weakStreak' | 'easedRounds'>;

export interface RoomState {
    tasksDone: number;                      // renovation tasks completed
    chosen: Record<string, 0 | 1 | 2>;      // slot -> chosen variant
}

export interface Settings {
    autoRead: boolean | null;               // parent's choice for reading prompts aloud; null = no choice yet, the stage default applies (FR-009)
}

/** The learner as it is saved: what the game keeps between sessions (S-11). The session-only fields are not in it. */
export type SavedLearner = Pick<
    LearnerState,
    'age' | 'stage' | 'stageOverriddenByParent' | 'unlockedStep' | 'mastery' | 'streak' | 'history' | 'weakStreak' | 'easedRounds'
> & {
    warmupPending: boolean;
    /** A step unlocked in the last round and not yet shown; the stage keeps the card from landing on another stage after a change. */
    pendingUnlock: { stage: StageId; step: number } | null;
};

/** Save format, version 1: what the game really keeps (deviation from plan section 5, change autosave-versioned-save decision 1; no rngSeed). */
export interface SaveV1 {
    version: 1;
    profileId: string;
    stars: number;
    rooms: Record<string, RoomState>;
    currentRoom: string;
    settings: Settings;
    learner: SavedLearner | null;
}

/** What the round variants (minigames, daily puzzle) keep between launches (S-15, save format v2). */
export interface VariantState {
    /** Completed ordinary rounds since the last finished variant (whole number >= 0). */
    roundsSince: number;
    /** The minigame played last, for alternation. */
    lastMinigame: 'word' | 'dice' | null;
    /** Local calendar day ('YYYY-MM-DD') of the last finished daily puzzle. */
    puzzleDay: string | null;
    /** Puzzle ids finished in the current rotation cycle; ids this build does not know are kept. */
    puzzlesDone: string[];
}

/** Save format, version 2: version 1 plus the `variants` block. */
export interface SaveV2 extends Omit<SaveV1, 'version'> {
    version: 2;
    variants: VariantState;
}

/** The current save version's shape. */
export type SaveState = SaveV2;
