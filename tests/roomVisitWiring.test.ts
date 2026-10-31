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
    it('a wake without data ends a visit: refresh takes the wake data', () => {
        expect(body('const refresh = (', 'const onStars')).toContain('data?: unknown');
        expect(body('create(): void {', 'this.view = new RoomView')).toContain('this.visiting = null');
    });
    it('only houseWakeVisit sets visiting on a wake', () => {
        const refresh = body('const refresh = (', 'const onStars');
        expect(refresh).toContain('this.visiting = houseWakeVisit(data');
        expect(refresh.match(/this\.visiting = /g)?.length).toBe(1);
        expect(refresh.indexOf('this.visiting =')).toBeGreaterThan(refresh.indexOf('this.resetGesture()'));
        expect(refresh.indexOf('this.visiting =')).toBeLessThan(refresh.indexOf('this.redraw()'));
        const sets = source.match(/this\.visiting = (?!null)/g) ?? [];
        expect(sets.length).toBe(1);
    });
    it('onSleep sets visiting to null', () => {
        expect(body('const onSleep = (): void => {', "this.events.on('wake'")).toContain('this.visiting = null');
    });
    it('the house button is hidden while blocked and leads to the house', () => {
        const redraw = body('private redraw()', 'if (this.cardDrawn)');
        expect(redraw).toMatch(/if \(blocked\) \{\s*this\.houseButton\.hide\(\)/);
        expect(source).toContain('this.scene.switch(SCENE_KEYS.house)');
    });
    it('RoomScene imports nothing from roomVisit and has no visit button', () => {
        for (const gone of ['room' + 'Visit', 'visit' + 'Button', 'visit' + 'Target']) {
            expect(source).not.toContain(gone);
        }
    });
    it('the current room is written only by the "Dalej" move', () => {
        const writes = source.split('REGISTRY_KEYS.currentRoom');
        const sets = source.match(/registry\.set\(REGISTRY_KEYS\.currentRoom/g) ?? [];
        expect(sets.length).toBe(1);
        expect(writes.length).toBeGreaterThan(1);
        expect(body('private moveAfterDone()', 'private savedRooms()')).toContain('registry.set(REGISTRY_KEYS.currentRoom');
    });
});
