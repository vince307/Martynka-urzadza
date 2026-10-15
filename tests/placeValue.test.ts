import { describe, expect, it } from 'vitest';
import { pl } from '../src/data/pl';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generatePlaceValue, parsePlaceValueParams } from '../src/core/tasks/generators/placeValue';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';
import { balance } from '../src/data/balance';
import { E6 } from '../src/data/curriculum/E6';
import { formatNumber } from '../src/core/text/formatNumber';

const skill = (id: string, params: Record<string, unknown>, answer: SkillDef['answer'] = 'keypad'): SkillDef => ({ id, stage: 'E3', step: 6, type: 'PLACE_VALUE', params, answer });

const READ_30 = skill('E3.6.place_read_30', { variant: 'read', min: 11, max: 30 });
const TENS_30 = skill('E3.6.place_tens_30', { variant: 'tens', min: 11, max: 30 });
const READ_100 = skill('E4.1.place_read_100', { variant: 'read', min: 20, max: 99 });
const DECOMPOSE = skill('E4.1.place_decompose_100', { variant: 'decompose', min: 21, max: 99 });
const READ_1000 = skill('E4.8.place_read_1000', { variant: 'read', min: 100, max: 999 });
const BUILD = skill('E4.8.place_build_100', { variant: 'build', min: 11, max: 99 }, 'drag');

// The oracle works from the drawing (visual) fields, never from task.answer.
const blocksOf = (task: { visual?: { kind: string } }, where: string): { hundreds: number; tens: number; ones: number } => {
    const v = task.visual as { kind: string; hundreds: number; tens: number; ones: number } | undefined;
    if (v?.kind !== 'blocks') throw new Error(`no blocks drawing ${where}`);
    return v;
};

describe('generatePlaceValue', () => {
    for (const s of [READ_30, READ_100, READ_1000]) {
        it(`${s.id}: 1000 draws read the number off the blocks, inside min..max`, () => {
            const { min, max } = s.params as { min: number; max: number };
            const hundreds = new Set<number>();
            let zeroOnes = 0;
            let zeroTens = 0;
            forEachDraw(generatePlaceValue, s, { max }, (task, where) => {
                const b = blocksOf(task, where);
                expect(task.answer, where).toBe(100 * b.hundreds + 10 * b.tens + b.ones);
                expect(task.answer as number, where).toBeGreaterThanOrEqual(min);
                expect(task.answer as number, where).toBeLessThanOrEqual(max);
                hundreds.add(b.hundreds);
                if (b.ones === 0) zeroOnes += 1;
                if (b.tens === 0 && b.hundreds > 0) zeroTens += 1;
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                expect(firstHint(task), where).not.toBeNull();
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
            });
            expect(zeroOnes, 'draws with zero ones').toBeGreaterThan(0);
            if (max >= 100) {
                expect(zeroTens, 'draws with zero tens').toBeGreaterThan(0);
                expect(hundreds.size).toBeGreaterThan(5);
            }
        });
    }

    it('tens: asks how many tens the blocks show; the answer is the tens count of the drawing', () => {
        const seen = new Set<number>();
        forEachDraw(generatePlaceValue, TENS_30, { max: 30 }, (task, where) => {
            const b = blocksOf(task, where);
            expect(b.hundreds, where).toBe(0);
            expect(task.answer, where).toBe(b.tens);
            expect(b.tens, where).toBeGreaterThanOrEqual(1);
            expect(task.prompt, where).toMatch(/dziesiątek/);
            seen.add(b.tens);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect([...seen].sort()).toEqual([1, 2, 3]);
    });

    it('decompose: "47 = 40 + □" has no drawing and the answer completes the sum', () => {
        forEachDraw(generatePlaceValue, DECOMPOSE, { max: 99 }, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            const m = /^(\d+) = (\d+) \+ □$/.exec(task.prompt);
            if (!m) throw new Error(`prompt shape ${where}`);
            const [n, rest] = [Number(m[1]), Number(m[2])];
            expect(rest % 10, where).toBe(0);
            expect(rest + (task.answer as number), where).toBe(n);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(1);
            expect(task.answer as number, where).toBeLessThanOrEqual(9);
            expect(n, where).toBeGreaterThanOrEqual(21);
            expect(n, where).toBeLessThanOrEqual(99);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('build: names the number to build, has no drawing, answer within min..max, the mat starts empty', () => {
        const seen = new Set<number>();
        forEachDraw(generatePlaceValue, BUILD, { max: 99 }, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            expect(task.choices, where).toBeUndefined();
            const m = /^Zbuduj z klocków liczbę (\d+)\.$/.exec(task.prompt);
            if (!m) throw new Error(`prompt shape ${where}`);
            expect(task.answer, where).toBe(Number(m[1]));
            expect(task.answer as number, where).toBeGreaterThanOrEqual(11);
            expect(task.answer as number, where).toBeLessThanOrEqual(99);
            seen.add(task.answer as number);
            expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(seen.size).toBeGreaterThan(60);
    });

    it('hint lines agree in number: 1 dziesiątka, 2 dziesiątki, 5 jedności', () => {
        const task = generatePlaceValue(skill('x', { variant: 'build', min: 21, max: 21 }), createRng(1));
        expect(task.hint.join(' ')).toContain('2 dziesiątki');
        expect(task.hint.join(' ')).toContain('1 jedność');
        const ten = generatePlaceValue(skill('x', { variant: 'build', min: 15, max: 15 }), createRng(1));
        expect(ten.hint.join(' ')).toContain('1 dziesiątka');
        expect(ten.hint.join(' ')).toContain('5 jedności');
    });
});

describe('parsePlaceValueParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [READ_30, TENS_30, READ_100, DECOMPOSE, READ_1000, BUILD]) {
            expect(() => parsePlaceValueParams(s.params), s.id).not.toThrow();
        }
    });

    it.each([
        ['unknown variant', { variant: 'compare', min: 11, max: 30 }],
        ['max above 999', { variant: 'read', min: 100, max: 1000 }],
        ['min above max', { variant: 'read', min: 50, max: 40 }],
        ['min below 1', { variant: 'read', min: 0, max: 40 }],
        ['fractional bound', { variant: 'read', min: 11, max: 30.5 }],
        ['build with max 150', { variant: 'build', min: 11, max: 150 }],
        ['tens above 99', { variant: 'tens', min: 11, max: 120 }],
        ['tens below 10', { variant: 'tens', min: 5, max: 30 }],
        ['decompose with no number off a full ten', { variant: 'decompose', min: 20, max: 20 }],
        ['missing bounds', { variant: 'read' }],
    ])('rejects %s', (_name, params) => {
        expect(() => parsePlaceValueParams(params)).toThrow(TypeError);
    });
});

describe('PLACE_VALUE answer hint: numeral agreement', () => {
    // "Jest 1 dziesiątka." / "Są 2 dziesiątki." / "Jest 5 dziesiątek." - never "Dziesiątek jest N".
    const expected = (t: number): string => {
        const noun = t === 1 ? 'dziesiątka' : [2, 3, 4].includes(t % 10) && ![12, 13, 14].includes(t % 100) ? 'dziesiątki' : 'dziesiątek';
        const verb = t === 1 || noun === 'dziesiątek' ? 'Jest' : 'Są';
        return `${verb} ${t} ${noun}.`;
    };
    it('the final tens hint agrees with the count for 0..100', () => {
        for (let t = 0; t <= 100; t += 1) {
            expect(pl.tasks.placeValueTensAnswerHint(t), `t=${t}`).toBe(expected(t));
        }
    });
    it('spot checks', () => {
        expect(pl.tasks.placeValueTensAnswerHint(1)).toBe('Jest 1 dziesiątka.');
        expect(pl.tasks.placeValueTensAnswerHint(2)).toBe('Są 2 dziesiątki.');
        expect(pl.tasks.placeValueTensAnswerHint(5)).toBe('Jest 5 dziesiątek.');
    });
    it('the drawn tens task ends with that hint for 1000 draws', () => {
        forEachDraw(generatePlaceValue, TENS_30, { max: 30 }, (task, where) => {
            expect(task.hint[task.hint.length - 1], where).toBe(expected(task.answer as number));
        });
    });
});

// Phase 7 (S-14c): thousands and orders of magnitude, written as text on the keypad.
describe('PLACE_VALUE thousands and orders', () => {
    const THOUSANDS = skill('E6.9.place_value_10000', { variant: 'thousands', max: 10000 });
    const ORDERS = skill('E6.10.place_value_1000000', { variant: 'orders', max: 1000000 });
    const PLACES: Record<string, number> = { tysięcy: 1000, setek: 100, dziesiątek: 10, jedności: 1 };
    const PARTS: Record<string, number> = { tysiąc: 1000, tysiące: 1000, tysięcy: 1000, setka: 100, setki: 100, setek: 100, dziesiątka: 10, dziesiątki: 10, dziesiątek: 10, jedność: 1, jedności: 1 };
    const plain = (text: string): number => Number(text.replace(/\u00A0/g, ''));

    // The oracle reads the numbers off the prompt, never from task.answer; it returns the kind of the prompt.
    const expectedOf = (prompt: string): { kind: string; value: number } => {
        let m = /^Jaka cyfra jest na miejscu (\p{L}+) w liczbie ([\d\u00A0]+)\?$/u.exec(prompt);
        if (m) return { kind: 'digit', value: Math.floor(plain(m[2]) / PLACES[m[1]]) % 10 };
        m = /^([\d\u00A0]+) = (.+)$/u.exec(prompt);
        if (m) {
            const parts = m[2].split(' + ');
            expect(parts.filter((x) => x === '□').length, prompt).toBe(1);
            const known = parts.filter((x) => x !== '□').reduce((sum, x) => sum + plain(x), 0);
            return { kind: 'gap', value: plain(m[1]) - known };
        }
        m = /^(.+) to jaka liczba\?$/u.exec(prompt);
        if (m) {
            let total = 0;
            for (const part of m[1].split(/, | i /u)) {
                const q = /^(\d+) (\p{L}+)(?: (tysięcy))?$/u.exec(part);
                if (!q) expect.fail(`part "${part}" of "${prompt}"`);
                total += Number(q[1]) * (q[3] ? PARTS[q[2]] * 1000 : PARTS[q[2]]);
            }
            return { kind: 'compose', value: total };
        }
        m = /^Ile tysięcy to ([\d\u00A0]+)\?$/u.exec(prompt);
        if (m) return { kind: 'thousandsOf', value: plain(m[1]) / 1000 };
        m = /^Ile setek tysięcy ma ([\d\u00A0]+)\?$/u.exec(prompt);
        if (m) return { kind: 'hundredThousandsOf', value: plain(m[1]) / 100000 };
        return expect.fail(`unknown prompt shape "${prompt}"`);
    };

    it('thousands: digit, gap and compose tasks, each right by its own prompt, up to 10 000', () => {
        const kinds = new Set<string>();
        forEachDraw(generatePlaceValue, THOUSANDS, { max: 10000 }, (task, where) => {
            const { kind, value } = expectedOf(task.prompt);
            kinds.add(kind);
            expect(task.visual, where).toBeUndefined();
            expect(task.answer, where).toBe(value);
            expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
            if (kind === 'gap') {
                expect(task.prompt, where).toContain('□');
                expect(task.prompt, where).toMatch(/^\d{4} = /);
            }
        });
        expect([...kinds].sort()).toEqual(['compose', 'digit', 'gap']);
    });

    it('thousands: the compose prompt agrees "1 tysiąc, 2 tysiące, 5 tysięcy" and skips zero orders', () => {
        const prompts = new Set<string>();
        forEachDraw(generatePlaceValue, THOUSANDS, { max: 10000 }, (task) => {
            if (task.prompt.endsWith('to jaka liczba?')) prompts.add(task.prompt);
        });
        const all = [...prompts].join('\n');
        expect(all).toMatch(/(^|\s)1 tysiąc[ ,]/m);
        expect(all).toMatch(/\b[234] tysiące\b/);
        expect(all).toMatch(/\b[5-9] tysięcy\b/);
        expect(all).not.toMatch(/\b0 /);
    });

    it('orders: "Ile tysięcy to 250 000?", full hundreds of thousands and the composed number', () => {
        const kinds = new Set<string>();
        let large = 0;
        let total = 0;
        forEachDraw(generatePlaceValue, ORDERS, { max: 1000000 }, (task, where) => {
            const { kind, value } = expectedOf(task.prompt);
            kinds.add(kind);
            expect(task.answer, where).toBe(value);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(formatNumber(task.answer as number));
            total += 1;
            if ((task.answer as number) >= 100000) large += 1;
        });
        expect([...kinds].sort()).toEqual(['compose', 'hundredThousandsOf', 'thousandsOf']);
        // The round spec of phase 11 needs a six-digit answer: at least half of the draws have one (plan-review F4).
        expect(large / total).toBeGreaterThanOrEqual(0.5);
    });

    it('numbers from 10 000 are grouped with a no-break space and spoken without it', () => {
        let grouped = 0;
        for (const s of [THOUSANDS, ORDERS]) {
            forEachDraw(generatePlaceValue, s, { max: s === ORDERS ? 1000000 : 10000 }, (task, where) => {
                expect(task.prompt, where).not.toMatch(/\d{5,}/);
                for (const line of task.hint) expect(line, where).not.toMatch(/\d{5,}/);
                if (/\d\u00A0\d{3}/.test(task.prompt)) {
                    grouped += 1;
                    expect(task.speak, where).toBeDefined();
                    expect(task.speak, where).not.toMatch(/\u00A0|\d \d{3}/);
                    expect(task.speak, where).toMatch(/\d{5,}/);
                }
            });
        }
        expect(grouped).toBeGreaterThan(100);
    });

    it('the answer never needs more digits than the keypad takes', () => {
        for (const s of [THOUSANDS, ORDERS]) {
            forEachDraw(generatePlaceValue, s, { max: s === ORDERS ? 1000000 : 10000 }, (task, where) => {
                expect(String(task.answer).length, where).toBeLessThanOrEqual(balance.keypad.maxDigits);
            });
        }
    });

    it('the 999 limit of the block drawings still holds per variant; thousands and orders have their own limits', () => {
        expect(() => parsePlaceValueParams({ variant: 'thousands', max: 10000 })).not.toThrow();
        expect(() => parsePlaceValueParams({ variant: 'orders', max: 1000000 })).not.toThrow();
        for (const params of [
            { variant: 'read', min: 100, max: 1000000 },
            { variant: 'tens', min: 11, max: 1000 },
            { variant: 'thousands', max: 20000 },
            { variant: 'thousands', max: 500 },
            { variant: 'orders', max: 1000 },
            { variant: 'orders', max: 2000000 },
            { variant: 'orders' },
        ]) {
            expect(() => parsePlaceValueParams(params), JSON.stringify(params)).toThrow(TypeError);
        }
    });

    it('E6.9 and E6.10 carry the new skills with their planned parameters', () => {
        const e6 = (id: string): SkillDef | undefined => E6.steps.flatMap((st) => st.skills).find((sk) => sk.id === id);
        expect(e6('E6.9.place_value_10000')?.params).toEqual({ variant: 'thousands', max: 10000 });
        expect(e6('E6.10.place_value_1000000')?.params).toEqual({ variant: 'orders', max: 1000000 });
        expect(e6('E6.9.place_value_10000')?.type).toBe('PLACE_VALUE');
    });
});
