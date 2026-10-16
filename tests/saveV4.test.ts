// Origin: stale-tab-and-health phase 1 (audit B-1). Save format v4 adds `generation` and `writer`; `writeVerdict` is the pure
// rule the store applies inside its transaction. Oracle: the frozen fixtures in tests/fixtures/ (v1-v3 untouched, v4 new).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, NEWER_SAVE, OTHER_WRITER_SAVE, SAVE_VERSION, decodeSave, encodeSave, importProblem, saveProblem, writeVerdict } from '../src/core/save';

const fixture = (name: string): Record<string, unknown> => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;
const clone = <T>(v: T): T => structuredClone(v);

describe('save format v4', () => {
    it('is the current version', () => {
        expect(SAVE_VERSION).toBe(4);
    });

    it('lifts the populated v3 fixture to v4 with the same game and empty guard fields', () => {
        const v3 = fixture('save-v3.json');
        const before = clone(v3);
        const lifted = MIGRATIONS[3](v3) as Record<string, unknown>;
        expect(v3).toEqual(before);
        expect(lifted).toEqual({ ...before, version: 4, generation: 0, writer: '' });
        expect(saveProblem(lifted)).toBeNull();
    });

    it.each(['save-v1.json', 'save-v2.json', 'save-v2-legacy-salon.json', 'save-v3.json'])('%s decodes with migratedFrom = its version', (name) => {
        const raw = fixture(name);
        const r = decodeSave(raw);
        expect(r.kind).toBe('ok');
        if (r.kind === 'ok') expect(r.migratedFrom).toBe(raw.version);
    });

    it('the populated v3 fixture keeps its stars, rooms and learner', () => {
        const r = decodeSave(fixture('save-v3.json'));
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.session.stars).toBe(7);
        expect(r.session.rooms.living).toEqual({ tasksDone: 3, chosen: { floor: 1, sofa: 0, lamp: 2 } });
        expect(r.session.learner?.stage).toBe('E3');
        expect(r.session.learner?.unlockedStep.E3).toBe(3);
    });

    it('the v4 fixture decodes unmigrated and encodes back except for the guard placeholders', () => {
        const raw = fixture('save-v4.json');
        const r = decodeSave(raw);
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBeNull();
        expect(encodeSave(r.session)).toEqual({ ...raw, generation: 0, writer: '' });
    });

    it.each([[-1], [1.5], ['3'], [null]])('rejects generation %j', (generation) => {
        expect(saveProblem({ ...fixture('save-v4.json'), generation })).toBe('generation');
    });

    it('rejects a writer that is not a string', () => {
        expect(saveProblem({ ...fixture('save-v4.json'), writer: 7 })).toBe('writer');
    });

    it('an import of the v3 fixture is valid after the lift', () => {
        expect(importProblem(fixture('save-v3.json'))).toBeNull();
    });
});

describe('writeVerdict', () => {
    const page = { version: 4, base: 3, writer: 'me' };
    const stored = (generation: unknown, writer: unknown, version = 4) => ({ version, generation, writer });

    it('refuses a newer stored version in both modes', () => {
        expect(writeVerdict(stored(0, 'x', 5), page, 'normal')).toEqual({ kind: 'refuse', error: NEWER_SAVE });
        expect(writeVerdict(stored(0, 'x', 5), page, 'replace')).toEqual({ kind: 'refuse', error: NEWER_SAVE });
    });

    it('refuses another writer that is ahead, in normal mode only', () => {
        expect(writeVerdict(stored(4, 'other'), page, 'normal')).toEqual({ kind: 'refuse', error: OTHER_WRITER_SAVE });
        expect(writeVerdict(stored(4, 'other'), page, 'replace')).toEqual({ kind: 'put', generation: 5 });
    });

    it('puts after its own write that is ahead', () => {
        expect(writeVerdict(stored(6, 'me'), page, 'normal')).toEqual({ kind: 'put', generation: 7 });
    });

    it('puts at an equal generation, even from another writer', () => {
        expect(writeVerdict(stored(3, 'other'), page, 'normal')).toEqual({ kind: 'put', generation: 4 });
    });

    it('puts base + 1 into an empty store or a non-object', () => {
        expect(writeVerdict(undefined, page, 'normal')).toEqual({ kind: 'put', generation: 4 });
        expect(writeVerdict('x', page, 'normal')).toEqual({ kind: 'put', generation: 4 });
    });

    it('treats a malformed stored generation as 0', () => {
        expect(writeVerdict(stored('9', 'other'), page, 'normal')).toEqual({ kind: 'put', generation: 4 });
        expect(writeVerdict({ version: 3 }, page, 'normal')).toEqual({ kind: 'put', generation: 4 });
    });
});
