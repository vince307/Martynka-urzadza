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

/** Where a picture of a room sits in the 1920x1080 scene: top-left corner, size, draw order and the part that counts as the object. */
export interface PlacedArt {
    id: string;
    x: number;
    y: number;                // top-left corner of the picture in the scene
    width: number;
    height: number;
    z: number;                // draw order inside the room (0-99); the room controls are drawn above that band
    anchor: [number, number]; // foot of the object inside the picture; pops and shadows grow from here
    visibleRect: [number, number, number, number]; // [left, top, width, height] inside the picture: the object without its margin
}

/** Furniture that is always there once the room is renovated (lamp, plants, pouf): no variants, no task. */
export interface LayerDef extends PlacedArt {
    key: string;              // texture key
}

export interface SlotDef extends PlacedArt {
    variants: [string, string, string]; // texture keys
    /** Variant shown as decoration from the renovation stage until the slot is bought (author decision 2026-10-15: lamp, left plant, pouf show their old look). */
    shownBeforePurchase?: 0 | 1 | 2;
}

/** A renovation task: a background stage (changes the room backdrop, no variant) or a furniture slot (3 variants). */
export type RoomTaskDef =
    | { kind: 'stage'; id: string; label: string; cost: number }
    | { kind: 'slot'; id: string; slot: string; label: string; cost: number };

export interface RoomDef {
    id: string;               // e.g. "salon"
    name: string;
    /** Texture keys of the four full-scene pictures: the room before and after the renovation stage, its neglected furniture and shadows. */
    scene: { before: string; after: string; shadows: string };
    decor: LayerDef[];        // shown once a stage task is done
    slots: SlotDef[];
    tasks: RoomTaskDef[];     // completed in order
    /** Lengths the task list had in earlier builds (the list only grows at its end): a saved `tasksDone` equal to one of them has a room that grew since. Log only. */
    formerTaskCounts?: readonly number[];
    /** The neglected pieces the room shows before its renovation stage, in the style of the renovated room (a graded copy of the real furniture). */
    worn: readonly WornDef[];
    /** Soft shadows under the fixed or default pieces right after the stage, until the room is done. */
    contactShadows: readonly ContactShadowDef[];
}

/** Parameters of a colour grade: sepia and saturation mix, brightness and contrast factors, an offset in 0-255 units. */
export interface GradeParams { sepia: number; saturate: number; brightness: number; contrast: number; lift: number }

/** A piece of the worn set: a slot id (with the variant that stands for it) or a decor id. `soft` marks upholstery, which gets the extra soft grade. */
export interface WornDef { piece: string; variant?: 0 | 1 | 2; soft?: boolean }

/** A contact shadow under a piece: width as a factor of the piece's visible width, offset from the piece's foot. */
export interface ContactShadowDef { piece: string; widthFactor: number; offset: readonly [number, number] }

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

/** Save format, version 3: the shape of version 2 (the change is data: the old 10-task salon is carried over to the 7-task one). */
export interface SaveV3 extends Omit<SaveV2, 'version'> {
    version: 3;
}

/** Save format, version 4: version 3 plus the guard fields a store stamps in its write transaction (a stale tab never overwrites newer progress). */
export interface SaveV4 extends Omit<SaveV3, 'version'> {
    version: 4;
    generation: number;
    writer: string;
}

/** The current save version's shape. */
export type SaveState = SaveV4;
