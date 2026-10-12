// EVEN_ODD: "is 17 even?" with two tiles, or "mark all even numbers" with a
// set answer checked by `check` (ZADANIA.md, section 4).
import { pl } from '../../../data/pl';
import type { Generator, Task } from '../types';

export interface EvenOddParams {
    max: number;
    variant: 'single' | 'select';
}

const SELECT_TILES = 6;

export const parseEvenOddParams = (params: Record<string, unknown>): EvenOddParams => {
    const { max, variant = 'single' } = params;
    if (!Number.isInteger(max) || (max as number) < 10) {
        throw new TypeError(`EVEN_ODD params.max must be an integer >= 10, got ${String(max)}`);
    }
    if (variant !== 'single' && variant !== 'select') {
        throw new TypeError(`EVEN_ODD params.variant must be 'single' | 'select', got ${String(variant)}`);
    }
    return { max: max as number, variant };
};

const sameSet = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

export const generateEvenOdd: Generator = (skill, rng): Task => {
    const p = parseEvenOddParams(skill.params);
    if (p.variant === 'single') {
        const n = rng.int(1, p.max);
        const isEven = n % 2 === 0;
        return {
            skillId: skill.id,
            prompt: pl.tasks.evenOdd(n),
            answer: isEven ? pl.tasks.even : pl.tasks.odd,
            choices: [pl.tasks.even, pl.tasks.odd],
            hint: [pl.tasks.evenOddHint(n, n % 10, isEven)],
        };
    }
    // 2–4 even numbers among six distinct tiles.
    const evenCount = rng.int(2, 4);
    const tiles = new Set<number>();
    while (tiles.size < evenCount) {
        tiles.add(2 * rng.int(1, Math.floor(p.max / 2)));
    }
    while (tiles.size < SELECT_TILES) {
        tiles.add(2 * rng.int(0, Math.floor((p.max - 1) / 2)) + 1);
    }
    const choices = rng.shuffle([...tiles]);
    const answer = choices.filter((n) => n % 2 === 0).sort((x, y) => x - y);
    return {
        skillId: skill.id,
        prompt: pl.tasks.selectEven,
        answer,
        choices,
        hint: [pl.tasks.selectEvenHint],
        check: (input) => Array.isArray(input) && input.every((x) => typeof x === 'number') && sameSet(input as number[], answer),
    };
};
