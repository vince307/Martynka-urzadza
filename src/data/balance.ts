// Tuning numbers of the game as data (plan section 4). Scenes and core take
// these as arguments; later slices extend this object.
export const balance = {
    round: { length: 5, starPerTask: 1, cleanRoundBonus: 2 }, // PRD FR-006/FR-007: 5 tasks, 1 star each, +2 for a round without a mistake
    warmup: { length: 6, previousCount: 3, currentSteps: 2, minFirstTry: 4 }, // placement warm-up: 3 tasks of the previous stage + 3 of the first 2 playable steps of the current one; fewer than 4 right on the first try lowers the stage by one (ZADANIA section 1 gives no numbers)
    parentGate: { factorMin: 13, factorMax: 19, maxDigits: 3 }, // adult gate: two-digit x two-digit, outside E6 multiplication (6 x 12, 4 x 70); product 169-361
    keypad: { maxDigits: 7 }, // largest answers are 7-digit (E6)
    narrator: { rate: 0.85, voicePollMs: 250, voiceTimeoutMs: 3000, cancelGapMs: 80, autoReadStages: ['E1', 'E2'] }, // speech rate, voice-list polling, pause after cancel (Safari), stages that read tasks aloud by default
    mastery: { max: 5, unlockAt: 4, streakForGain: 3, gain: 1, loss: 1, historyLength: 200 }, // mastery 0..5 per skill from the first try only (ZADANIA section 1 "Adaptacja trudności"): 3 correct in a row = +1, a miss = -1, a step unlocks at >= 4; history keeps the last ~200 answers (plan section 5)
    tiles: { count: 4 },   // answer tiles per task, including the correct one (kit task-tiles.png shows 4)
} as const;
