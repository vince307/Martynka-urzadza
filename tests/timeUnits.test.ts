import { describe, expect, it } from 'vitest';
import { generateTimeUnits, parseTimeUnitsParams } from '../src/core/tasks/generators/timeUnits';
import { nouns } from '../src/data/nouns';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (pairs: string[]): SkillDef => ({
    id: `T.time_units.${pairs.join('')}`,
    stage: 'E6',
    step: 1,
    type: 'TIME_UNITS',
    params: { pairs, max: 400 },
    answer: 'keypad',
});

// Independent oracle: how many seconds one of the named unit lasts, keyed by any form of the noun.
const SECONDS: Record<string, number> = { sekunda: 1, minuta: 60, kwadrans: 900, godzina: 3600, doba: 86400 };
const secondsOf = (form: string): number => {
    const key = Object.entries(nouns).find(([, forms]) => forms.includes(form))?.[0];
    if (!key || !(key in SECONDS)) throw new Error(`unknown unit "${form}"`);
    return SECONDS[key];
};

describe('generateTimeUnits', () => {
    const cases: [string, string[]][] = [
        ['hours and minutes', ['hMin']],
        ['minutes and seconds', ['minS']],
        ['days and hours', ['dayH']],
        ['quarters and minutes', ['quarterMin']],
    ];
    for (const [name, pairs] of cases) {
        it(`${name}: 1000 draws convert both ways`, () => {
            const directions = new Set<string>();
            forEachDraw(generateTimeUnits, skill(pairs), { max: 400 }, (task, where) => {
                const m = /^Ile (\p{L}+) to (\d+) (\p{L}+)\?$/u.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const [, asked, n, given] = m!;
                directions.add(secondsOf(asked) > secondsOf(given) ? 'bigger' : 'smaller');
                expect(task.answer, where).toBe((Number(n) * secondsOf(given)) / secondsOf(asked));
                expect(Number.isInteger(task.answer), where).toBe(true);
                expect(task.answer as number, where).toBeGreaterThanOrEqual(2);
                expect(task.hint[0], where).toMatch(/^1 \p{L}+ to \d+ \p{L}+\.$/u);
                expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
                expect(task.speak, where).toBeUndefined();
            });
            expect([...directions].sort(), 'both directions').toEqual(['bigger', 'smaller']);
        });
    }

    it('numeral agreement of the given unit: 2 doby, 5 dób, 3 kwadranse, 22 sekundy', () => {
        const seen = new Set<string>();
        forEachDraw(generateTimeUnits, skill(['dayH', 'quarterMin']), { max: 400 }, (task) => {
            seen.add(/to (\d+ \p{L}+)\?$/u.exec(task.prompt)![1]);
        });
        expect([...seen]).toEqual(expect.arrayContaining(['2 doby', '5 dób', '3 kwadranse', '4 kwadranse']));
    });

    it('rejects an unknown pair, an empty list and a max that cannot hold two units', () => {
        expect(() => parseTimeUnitsParams({ pairs: ['week'], max: 400 })).toThrow(TypeError);
        expect(() => parseTimeUnitsParams({ pairs: [], max: 400 })).toThrow(TypeError);
        expect(() => parseTimeUnitsParams({ pairs: ['hMin'], max: 100 })).toThrow(TypeError);
        expect(() => parseTimeUnitsParams({ pairs: ['hMin'] })).toThrow(TypeError);
        expect(parseTimeUnitsParams({ pairs: ['hMin', 'dayH'], max: 400 }).pairs).toEqual(['hMin', 'dayH']);
    });
});
