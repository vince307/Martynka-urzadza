import { describe, expect, it } from 'vitest';
import { startDigitBoxes, stepDigitBoxes } from '../src/core/round/digitBoxes';
import type { KeypadKey } from '../src/core/round/keypad';

const press = (count: number, keys: KeypadKey[]) => {
    let state = startDigitBoxes(count);
    let submit: number | null = null;
    for (const key of keys) ({ state, submit } = stepDigitBoxes(state, key));
    return { state, submit };
};

describe('digit boxes of a written column', () => {
    it('fills the boxes from the ones, right to left', () => {
        expect(press(3, ['6', '5']).state.digits).toEqual([6, 5]);   // digits[0] is the ones box
    });
    it('ignores a digit once every box is full', () => {
        expect(press(2, ['1', '2', '3']).state.digits).toEqual([1, 2]);
    });
    it('delete clears the last filled box and is harmless on empty boxes', () => {
        expect(press(3, ['4', '5', 'delete']).state.digits).toEqual([4]);
        expect(press(3, ['delete']).state.digits).toEqual([]);
    });
    it('ok submits only when every box is full, the number read from the ones up', () => {
        expect(press(3, ['5', '6', 'ok']).submit).toBeNull();
        expect(press(3, ['5', '6', '1', 'ok']).submit).toBe(165);
    });
    it('allows a zero in the tens box of a multi-digit number', () => {
        expect(press(3, ['5', '0', '1', 'ok']).submit).toBe(105);
    });
});
