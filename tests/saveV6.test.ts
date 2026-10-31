// Origin: first-building-choice phase 2 (S-28). Save format v6 is the v5 shape under a rollback guard: a build that predates the
// base building meets v6 as `future` and never overwrites it. Oracles: the frozen v5 fixture (proven by v5 code in phase 1) and
// a literal spread of it, never the migration's own output.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, SAVE_VERSION, decodeSave, importProblem, saveProblem } from '../src/core/save';

const fixture = (name: string): Record<string, unknown> => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;

describe('save format v6', () => {
    it('is the current version', () => {
        expect(SAVE_VERSION).toBe(6);
    });

    it('lifts the v5 salon fixture by changing the version only, without mutating the input', () => {
        const v5 = fixture('save-v5-salon.json');
        const before = structuredClone(v5);
        const lifted = MIGRATIONS[5](v5);
        expect(v5).toEqual(before);
        expect(lifted).toEqual({ ...before, version: 6 });
        expect(saveProblem(lifted)).toBeNull();
    });

    it('decodes the v5 salon fixture as migrated from 5 and keeps the house as saved', () => {
        const raw = fixture('save-v5-salon.json');
        const r = decodeSave(raw);
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBe(5);
        expect(r.session.house).toEqual(raw.house);
        expect(r.session.house.id).toBe('house-1');
        expect(r.session.stars).toBe(raw.stars);
        expect(r.session.rooms).toEqual(raw.rooms);
        expect(r.session.learner).toEqual(raw.learner);
    });

    it('decodes the v6 base fixture without a migration', () => {
        const r = decodeSave(fixture('save-v6.json'));
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBeNull();
        expect(r.session.house.id).toBe('base-1');
        expect(r.session.currentRoom).toBe('bridge');
    });

    it('meets a v7 save as future', () => {
        expect(decodeSave({ ...fixture('save-v6.json'), version: 7 })).toEqual({ kind: 'unreadable', reason: 'future' });
    });

    it('lets the import preview accept a v5 save', () => {
        expect(importProblem(fixture('save-v5-salon.json'))).toBeNull();
    });

    it('keeps the migration frozen: no data import, no copyHouse', () => {
        const src = readFileSync(new URL('../src/core/migrations/building.ts', import.meta.url), 'utf8');
        expect(src).not.toMatch(/from\s+['"][^'"]*\/data\//);
        expect(src).not.toMatch(/copyHouse/);
    });
});
