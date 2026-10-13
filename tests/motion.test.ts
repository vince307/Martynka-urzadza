import { describe, expect, it } from 'vitest';
import { prefersReducedMotion } from '../src/ui/motion';

const win = (matches: boolean, seen: string[] = []): Pick<Window, 'matchMedia'> => ({
    matchMedia: (query: string) => {
        seen.push(query);
        return { matches } as MediaQueryList;
    },
});

describe('prefersReducedMotion', () => {
    it('is true when the reduce query matches', () => {
        const seen: string[] = [];
        expect(prefersReducedMotion(win(true, seen))).toBe(true);
        expect(seen).toEqual(['(prefers-reduced-motion: reduce)']);
    });

    it('is false when it does not match', () => {
        expect(prefersReducedMotion(win(false))).toBe(false);
    });

    it('is false without a window or without matchMedia', () => {
        expect(prefersReducedMotion(undefined)).toBe(false);
        expect(prefersReducedMotion({} as Pick<Window, 'matchMedia'>)).toBe(false);
    });

    it('is false when matchMedia throws', () => {
        const throwing = { matchMedia: () => { throw new Error('boom'); } } as Pick<Window, 'matchMedia'>;
        expect(prefersReducedMotion(throwing)).toBe(false);
    });

    it('reads the setting at each call', () => {
        let matches = false;
        const live = { matchMedia: () => ({ matches }) as MediaQueryList } as Pick<Window, 'matchMedia'>;
        expect(prefersReducedMotion(live)).toBe(false);
        matches = true;
        expect(prefersReducedMotion(live)).toBe(true);
    });
});
