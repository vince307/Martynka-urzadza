// Mastery 0..5 per skill, counted from the first try only (docs/ZADANIA.md section 1, "Adaptacja trudności").
import type { Outcome } from './round';
import type { Adaptation, MistakeExample } from './types';

export interface MasteryRules {
    readonly max: number;
    readonly unlockAt: number;
    readonly streakForGain: number;
    readonly gain: number;
    readonly historyLength: number;
}

export interface SkillResult {
    readonly skillId: string;
    readonly outcome: Outcome | null;
    readonly example?: MistakeExample;
}

export function recordRound(adaptation: Adaptation, results: readonly SkillResult[], at: number, rules: MasteryRules): Adaptation {
    const mastery = { ...adaptation.mastery };
    const streak = { ...adaptation.streak };
    const added: Adaptation['history'] = [];
    for (const { skillId, outcome, example } of results) {
        if (outcome === null) continue;
        if (outcome === 'first') {
            const run = (streak[skillId] ?? 0) + 1;
            if (run >= rules.streakForGain) {
                mastery[skillId] = Math.min(rules.max, (mastery[skillId] ?? 0) + rules.gain);
                streak[skillId] = 0;
            } else {
                streak[skillId] = run;
            }
        } else {
            mastery[skillId] = mastery[skillId] ?? 0; // a miss resets the streak and never lowers mastery (maintainer decision H-7, 2026-10-13)
            streak[skillId] = 0;
        }
        added.push({ skillId, ok: outcome !== 'retype', firstTry: outcome === 'first', at, ...(outcome !== 'first' && example ? { example } : {}) });
    }
    const history = [...adaptation.history, ...added].slice(-rules.historyLength);
    return { ...adaptation, mastery, streak, history };
}
