// Origin: house-1-polish phase 1 (S-32). Save format v7: the kitchen renovates in three stages, so a saved kitchen's tasksDone k >= 1
// becomes k + 2. Oracles: the frozen v6 fixture written by the v6 code (save-v6-kitchen-mid.json), the hand-written v7 file
// (save-v7.json) and literals below, never the migration's own output.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, SAVE_VERSION, decodeSave, importProblem } from '../src/core/save';
import { SAVE_FILE_APP, parseImport } from '../src/core/saveFile';

const fixture = (name: string): Record<string, unknown> => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;
const deepFreeze = <T>(v: T): T => {
    if (typeof v === 'object' && v !== null) {
        Object.values(v).forEach(deepFreeze);
        Object.freeze(v);
    }
    return v;
};
const withKitchen = (tasksDone: unknown): Record<string, unknown> => ({ version: 6, rooms: { kitchen: { tasksDone, chosen: { 'kitchen-counter': 1 } } } });
const kitchenOf = (v: unknown): unknown => ((v as { rooms: Record<string, unknown> }).rooms).kitchen;

describe('save format v7', () => {
    it('is the current version', () => {
        expect(SAVE_VERSION).toBe(7);
    });

    it('lifts the v6 mid-kitchen fixture to the frozen v7 file', () => {
        expect(MIGRATIONS[6](fixture('save-v6-kitchen-mid.json'))).toEqual(fixture('save-v7.json'));
    });

    it.each([
        [0, 0],
        [1, 3],
        [3, 5],
        [7, 9],
        [8, 10],
    ])('kitchen tasksDone %i becomes %i and keeps its chosen slots', (before, after) => {
        const lifted = MIGRATIONS[6](deepFreeze(withKitchen(before)));
        expect(kitchenOf(lifted)).toEqual({ tasksDone: after, chosen: { 'kitchen-counter': 1 } });
        expect((lifted as { version: number }).version).toBe(7);
    });

    it('leaves a save without a kitchen, without rooms or with a malformed kitchen alone apart from the version', () => {
        const base = { version: 6, rooms: { bridge: { tasksDone: 4, chosen: {} } }, stars: 3 };
        expect(MIGRATIONS[6](deepFreeze(base))).toEqual({ ...base, version: 7 });
        expect(MIGRATIONS[6]({ version: 6, stars: 3 })).toEqual({ version: 7, stars: 3 });
        expect(MIGRATIONS[6](withKitchen('2'))).toEqual({ ...withKitchen('2'), version: 7 });
        expect(MIGRATIONS[6](withKitchen(1.5))).toEqual({ ...withKitchen(1.5), version: 7 });
        expect(MIGRATIONS[6]({ version: 6, rooms: { kitchen: 4 } })).toEqual({ version: 7, rooms: { kitchen: 4 } });
    });

    it('decodes the v6 mid-kitchen fixture as migrated from 6 with the kitchen moved and the rest kept', () => {
        const raw = fixture('save-v6-kitchen-mid.json') as { stars: number; rooms: Record<string, unknown>; learner: unknown };
        const r = decodeSave(raw);
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBe(6);
        expect(r.session.rooms.kitchen).toEqual({ tasksDone: 5, chosen: { 'kitchen-counter': 1, 'kitchen-fridge': 2 } });
        expect(r.session.rooms.salon).toEqual(raw.rooms.salon);
        expect(r.session.stars).toBe(raw.stars);
        expect(r.session.learner).toEqual(raw.learner);
        expect(r.session.currentRoom).toBe('kitchen');
    });

    it('decodes the v7 file without a migration and meets a v8 save as future', () => {
        const r = decodeSave(fixture('save-v7.json'));
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBeNull();
        expect(r.session.rooms.kitchen.tasksDone).toBe(5);
        expect(decodeSave({ ...fixture('save-v7.json'), version: 8 })).toEqual({ kind: 'unreadable', reason: 'future' });
    });

    it('accepts a v6 save in the import preview and moves the kitchen of an exported v6 envelope', () => {
        const raw = fixture('save-v6-kitchen-mid.json');
        expect(importProblem(raw)).toBeNull();
        const parsed = parseImport(JSON.stringify({ app: SAVE_FILE_APP, kind: 'save', build: 'x', exportedAt: '2026-11-01T00:00:00.000Z', save: raw }), 1_000_000);
        if (parsed.kind !== 'ok') throw new Error(`refused: ${parsed.reason}`);
        expect(parsed.session.rooms.kitchen.tasksDone).toBe(5);
    });

    it('keeps the migration frozen: no data import, no KITCHEN', () => {
        const src = readFileSync(new URL('../src/core/migrations/kitchenStages.ts', import.meta.url), 'utf8');
        expect(src).not.toMatch(/from\s+['"][^'"]*\/data\//);
        expect(src).not.toMatch(/\bKITCHEN\b/);
    });
});
