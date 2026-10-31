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

    it('records a fallback only for a tile that is not loading', () => {
        expect(source).toMatch(/if \(mode !== 'live' && !loading\) recordFallback/);
        expect(source.match(/recordFallback\(/g)).toHaveLength(1);
        expect(source).toContain('tileLoading(room.id, extras.pending)');
    });

    it('bursts once per visit, only when the scene asks for a burst', () => {
        expect(source).toMatch(/extras\.burst > 0 && !this\.burstPlayed/);
        expect(source).toMatch(/hide\(\)[\s\S]*this\.burst\?\.destroy\(\)/);
    });
});
