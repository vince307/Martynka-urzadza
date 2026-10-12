// Keypad buffer rules: digits append up to the limit, delete removes the last
// digit, no leading zeros, "ok" on an empty buffer submits nothing.
import { describe, expect, it } from 'vitest';
import { keypadInput, type KeypadKey } from '../src/core/round/keypad';
import { balance } from '../src/data/balance';

const type = (keys: KeypadKey[], max = 3): { buffer: string; submit: number | null } => {
    let buffer = '';
    let submit: number | null = null;
    for (const k of keys) {
        ({ buffer, submit } = keypadInput(buffer, k, max));
    }
    return { buffer, submit };
};

describe('keypadInput', () => {
    it('appends digits', () => {
        expect(type(['1', '2']).buffer).toBe('12');
    });
    it('stops at the digit limit', () => {
        expect(type(['1', '2', '3', '4']).buffer).toBe('123');
        expect(type(['1', '2', '3', '4', '5', '6', '7', '8'], balance.keypad.maxDigits).buffer).toBe('1234567');
    });
    it('delete removes the last digit and is harmless on an empty buffer', () => {
        expect(type(['1', '2', 'delete']).buffer).toBe('1');
        expect(type(['delete']).buffer).toBe('');
    });
    it('has no leading zeros', () => {
        expect(type(['0', '0']).buffer).toBe('0');
        expect(type(['0', '7']).buffer).toBe('7');
    });
    it('ok submits the number and keeps the buffer', () => {
        expect(type(['4', '2', 'ok'])).toEqual({ buffer: '42', submit: 42 });
        expect(type(['0', 'ok']).submit).toBe(0);
    });
    it('ok on an empty buffer submits nothing', () => {
        expect(type(['ok']).submit).toBeNull();
        expect(type(['1', 'delete', 'ok']).submit).toBeNull();
    });
    it('only ok submits', () => {
        expect(type(['1', '2']).submit).toBeNull();
    });
});
