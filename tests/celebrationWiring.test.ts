// S-22 phase 4 wiring: the room celebration and the move after "Dalej". The scenes need Phaser, so this reads the sources.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const read = (rel: string): string => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const parse = (rel: string): ts.SourceFile => ts.createSourceFile(rel, read(rel), ts.ScriptTarget.Latest, true);

/** Calls of a source in document order, with the text of their arguments. */
const calls = (sf: ts.SourceFile): { name: string; pos: number; text: string }[] => {
    const out: { name: string; pos: number; text: string }[] = [];
    const visit = (n: ts.Node): void => {
        if (ts.isCallExpression(n)) out.push({ name: n.expression.getText(sf), pos: n.getStart(sf), text: n.getText(sf) });
        ts.forEachChild(n, visit);
    };
    visit(sf);
    return out;
};

/** The body text of a class method, so a guard looks at one method only. */
const method = (sf: ts.SourceFile, name: string): string => {
    let body = '';
    const visit = (n: ts.Node): void => {
        if (ts.isMethodDeclaration(n) && n.name.getText(sf) === name) body = n.getText(sf);
        ts.forEachChild(n, visit);
    };
    visit(sf);
    return body;
};

describe('room celebration wiring', () => {
    const room = read('src/scenes/RoomScene.ts');

    it('RoomScene asks for the room intensity only', () => {
        expect(room).toMatch(/celebrationView\('room'/);
        expect(room).not.toMatch(/celebrationView\('(house|street)'/);
    });

    it('the delay of the card comes from revealMs, not from a fixed number', () => {
        const dispatch = method(parse('src/scenes/RoomScene.ts'), 'dispatch');
        expect(dispatch).toMatch(/celebrationView\('room', prefersReducedMotion\(\), ANIMATION\.celebration\)\.revealMs/);
        expect(dispatch).not.toMatch(/delayedCall\(\s*\d/);
        expect(dispatch).not.toMatch(/Math\.max\(ANIMATION/);
    });

    it('the last purchase queues the art of the rooms on the card', () => {
        expect(method(parse('src/scenes/RoomScene.ts'), 'dispatch')).toMatch(/ensure\(cardRooms\(/);
    });

    it('"Dalej" moves with nextRoom and saves after both registry writes', () => {
        const sf = parse('src/scenes/RoomScene.ts');
        const body = ts.createSourceFile('m.ts', method(sf, 'moveAfterDone'), ts.ScriptTarget.Latest, true);
        const c = calls(body);
        const at = (pred: (x: { name: string; text: string }) => boolean): number => c.find(pred)?.pos ?? -1;
        const next = at((x) => x.name === 'nextRoom');
        const rooms = at((x) => x.name === 'this.registry.set' && x.text.includes('REGISTRY_KEYS.rooms'));
        const current = at((x) => x.name === 'this.registry.set' && x.text.includes('REGISTRY_KEYS.currentRoom'));
        const flush = at((x) => x.name.endsWith('?.flush') || x.name.endsWith('.flush'));
        expect(next).toBeGreaterThan(-1);
        expect(rooms).toBeGreaterThan(next);
        expect(current).toBeGreaterThan(rooms);
        expect(flush).toBeGreaterThan(current);
        expect(c.find((x) => x.name.endsWith('flush'))?.text).toContain("'now'");
        expect(method(sf, 'moveAfterDone')).toMatch(/refreshHealth\(/);
    });

    it('the card callback runs the move before the redraw', () => {
        const create = method(parse('src/scenes/RoomScene.ts'), 'create');
        expect(create.indexOf('this.moveAfterDone()')).toBeGreaterThan(-1);
        expect(create.indexOf('this.moveAfterDone()')).toBeLessThan(create.indexOf('this.redraw()', create.indexOf('this.moveAfterDone()')));
    });

    it('the room redraws on a room load and stops listening on shutdown', () => {
        expect(room).toContain('changedata-${REGISTRY_KEYS.roomLoad}');
        expect(room).toMatch(/off\(`changedata-\$\{REGISTRY_KEYS\.roomLoad\}`/);
    });

    it('TaskScene draws the backdrop again when a room arrived since the last capture (F3)', () => {
        const task = read('src/scenes/TaskScene.ts');
        expect(task).toMatch(/REGISTRY_KEYS\.roomLoad\) !== this\.backdropRoomLoad/);
        expect(task).toMatch(/this\.backdropRoomLoad = this\.registry\.get\(REGISTRY_KEYS\.roomLoad\)/);
    });

    it('the celebration numbers are data', () => {
        const layout = read('src/data/layout.ts');
        expect(layout).toMatch(/celebration: \{[\s\S]*room: \{ holdMs/);
    });
});
