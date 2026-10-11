// Domain types from the design plan (Martynka-urzadza.md, section 5).
// This module must stay free of Phaser imports: everything in src/core is
// pure TypeScript so it can be unit-tested without the engine.

// --- static content ---

export type StageId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';

export interface SkillDef {
    id: string;               // e.g. "E2.3.add_bridge_9"
    stage: StageId;
    step: number;             // curriculum step within the stage (ZADANIA.md, section 3)
    type: string;             // task type (ZADANIA.md, section 4), e.g. "ADD_SUB"
    params: Record<string, unknown>;
    answer: 'tiles' | 'keypad' | 'drag' | 'select';
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

// --- saved state ---

export interface LearnerState {
    age: number;
    stage: StageId;
    stageOverriddenByParent: boolean;
    unlockedStep: Record<StageId, number>;  // highest unlocked step per stage
    mastery: Record<string, number>;        // skillId -> 0..5
    streak: Record<string, number>;         // consecutive correct answers
    history: { skillId: string; ok: boolean; firstTry: boolean; at: number }[]; // last ~200
}

export interface RoomState {
    tasksDone: number;                      // renovation tasks completed
    chosen: Record<string, 0 | 1 | 2>;      // slot -> chosen variant
}

export interface Settings {
    autoRead: boolean;                      // read prompts aloud automatically (parent setting)
}

export interface SaveState {
    version: number;
    stars: number;
    learner: LearnerState;
    rooms: Record<string, RoomState>;
    currentRoom: string;
    settings: Settings;
    rngSeed: number;
}
