// F-04 phase 3 wiring: the load path applies the house in the right order, and the room list comes from the house.
// The scenes need Phaser, so this reads the sources (formatting does not matter).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const parse = (rel: string): ts.SourceFile => ts.createSourceFile(rel, readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);

const callPositions = (sf: ts.SourceFile): { name: string; pos: number }[] => {
    const out: { name: string; pos: number }[] = [];
    const visit = (n: ts.Node): void => {
        if (ts.isCallExpression(n)) out.push({ name: n.expression.getText(sf), pos: n.getStart(sf) });
        ts.forEachChild(n, visit);
    };
    visit(sf);
    return out;
};

const filesUnder = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? filesUnder(p) : /\.tsx?$/.test(p) ? [p] : [];
    });

describe('house wiring', () => {
    it('main.ts repairs the current room before it moves to the room in renovation, and compares houses structurally', () => {
        const calls = callPositions(parse('src/main.ts'));
        const first = (name: string): number => calls.find((c) => c.name === name)?.pos ?? -1;
        expect(first('repairCurrentRoom')).toBeGreaterThan(-1);
        expect(first('nextRoom')).toBeGreaterThan(first('repairCurrentRoom'));
        expect(first('houseEqual')).toBeGreaterThan(-1);
    });

    it('RoomScene builds its list from the house', () => {
        expect(callPositions(parse('src/scenes/RoomScene.ts')).some((c) => c.name === 'houseRoomList')).toBe(true);
    });

    it('ROOM_ORDER is gone from src', () => {
        const root = new URL('../src', import.meta.url).pathname;
        const hits = filesUnder(root).filter((f) => readFileSync(f, 'utf8').includes('ROOM_ORDER'));
        expect(hits).toEqual([]);
    });
});
