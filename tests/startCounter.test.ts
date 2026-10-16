import { describe, expect, it, vi } from 'vitest';
import { createStartCounter, UNAVAILABLE_STARTS_KEY } from '../src/storage/startCounter';

const memory = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

const throwing = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> => ({
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
    removeItem: () => { throw new Error('denied'); },
});

describe('unavailable starts counter (SRR-08)', () => {
    it('counts consecutive bumps and reset starts again', () => {
        const store = memory();
        const counter = createStartCounter(store);
        expect(counter.read()).toBe(0);
        expect(counter.bump()).toBe(1);
        expect(counter.bump()).toBe(2);
        expect(counter.read()).toBe(2);
        expect(store.data.get(UNAVAILABLE_STARTS_KEY)).toBe('2');
        counter.reset();
        expect(counter.read()).toBe(0);
        expect(counter.bump()).toBe(1);
    });
    it('a garbage value reads 0', () => {
        const store = memory();
        for (const bad of ['abc', '-3', '1.5', '']) {
            store.data.set(UNAVAILABLE_STARTS_KEY, bad);
            expect(createStartCounter(store).read(), bad).toBe(0);
        }
    });
    it('no storage or a throwing storage reads 0 and never throws (a blocked store never reaches the second start)', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        for (const storage of [undefined, throwing()]) {
            const counter = createStartCounter(storage);
            expect(counter.read()).toBe(0);
            expect(counter.bump()).toBe(1);
            expect(() => counter.reset()).not.toThrow();
        }
    });
});
