// Room-load rules (S-22 phase 1). Oracle: synthetic lists and literal ids written here.
import { describe, expect, it } from 'vitest';
import type { RoomListItem } from '../src/core/rooms';
import { cardRooms, roomsToLoad, tileLoading } from '../src/core/roomLoad';

const item = (kind: 'room' | 'teaser', id: string | null, done = false): RoomListItem => ({
    kind,
    id,
    nameKey: id,
    done,
    unlocked: true,
});

const KEYS: Record<string, string[]> = { a: ['a1', 'a2'], b: ['b1', 'shared'], c: ['c1', 'shared'] };
const keysOf = (r: string): string[] => KEYS[r] ?? [];

describe('cardRooms', () => {
    it('lists the rooms in order and skips teasers', () => {
        expect(cardRooms([item('room', 'a', true), item('room', 'b'), item('teaser', null)])).toEqual(['a', 'b']);
    });
});

describe('roomsToLoad', () => {
    it('skips a room whose keys are all cached', () => {
        const r = roomsToLoad(['a', 'b'], keysOf, (k) => k.startsWith('a') || k === 'shared', new Set());
        expect(r).toEqual({ rooms: ['b'], keys: ['b1'] });
    });

    it('skips a room already pending', () => {
        const r = roomsToLoad(['a', 'b'], keysOf, () => false, new Set(['a']));
        expect(r).toEqual({ rooms: ['b'], keys: ['b1', 'shared'] });
    });

    it('deduplicates keys shared by two rooms, in input order', () => {
        const r = roomsToLoad(['b', 'c'], keysOf, () => false, new Set());
        expect(r).toEqual({ rooms: ['b', 'c'], keys: ['b1', 'shared', 'c1'] });
    });

    it('asks for nothing when nothing is wanted', () => {
        expect(roomsToLoad([], keysOf, () => false, new Set())).toEqual({ rooms: [], keys: [] });
    });
});

describe('tileLoading', () => {
    it('is true only for a pending room', () => {
        expect(tileLoading('a', new Set(['a']))).toBe(true);
        expect(tileLoading('b', new Set(['a']))).toBe(false);
    });
});
