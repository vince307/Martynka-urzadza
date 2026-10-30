// Origin: rooms-as-data phase 2 (F-04). Save format v5 adds `house` (the rooms of the house and their cells). Oracles: the frozen
// fixtures in tests/fixtures/ (v4 proven by the v4 code in phase 1) and literal houses written here, never the migration's own output.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, SAVE_VERSION, decodeSave, encodeSave, importProblem, saveProblem } from '../src/core/save';

const fixture = (name: string): Record<string, unknown> => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;
const clone = <T>(v: T): T => structuredClone(v);
const SALON_HOUSE = { id: 'house-1', rooms: [{ room: 'salon', floor: 0, place: 0 }] };

describe('save format v5', () => {
    it('is the current version', () => {
        expect(SAVE_VERSION).toBe(5);
    });

    it('lifts the v4 salon fixture to v5 with only the house added', () => {
        const v4 = fixture('save-v4-salon.json');
        const before = clone(v4);
        const lifted = MIGRATIONS[4](v4);
        expect(v4).toEqual(before);
        expect(lifted).toEqual({ ...before, version: 5, house: SALON_HOUSE });
        expect(saveProblem(lifted)).toBeNull();
    });

    it('two lifts do not share the house object', () => {
        const a = MIGRATIONS[4](fixture('save-v4-salon.json')) as { house: typeof SALON_HOUSE };
        const b = MIGRATIONS[4](fixture('save-v4-salon.json')) as { house: typeof SALON_HOUSE };
        expect(a.house).not.toBe(b.house);
        expect(a.house.rooms).not.toBe(b.house.rooms);
        a.house.rooms.push({ room: 'x', floor: 1, place: 1 });
        expect(b.house.rooms).toHaveLength(1);
    });

    it('decodes the v4 salon fixture as migrated from 4 and keeps every field of the game', () => {
        const raw = fixture('save-v4-salon.json');
        const r = decodeSave(raw);
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBe(4);
        expect(r.session.house).toEqual(SALON_HOUSE);
        expect(r.session.stars).toBe(raw.stars);
        expect(r.session.rooms).toEqual(raw.rooms);
        expect(r.session.settings).toEqual(raw.settings);
        expect(r.session.variants).toEqual(raw.variants);
        expect(r.session.learner?.stage).toBe('E2');
        expect(r.session.currentRoom).toBe('salon');
    });

    it.each(['save-v4-salon.json', 'save-v4.json'])('%s survives decode and encode whole: only the version, the house and the guard placeholders change', (name) => {
        const raw = fixture(name);
        const r = decodeSave(clone(raw));
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(encodeSave(r.session)).toEqual({ ...raw, version: 5, house: SALON_HOUSE, generation: 0, writer: '' });
    });

    it('keeps the room of a v4 save that is not the salon', () => {
        const r = decodeSave(fixture('save-v4.json'));
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBe(4);
        expect(r.session.currentRoom).toBe('living');
        expect(Object.keys(r.session.rooms)).toEqual(Object.keys(fixture('save-v4.json').rooms as object));
    });

    it('the v5 fixture decodes unmigrated and encodes back except for the guard placeholders', () => {
        const raw = fixture('save-v5.json');
        const r = decodeSave(raw);
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(r.migratedFrom).toBeNull();
        expect(encodeSave(r.session)).toEqual({ ...raw, generation: 0, writer: '' });
    });

    it('encodeSave copies the house', () => {
        const r = decodeSave(fixture('save-v5.json'));
        if (r.kind !== 'ok') throw new Error('unreadable');
        const out = encodeSave(r.session);
        expect(out.house).not.toBe(r.session.house);
        expect(out.house.rooms).not.toBe(r.session.house.rooms);
    });

    it.each([
        ['a missing house', undefined],
        ['rooms not an array', { id: 'h', rooms: {} }],
        ['a negative floor', { id: 'h', rooms: [{ room: 'salon', floor: -1, place: 0 }] }],
        ['a non-string room', { id: 'h', rooms: [{ room: 3, floor: 0, place: 0 }] }],
        ['a fractional place', { id: 'h', rooms: [{ room: 'salon', floor: 0, place: 0.5 }] }],
        ['a non-string id', { id: 7, rooms: [] }],
    ])('names house for %s', (_n, house) => {
        const v = { ...fixture('save-v5.json'), house };
        if (house === undefined) delete (v as { house?: unknown }).house;
        expect(saveProblem(v)).toBe('house');
    });

    it('accepts duplicates and unknown room ids in the house', () => {
        const house = { id: 'unknown-house', rooms: [{ room: 'salon', floor: 0, place: 0 }, { room: 'salon', floor: 0, place: 0 }, { room: 'attic', floor: 2, place: 3 }] };
        expect(saveProblem({ ...fixture('save-v5.json'), house })).toBeNull();
    });

    it('checks the house after stars (a broken stars value is named first)', () => {
        expect(saveProblem({ ...fixture('save-v5.json'), stars: -1, house: undefined })).toBe('stars');
    });

    it('the v4 salon fixture is importable', () => {
        expect(importProblem(fixture('save-v4-salon.json'))).toBeNull();
    });

    it('a v6 save is future', () => {
        expect(decodeSave({ ...fixture('save-v5.json'), version: 6 })).toEqual({ kind: 'unreadable', reason: 'future' });
    });
});
