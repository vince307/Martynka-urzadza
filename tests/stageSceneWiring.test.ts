import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source guards (kids-room phase 2): every place that draws or fades a room background goes through the pure rule in core/rooms.ts.
// They prove the call sites; the rendered pixels are proven by the e2e spec of the children's room.
const read = (file: string): string => readFileSync(file, 'utf8');

describe('room background call sites', () => {
    it('RoomView.render and miniaturePieces pick the background with sceneKey', () => {
        const text = read('src/ui/widgets/RoomView.ts');
        expect(text.match(/sceneKey\(room, state\)/g)?.length).toBeGreaterThanOrEqual(2);
    });
    it('the stage cross-fade starts from stageFade', () => {
        const text = read('src/scenes/RoomScene.ts');
        expect(text).toContain('stageFade(room, state)');
        expect(text).toContain('fade.from');
    });
    it('backdropMode reads sceneKey', () => {
        expect(read('src/core/backdrop.ts')).toContain('sceneKey(room, state)');
    });
    it('no site keeps the before/after ternary', () => {
        for (const file of ['src/ui/widgets/RoomView.ts', 'src/scenes/RoomScene.ts', 'src/core/backdrop.ts']) {
            const text = read(file);
            expect(text, file).not.toMatch(/scene\.after : /);
            expect(text, file).not.toMatch(/\? room\.scene\.after/);
        }
    });
});
