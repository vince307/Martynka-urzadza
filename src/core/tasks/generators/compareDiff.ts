// COMPARE_DIFF: "o ile więcej / mniej" between two people (ZADANIA.md,
// section 4, from E3). The answer is the difference, never negative.
import { compareTemplates, contextsFor } from '../../../data/wordTemplates';
import type { Generator, Task } from '../types';
import { pickTwoPeople } from './word';

export interface CompareDiffParams {
    max: number;
}

export const parseCompareDiffParams = (params: Record<string, unknown>): CompareDiffParams => {
    const { max } = params;
    if (!Number.isInteger(max) || (max as number) < 3) {
        throw new TypeError(`COMPARE_DIFF params.max must be an integer >= 3, got ${String(max)}`);
    }
    return { max: max as number };
};

export const generateCompareDiff: Generator = (skill, rng): Task => {
    const p = parseCompareDiffParams(skill.params);
    const a = rng.int(1, p.max);
    let b = rng.int(1, p.max);
    while (b === a) {
        b = rng.int(1, p.max);
    }
    const [person, other] = pickTwoPeople(rng);
    const build = rng.chance(0.5) ? compareTemplates.more : compareTemplates.less;
    const result = build(person, other, a, b, rng.pick(contextsFor({})));
    return { skillId: skill.id, prompt: result.prompt, answer: result.answer, hint: result.hint };
};
