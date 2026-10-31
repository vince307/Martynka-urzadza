import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/scenes/RoomScene.ts', 'utf8');
const body = (start: string, end: string): string => {
    const from = source.indexOf(start);
    expect(from).toBeGreaterThan(-1);
    const to = source.indexOf(end, from);
    expect(to).toBeGreaterThan(from);
    return source.slice(from, to);
};

describe('RoomScene visit wiring', () => {
    it('resolve reads the visited room before the current room', () => {
        const resolve = body('private resolve()', 'private stars()');
        expect(resolve.indexOf('this.visiting')).toBeGreaterThan(-1);
        expect(resolve.indexOf('this.visiting')).toBeLessThan(resolve.indexOf('REGISTRY_KEYS.currentRoom'));
    });
    it('the wake refresh and onSleep end a visit', () => {
        expect(body('const refresh = ()', 'const onStars')).toContain('this.visiting = null');
        expect(body('const onSleep = ()', "this.events.on('wake'")).toContain('this.visiting = null');
        expect(body('create(): void {', 'this.view = new RoomView')).toContain('this.visiting = null');
    });
    it('the visit tap prefetches the target room', () => {
        expect(body('private visit()', 'private redraw()')).toContain('ensure([');
    });
    it('the current room is written only by the "Dalej" move', () => {
        const writes = source.split('REGISTRY_KEYS.currentRoom');
        const sets = source.match(/registry\.set\(REGISTRY_KEYS\.currentRoom/g) ?? [];
        expect(sets.length).toBe(1);
        expect(writes.length).toBeGreaterThan(1);
        expect(body('private moveAfterDone()', 'private savedRooms()')).toContain('registry.set(REGISTRY_KEYS.currentRoom');
    });
});
