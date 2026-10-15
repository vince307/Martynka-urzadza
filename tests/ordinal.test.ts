// ORDINAL (S-14d): "on which place from the left is the key?" over a row of different icons.
// The oracle is the index of the asked icon in the drawn row, not the task's own answer.
import { describe, expect, it } from 'vitest';
import { generateOrdinal, parseOrdinalParams } from '../src/core/tasks/generators/ordinal';
import type { SkillDef } from '../src/core/types';
import { ICONS } from '../src/data/measures';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (max: number): SkillDef => ({ id: `E1.2.ordinal_${max}`, stage: 'E1', step: 2, type: 'ORDINAL', params: { max }, answer: 'tiles' });

describe('parseOrdinalParams', () => {
    it('takes max 3..10', () => {
        expect(parseOrdinalParams({ max: 5 })).toEqual({ max: 5 });
        expect(() => parseOrdinalParams({ max: 2 })).toThrow(TypeError);
        expect(() => parseOrdinalParams({ max: 11 })).toThrow(TypeError);
        expect(() => parseOrdinalParams({})).toThrow(TypeError);
    });
});

describe('generateOrdinal', () => {
    for (const max of [3, 5, 10]) {
        it(`max ${max}: 1000 draws, the answer is the place of the asked icon counted from the left`, () => {
            const places = new Map<number, number>();
            let total = 0;
            forEachDraw(generateOrdinal, skill(max), {}, (task, where) => {
                total += 1;
                expect(task.visual?.kind, where).toBe('row');
                if (task.visual?.kind !== 'row') return;
                const row = task.visual.icons;
                expect(row.length, where).toBeGreaterThanOrEqual(3);
                expect(row.length, where).toBeLessThanOrEqual(max);
                expect(new Set(row).size, where).toBe(row.length);
                const m = /^Na którym miejscu od lewej jest (.+)\?$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const asked = ICONS.find((i) => nouns[i.noun][0] === m![1]);
                expect(asked, where).toBeDefined();
                const place = row.indexOf(asked!.id) + 1;
                expect(place, where).toBeGreaterThanOrEqual(1);
                expect(task.answer, where).toBe(place);
                expect(task.tileRange, where).toEqual({ min: 1, max: row.length });
                places.set(place, (places.get(place) ?? 0) + 1);
                expect(task.hint, where).toHaveLength(3);
                expect(task.hint[0], where).not.toContain(String(place));
                expect(task.hint[1], where).not.toContain(String(place));
                expect(task.hint[2], where).toContain(String(place));
            });
            // Places are about even: 3 and 4 are never starved by the draw.
            for (let p = 1; p <= Math.min(max, 3); p += 1) {
                expect((places.get(p) ?? 0) / total, `place ${p}`).toBeGreaterThan(0.08);
            }
        });
    }
});
