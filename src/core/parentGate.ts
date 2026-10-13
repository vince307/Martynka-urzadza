// Adult gate logic: a multiplication a child in grades 1-3 cannot do, typed in
// on a digit pad. Pure functions; no attempts counted, nothing ever locks.
import type { Rng } from './rng';

export interface GateChallenge {
    a: number;
    b: number;
}
export type GateKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'back';
export interface GateRange {
    factorMin: number;
    factorMax: number;
}

export const createChallenge = (rng: Rng, range: GateRange): GateChallenge => ({
    a: rng.int(range.factorMin, range.factorMax),
    b: rng.int(range.factorMin, range.factorMax),
});

export const checkAnswer = (challenge: GateChallenge, digits: string): boolean =>
    /^[1-9]\d*$/.test(digits) && Number(digits) === challenge.a * challenge.b;

/** Next digit field after a key: digits append up to `maxDigits`, no leading zero, 'back' drops the last. */
export const gateInput = (digits: string, key: GateKey, maxDigits: number): string => {
    if (key === 'back') return digits.slice(0, -1);
    if (digits.length >= maxDigits) return digits;
    if (digits === '' && key === '0') return digits;
    return digits + key;
};
