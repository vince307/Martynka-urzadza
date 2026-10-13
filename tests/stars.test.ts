// Star balance rule (S-09 phase 1). Oracle: PRD FR-016/US-02 and the project
// rule "wrong answers never remove stars": the balance only grows.
import { describe, expect, it } from 'vitest';
import { earn } from '../src/core/stars';

describe('earn', () => {
    it('adds a round earning to the balance', () => {
        expect(earn(0, 5)).toBe(5);
        expect(earn(7, 3)).toBe(10);
    });
    it('a zero delta changes nothing', () => {
        expect(earn(4, 0)).toBe(4);
    });
    it('a negative, fractional or NaN delta never lowers or corrupts the balance', () => {
        expect(earn(4, -2)).toBe(4);
        expect(earn(4, 1.5)).toBe(4);
        expect(earn(4, Number.NaN)).toBe(4);
    });
});
