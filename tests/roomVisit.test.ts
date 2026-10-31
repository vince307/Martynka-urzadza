import { describe, expect, it } from 'vitest';
import { visitTarget } from '../src/core/roomVisit';
import type { RoomListItem } from '../src/core/rooms';

const room = (id: string, done: boolean): RoomListItem => ({ kind: 'room', id, nameKey: id, done, unlocked: true });
const teaser: RoomListItem = { kind: 'teaser', id: null, nameKey: null, done: false, unlocked: false };

describe('visitTarget', () => {
    it('leads to the done salon while the kitchen is in renovation', () => {
        expect(visitTarget([room('salon', true), room('kitchen', false)], 'kitchen', null)).toBe('salon');
    });
    it('leads back to the room in renovation while visiting', () => {
        expect(visitTarget([room('salon', true), room('kitchen', false)], 'kitchen', 'salon')).toBe('kitchen');
    });
    it('is null when no other room is done', () => {
        expect(visitTarget([room('salon', false), room('kitchen', false)], 'salon', null)).toBeNull();
        expect(visitTarget([room('salon', true), room('kitchen', false)], 'salon', null)).toBeNull();
    });
    it('picks the other done room when both are done', () => {
        expect(visitTarget([room('salon', true), room('kitchen', true)], 'kitchen', null)).toBe('salon');
    });
    it('never targets a teaser', () => {
        expect(visitTarget([room('salon', true), teaser], 'salon', null)).toBeNull();
        expect(visitTarget([teaser, room('kitchen', false)], 'kitchen', null)).toBeNull();
    });
});
