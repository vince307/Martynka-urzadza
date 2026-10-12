// ROMAN: Roman ↔ Arabic numerals with three tiles, in a clock / floor / plain
// context (ZADANIA.md, section 4; I–XII in E3 and E5).
import { pl } from '../../../data/pl';
import { romanBreakdown, spellRoman, toRoman } from '../../text/roman';
import { numberChoices } from '../distractors';
import type { Generator, Task } from '../types';

export interface RomanParams {
    max: number;   // 12 in E3/E5
}

export const parseRomanParams = (params: Record<string, unknown>): RomanParams => {
    const { max } = params;
    if (!Number.isInteger(max) || (max as number) < 3 || (max as number) > 3999) {
        throw new TypeError(`ROMAN params.max must be an integer in 3..3999, got ${String(max)}`);
    }
    return { max: max as number };
};

export const generateRoman: Generator = (skill, rng): Task => {
    const p = parseRomanParams(skill.params);
    const n = rng.int(1, p.max);
    const roman = toRoman(n);
    const numbers = numberChoices(n, rng, { count: 3, min: 1, max: p.max });
    const { steps, sum } = romanBreakdown(roman);
    const hint = [pl.tasks.romanHint(steps.join(', '), sum)];
    if (rng.chance(0.5)) {
        // Clock and floor contexts only make sense up to 12.
        const first = n <= 12 ? 0 : 2;
        const i = rng.int(first, pl.tasks.romanContexts.length - 1);
        const spelled = spellRoman(roman, pl.tasks.romanLetters);
        return { skillId: skill.id, prompt: pl.tasks.romanContexts[i](roman), speak: pl.tasks.romanSpeakContexts[i](spelled), answer: n, choices: numbers, hint };
    }
    return { skillId: skill.id, prompt: pl.tasks.toRoman(n), answer: roman, choices: numbers.map(toRoman), hint };
};
