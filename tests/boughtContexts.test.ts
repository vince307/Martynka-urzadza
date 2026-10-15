// "Kupił jeszcze 2 złote" (teacher read of S-14d): a story that buys something only takes contexts with a price.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { generateChooseOp } from '../src/core/tasks/generators/chooseOp';
import { generateCompareDiff } from '../src/core/tasks/generators/compareDiff';
import { generateWord } from '../src/core/tasks/generators/word';
import { contexts, people, templates } from '../src/data/wordTemplates';
import type { SkillDef } from '../src/core/types';

const BUYS = /kupi[łl]/;
const skill = (type: string, params: Record<string, unknown>): SkillDef => ({ id: `x.${type}`, stage: 'E1', step: 3, type, params, answer: 'tiles' });

describe('templates that buy', () => {
    it('every template whose story buys is flagged needsPrice', () => {
        const bad: string[] = [];
        for (const t of templates) {
            const r = t.build({ a: 3, b: 2, c: 1, person: people[0], other: people[1], ctx: contexts[0] });
            if (BUYS.test(r.prompt) && !t.needsPrice) bad.push(t.id);
        }
        expect(bad).toEqual([]);
    });

    for (const [name, make] of [
        ['WORD', () => [generateWord, skill('WORD', { max: 10, kinds: ['sum'] })] as const],
        ['CHOOSE_OP', () => [generateChooseOp, skill('CHOOSE_OP', { max: 10, kinds: ['sum'] })] as const],
        ['COMPARE_DIFF', () => [generateCompareDiff, skill('COMPARE_DIFF', { max: 10 })] as const],
    ] as const) {
        it(`${name}: 3000 draws never buy a złoty`, () => {
            const [generate, s] = make();
            const rng = createRng(77);
            let buying = 0;
            for (let i = 0; i < 3000; i += 1) {
                const prompt = generate(s, rng).prompt;
                if (BUYS.test(prompt)) {
                    buying += 1;
                    expect(prompt).not.toMatch(/złot/);
                }
            }
            if (name !== 'COMPARE_DIFF') expect(buying).toBeGreaterThan(100);
        });
    }
});
