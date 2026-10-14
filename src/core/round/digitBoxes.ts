// Digit boxes of a written column (S-14b): pure, the answer is typed one digit per box, from the ones.
import type { KeypadKey } from './keypad';

/** `digits[0]` is the ones box; the boxes fill right to left. */
export interface DigitBoxes { readonly count: number; readonly digits: readonly number[] }

export const startDigitBoxes = (count: number): DigitBoxes => ({ count, digits: [] });

/** A digit fills the next box (ignored when full), 'delete' clears the last filled one, 'ok' submits only when every box is full. */
export const stepDigitBoxes = (s: DigitBoxes, key: KeypadKey): { state: DigitBoxes; submit: number | null } => {
    if (key === 'ok') {
        const full = s.digits.length === s.count;
        return { state: s, submit: full ? s.digits.reduce((sum, d, i) => sum + d * 10 ** i, 0) : null };
    }
    if (key === 'delete') {
        return { state: { count: s.count, digits: s.digits.slice(0, -1) }, submit: null };
    }
    if (s.digits.length >= s.count) {
        return { state: s, submit: null };
    }
    return { state: { count: s.count, digits: [...s.digits, Number(key)] }, submit: null };
};
