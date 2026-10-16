// EVEN_ODD: "is 17 even?" with two tiles, or "mark all even numbers" with a
// set answer checked by `check` (ZADANIA.md, section 4).
import { pl } from '../../../data/pl';
import type { Generator, Task } from '../types';

const MAX_ATTEMPTS = 1000;

export interface EvenOddParams {
    max: number;
    min: 0 | 1;     // 0 admits zero as a drawn number (E1.6); default 1
    variant: 'single' | 'select';
}

const SELECT_TILES = 6;

export const parseEvenOddParams = (params: Record<string, unknown>): EvenOddParams => {
    const { max, min = 1, variant = 'single' } = params;
    if (!Number.isInteger(max) || (max as number) < 10) {
        throw new TypeError(`EVEN_ODD params.max must be an integer >= 10, got ${String(max)}`);
    }
    if (variant !== 'single' && variant !== 'select') {
        throw new TypeError(`EVEN_ODD params.variant must be 'single' | 'select', got ${String(variant)}`);
    }
    if (min !== 0 && min !== 1) {
        throw new TypeError(`EVEN_ODD params.min must be 0 | 1, got ${String(min)}`);
    }
    return { max: max as number, min, variant };
};

const sameSet = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

export const generateEvenOdd: Generator = (skill, rng): Task => {
    const p = parseEvenOddParams(skill.params);
    if (p.variant === 'single') {
        const n = rng.int(p.min, p.max);
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
    for (let attempt = 0; tiles.size < evenCount; attempt += 1) {
        if (attempt >= MAX_ATTEMPTS) throw new RangeError(`EVEN_ODD select: no ${evenCount} even tiles in ${MAX_ATTEMPTS} tries (max ${p.max})`);
        tiles.add(2 * rng.int(1, Math.floor(p.max / 2)));
    }
    for (let attempt = 0; tiles.size < SELECT_TILES; attempt += 1) {
        if (attempt >= MAX_ATTEMPTS) throw new RangeError(`EVEN_ODD select: no ${SELECT_TILES} distinct tiles in ${MAX_ATTEMPTS} tries (max ${p.max})`);
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
        check: (input) => Array.isArray(input) && input.every((x): x is number => typeof x === 'number') && sameSet(input, answer),
    };
};
