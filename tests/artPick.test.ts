import { describe, expect, it } from 'vitest';
import { firstLoaded, miniatureMode, neededMiniatureKeys, noteFallback } from '../src/core/artPick';
import { miniaturePieces } from '../src/ui/widgets/RoomView';
import { SALON } from '../src/data/rooms';

const only = (...have: string[]) => (key: string) => have.includes(key);

describe('firstLoaded', () => {
    it('returns the first key that exists, in list order', () => {
        expect(firstLoaded(['a', 'b', 'c'], only('c', 'b'))).toBe('b');
    });
    it('returns null when none exists or the list is empty', () => {
        expect(firstLoaded(['a', 'b'], only())).toBeNull();
        expect(firstLoaded([], only('a'))).toBeNull();
    });
});

describe('miniatureMode', () => {
    it('is live when every needed key exists, also for an empty list', () => {
        expect(miniatureMode(['a', 'b'], only('a', 'b'), 't')).toBe('live');
        expect(miniatureMode([], only(), 't')).toBe('live');
    });
    it('one missing piece gives the thumbnail when it exists', () => {
        expect(miniatureMode(['a', 'b'], only('a', 't'), 't')).toBe('thumbnail');
    });
    it('is drawn when a piece and the thumbnail are both missing', () => {
        expect(miniatureMode(['a', 'b'], only('a'), 't')).toBe('drawn');
    });
});

describe('neededMiniatureKeys', () => {
    it('skips alpha 0 pieces only', () => {
        expect(neededMiniatureKeys([{ key: 'a', alpha: 1 }, { key: 'b', alpha: 0 }, { key: 'c', alpha: 0.5 }])).toEqual(['a', 'c']);
    });
    it('a salon state with one furniture key missing gives the thumbnail', () => {
        const chosen = Object.fromEntries(SALON.slots.map((s) => [s.id, 0 as const]));
        const needed = neededMiniatureKeys(miniaturePieces(SALON, { tasksDone: SALON.tasks.length, chosen }));
        const missing = SALON.slots[0].variants[0];
        expect(needed).toContain(missing);
        const exists = (key: string) => key === 'thumb' || (needed.includes(key) && key !== missing);
        expect(miniatureMode(needed, exists, 'thumb')).toBe('thumbnail');
    });
});

describe('noteFallback', () => {
    it('records a screen and keeps the earlier record untouched', () => {
        const first = {};
        const next = noteFallback(first, 'wallet', 'drawn');
        expect(next).toEqual({ wallet: 'drawn' });
        expect(first).toEqual({});
    });
    it('is idempotent and the first mode stays', () => {
        const once = noteFallback({}, 'miniature', 'thumbnail');
        expect(noteFallback(once, 'miniature', 'drawn')).toBe(once);
        expect(noteFallback(once, 'miniature', 'thumbnail')).toEqual({ miniature: 'thumbnail' });
    });
    it('keeps other screens', () => {
        expect(noteFallback({ wallet: 'drawn' }, 'notebook', 'icon')).toEqual({ wallet: 'drawn', notebook: 'icon' });
    });
});
