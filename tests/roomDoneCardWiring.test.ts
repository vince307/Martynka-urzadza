import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/ui/widgets/RoomDoneCard.ts', 'utf8');

describe('RoomDoneCard wiring', () => {
    it('draws every tile from its own room, not from the current one', () => {
        expect(source).not.toContain('UI_ART_KEYS.salonAfter');
        expect(source).not.toContain('pl.room.name');
        expect(source).toContain('catalogue[item.id]');
        expect(source).toMatch(/this.drawRoomTile\(left, room, state,/);
    });
});
