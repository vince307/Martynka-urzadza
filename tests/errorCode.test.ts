import { describe, expect, it } from 'vitest';
import { errorCode } from '../src/core/save';

describe('errorCode', () => {
    it('is the error name alone when there is no skill id', () => {
        expect(errorCode(new RangeError('x'))).toBe('RangeError');
    });

    it('adds /<skillId> when the error carries one', () => {
        expect(errorCode(Object.assign(new RangeError('x'), { skillId: 'E3.9.a' }))).toBe('RangeError/E3.9.a');
    });

    it('ignores an empty or non-string skill id', () => {
        expect(errorCode(Object.assign(new TypeError('x'), { skillId: '' }))).toBe('TypeError');
        expect(errorCode(Object.assign(new TypeError('x'), { skillId: 7 }))).toBe('TypeError');
    });

    it('never throws and falls back to Error for non-errors', () => {
        expect(errorCode('boom')).toBe('Error');
        expect(errorCode(null)).toBe('Error');
        expect(errorCode(undefined)).toBe('Error');
        expect(errorCode(Object.freeze({ name: 'Frozen' }))).toBe('Frozen');
        expect(errorCode(Object.freeze({ skillId: 'S' }))).toBe('Error/S');
    });
});
