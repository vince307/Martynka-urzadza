// Number shapes from docs/ZADANIA.md, section 4 ("DU+U", "DT-U", "HTU-DT"):
// which kinds of numbers an operation combines. Tokens: U one-digit 1–9,
// DU two-digit 10–99, DT full tens 10–90, H full hundreds 100–900,
// HT hundreds and tens with units 0 (110–990), HTU any three-digit 100–999.
import type { Rng } from '../rng';

export type ShapeToken = 'U' | 'DU' | 'DT' | 'H' | 'HT' | 'HTU';
export type ShapeOp = '+' | '-';

export interface Shape {
    left: ShapeToken;
    op: ShapeOp;
    right: ShapeToken;
}

const TOKENS: readonly ShapeToken[] = ['U', 'DU', 'DT', 'H', 'HT', 'HTU'];
const SHAPE = /^(U|DU|DT|H|HT|HTU)([+-])(U|DU|DT|H|HT|HTU)$/;

export const parseShape = (text: string): Shape => {
    const m = SHAPE.exec(text);
    if (!m) {
        throw new TypeError(`shape must look like "DU+U" with tokens ${TOKENS.join(', ')}, got ${JSON.stringify(text)}`);
    }
    return { left: m[1] as ShapeToken, op: m[2] as ShapeOp, right: m[3] as ShapeToken };
};

export const formatShape = (shape: Shape): string => `${shape.left}${shape.op}${shape.right}`;

/** Inclusive bounds and step of a token: DT = 10, 20, …, 90. */
const RANGES: Readonly<Record<ShapeToken, { min: number; max: number; step: number }>> = {
    U: { min: 1, max: 9, step: 1 },
    DU: { min: 10, max: 99, step: 1 },
    DT: { min: 10, max: 90, step: 10 },
    H: { min: 100, max: 900, step: 100 },
    HT: { min: 110, max: 990, step: 10 },
    HTU: { min: 100, max: 999, step: 1 },
};

/** Draws a number of the token's shape, no larger than `max`. */
export const drawToken = (token: ShapeToken, rng: Rng, max: number): number => {
    const { min, step } = RANGES[token];
    const top = Math.min(RANGES[token].max, max - (max % step));
    if (top < min) {
        throw new RangeError(`no ${token} numbers up to ${max}`);
    }
    return min + step * rng.int(0, (top - min) / step);
};

/** Does n have the token's shape? Used by tests and params validation. */
export const matchesToken = (n: number, token: ShapeToken): boolean => {
    const { min, max, step } = RANGES[token];
    return Number.isInteger(n) && n >= min && n <= max && (n - min) % step === 0;
};
