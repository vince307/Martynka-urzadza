import { describe, expect, it } from 'vitest';
import { generatePrice, parsePriceParams } from '../src/core/tasks/generators/price';
import { goods } from '../src/data/wordTemplates';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (variant: string, minQty = 2): SkillDef => ({
    id: `T.price.${variant}`,
    stage: 'E5',
    step: 10,
    type: 'PRICE',
    params: { variants: [variant], max: 100, maxQty: 10, minQty },
    answer: 'keypad',
});

describe('generatePrice', () => {
    it('total: quantity times price, whole złoty up to 100', () => {
        forEachDraw(generatePrice, skill('total'), { max: 100 }, (task, where) => {
            const m = /(?:kupił|kupiła) (\d+) .*kosztuje (\d+) złot/.exec(task.prompt);
            expect(m, where).not.toBeNull();
            expect(task.answer, where).toBe(Number(m![1]) * Number(m![2]));
            expect(task.answer as number, where).toBeLessThanOrEqual(100);
            expect(task.hint[task.hint.length - 1], where).toBe(`${m![2]} · ${m![1]} = ${String(task.answer)}`);
        });
    });

    it('unit: the price of one is the total divided by the quantity', () => {
        forEachDraw(generatePrice, skill('unit'), { max: 100 }, (task, where) => {
            const m = /(?:kupił|kupiła) (\d+) .* za (\d+) złot/.exec(task.prompt);
            expect(m, where).not.toBeNull();
            expect(Number(m![1]), where).toBeGreaterThanOrEqual(2);
            expect(Number(m![2]) % Number(m![1]), where).toBe(0);
            expect(task.answer, where).toBe(Number(m![2]) / Number(m![1]));
            expect(task.prompt, where).toMatch(/Ile kosztuje (jeden|jedna|jedno) /);
            expect(task.hint[task.hint.length - 1], where).toBe(`${m![2]} : ${m![1]} = ${String(task.answer)}`);
        });
    });

    it('a single item takes the accusative after "kupiła" (1 bułkę, not 1 bułka)', () => {
        const seen = new Set<string>();
        forEachDraw(generatePrice, skill('total', 1), { max: 100 }, (task, where) => {
            const one = /(?:kupił|kupiła) 1 (\p{L}+)/u.exec(task.prompt)?.[1];
            if (one) {
                seen.add(one);
                expect(goods.some((g) => g.accusative === one), `${where} "${one}"`).toBe(true);
            }
        });
        expect(seen.size).toBeGreaterThan(3);
        for (const g of goods) {
            if (g.noun[0].endsWith('a')) {
                expect(g.accusative, g.noun[0]).toMatch(/ę$/);
            }
        }
    });

    it('the price of one is never the quantity (the first hint would end with the answer)', () => {
        forEachDraw(generatePrice, skill('unit'), { max: 100 }, (task, where) => {
            const q = Number(/kupił\p{L}* (\d+)/u.exec(task.prompt)?.[1]);
            expect(task.answer, where).not.toBe(q);
        });
    });

    it('rejects an unknown variant and a quantity range with no room', () => {
        expect(() => parsePriceParams({ variants: ['x'], max: 100, maxQty: 10 })).toThrow(TypeError);
        expect(() => parsePriceParams({ variants: ['total'], max: 100, maxQty: 1 })).toThrow(TypeError);
        // the cheapest good costs 2 zł, so 10 of them do not fit under 8 zł
        expect(() => parsePriceParams({ variants: ['total'], max: 8, maxQty: 10 })).toThrow(TypeError);
    });
});
