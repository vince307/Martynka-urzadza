// Tuning numbers of the game as data (plan section 4). Scenes and core take
// these as arguments; later slices extend this object.
export const balance = {
    round: { length: 5, starPerTask: 1, cleanRoundBonus: 2, uniqueRetries: 20 }, // uniqueRetries: redraws of a task whose prompt already appeared in the round (smallest pool 9 prompts, failure odds about 1e-7); PRD FR-006/FR-007: 5 tasks, 1 star each, +2 for a round without a mistake
    warmup: { length: 6, previousCount: 3, currentSteps: 2, minFirstTry: 4 }, // placement warm-up: 3 tasks of the previous stage + 3 of the first 2 playable steps of the current one; fewer than 4 right on the first try lowers the stage by one (ZADANIA section 1 gives no numbers)
    parentGate: { factorMin: 13, factorMax: 19, maxDigits: 3 }, // adult gate: two-digit x two-digit, outside E6 multiplication (6 x 12, 4 x 70); product 169-361
    keypad: { maxDigits: 7 }, // largest answers are 7-digit (E6)
    narrator: { rate: 0.85, voicePollMs: 250, voiceTimeoutMs: 3000, cancelGapMs: 80, autoReadStages: ['E1', 'E2'] }, // speech rate, voice-list polling, pause after cancel (Safari), stages that read tasks aloud by default
    mastery: { max: 5, unlockAt: 4, streakForGain: 3, gain: 1, historyLength: 200 }, // mastery 0..5 per skill from the first try only (ZADANIA section 1 "Adaptacja trudności"): 3 correct first tries in a row = +1, a miss resets the streak and never lowers mastery (maintainer decision 2026-10-13), a step unlocks at >= 4; history keeps the last ~200 answers (plan section 5)
    curriculum: { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 }, // ZADANIA section 1: ~60% current step, ~30% earlier steps, ~10% previous stage; the start step never falls below the 2nd playable step of the stage and follows the school calendar (rule D); a step unlocks when at least ceil(0.5 * n) of its skills reach mastery 4
    easing: { weakBelow: 3, weakRounds: 2, rounds: 2, weights: { current: 20, earlier: 50, previous: 30 } }, // PRD FR-014 / ZADANIA section 1: two rounds in a row with fewer than 3 of 5 right on the first try ease the next 2 rounds; easing = weights 20/50/30 (instead of "smaller range, picture mode")
    parentSettings: { holdMs: 2000, moveTolerance: 30, weakestCount: 3, examplesPerSkill: 2 }, // PRD US-03 AC / FR-015: hold the settings icon 2 s (longer than a child's ordinary press), finger drift up to 30 game px (under half of the 96 px icon), preview shows the 3 weakest skills with up to 2 mistake examples each
    roomHold: { holdMs: 600, moveTolerance: 40 }, // PRD FR-018: a short hold on a furnished item opens the change panel; 600 ms is above the platform press thresholds (Android 400-500 ms, iOS 0.5 s) so a slow tap stays a tap, below the parent's 2 s; 40 game px is about 21 CSS px at 1024 wide, under half of a 96 px target
    tiles: { count: 4 },   // answer tiles per task, including the correct one (kit task-tiles.png shows 4)
} as const;
