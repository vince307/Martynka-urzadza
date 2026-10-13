// Origin: S-12 phase 2, test-plan risk #7 (an imported file is validated before it replaces the save).
// Oracle: research section 2 of save-export-import-reset: a parsable but wrong file must never be accepted
// ("JSON.parse succeeded" is not a valid file); frozen fixtures tests/fixtures/save-v1*.json are the valid inputs.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeSave, saveProblem, validateSave, type SessionSave } from '../src/core/save';
import { SAVE_FILE_APP, exportFileText, parseImport, saveSummary } from '../src/core/saveFile';
import type { RoomDef, SaveState } from '../src/core/types';

const fixture = (name: string): Record<string, unknown> =>
    JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;
const clone = <T>(v: T): T => structuredClone(v);
const MAX = 1_000_000;
const v1 = (): SaveState => fixture('save-v1.json') as unknown as SaveState;
const decoded = (): SessionSave => {
    const d = decodeSave(v1());
    if (d.kind !== 'ok') throw new Error('fixture must decode');
    return d.session;
};
const envelope = (save: unknown): string =>
    JSON.stringify({ app: SAVE_FILE_APP, kind: 'save', build: 'abc1234', exportedAt: '2026-10-13T10:00:00.000Z', save });

describe('parseImport accepts what the game saved', () => {
    it('an exported envelope gives the saved session and the file metadata', () => {
        expect(parseImport(envelope(v1()), MAX)).toEqual({
            kind: 'ok',
            session: decoded(),
            file: { build: 'abc1234', exportedAt: '2026-10-13T10:00:00.000Z' },
        });
    });

    it('a bare v1 save (no envelope) is accepted, metadata null', () => {
        expect(parseImport(JSON.stringify(v1()), MAX)).toEqual({ kind: 'ok', session: decoded(), file: { build: null, exportedAt: null } });
    });

    it('a raw envelope holding a valid v1 value is accepted', () => {
        const text = JSON.stringify({ app: SAVE_FILE_APP, kind: 'raw', build: 'b', exportedAt: 'x', reason: 'corrupt', raw: v1() });
        const r = parseImport(text, MAX);
        expect(r.kind).toBe('ok');
    });

    it('export then import gives the same session', () => {
        const save = v1();
        const text = exportFileText({ kind: 'save', build: 'abc', exportedAt: '2026-10-13T10:00:00.000Z', save });
        expect(parseImport(text, MAX)).toEqual({ kind: 'ok', session: decoded(), file: { build: 'abc', exportedAt: '2026-10-13T10:00:00.000Z' } });
    });

    it('the fresh fixture is accepted too', () => {
        expect(parseImport(JSON.stringify(fixture('save-v1-fresh.json')), MAX).kind).toBe('ok');
    });
});

describe('parseImport rejects what is parsable but not a readable save', () => {
    it('a raw envelope with a future version is future', () => {
        const text = JSON.stringify({ app: SAVE_FILE_APP, kind: 'raw', build: 'b', exportedAt: 'x', reason: 'r', raw: { ...v1(), version: 99 } });
        expect(parseImport(text, MAX)).toMatchObject({ kind: 'rejected', reason: 'future' });
    });

    it('a bare save with version 99 is future', () => {
        expect(parseImport(JSON.stringify({ ...v1(), version: 99 }), MAX)).toMatchObject({ kind: 'rejected', reason: 'future' });
    });

    it.each(['{}', '[]', '42', 'null', '{"app":"inna-gra"}', '{"app":"inna-gra","version":1}'])('not ours: %s', (text) => {
        expect(parseImport(text, MAX)).toMatchObject({ kind: 'rejected', reason: 'not-ours' });
    });

    it('text that is not JSON is not-json', () => {
        expect(parseImport('to nie jest json', MAX)).toMatchObject({ kind: 'rejected', reason: 'not-json' });
    });

    it('text longer than the limit is too-big and is not parsed', () => {
        const text = envelope(v1());
        expect(parseImport(text, text.length - 1)).toMatchObject({ kind: 'rejected', reason: 'too-big' });
        expect(parseImport(text, text.length).kind).toBe('ok');
        expect(parseImport('x'.repeat(50), 10)).toMatchObject({ kind: 'rejected', reason: 'too-big' });
    });

    it('negative stars is corrupt and names the field', () => {
        const bad = { ...clone(v1()), stars: -1 };
        expect(parseImport(envelope(bad), MAX)).toEqual({ kind: 'rejected', reason: 'corrupt', problem: 'stars' });
        expect(parseImport(JSON.stringify(bad), MAX)).toEqual({ kind: 'rejected', reason: 'corrupt', problem: 'stars' });
    });

    it('version 0 has no migration', () => {
        expect(parseImport(JSON.stringify({ ...v1(), version: 0 }), MAX)).toMatchObject({ kind: 'rejected', reason: 'unknown-version' });
    });
});

describe('saveProblem agrees with validateSave', () => {
    const broken: [string, (r: Record<string, unknown>) => void, string][] = [
        ['version', (r) => { r.version = 3; }, 'version'],
        ['profileId', (r) => { r.profileId = 1; }, 'profileId'],
        ['stars', (r) => { r.stars = 1.5; }, 'stars'],
        ['rooms', (r) => { r.rooms = []; }, 'rooms'],
        ['currentRoom', (r) => { r.currentRoom = 'kitchen'; }, 'currentRoom'],
        ['settings', (r) => { r.settings = { autoRead: 'tak' }; }, 'settings'],
        ['learner', (r) => { (r.learner as Record<string, unknown>).stage = 'E9'; }, 'learner'],
    ];
    it.each(broken)('names %s', (_n, mutate, key) => {
        const r = clone(fixture('save-v1.json'));
        mutate(r);
        expect(saveProblem(r)).toBe(key);
        expect(validateSave(r)).toBe(false);
    });

    it.each([null, 'x', 7, [], {}, fixture('save-v1.json'), fixture('save-v1-fresh.json')])('same verdict: %j', (value) => {
        expect(validateSave(value)).toBe(saveProblem(value) === null);
    });

    it('a valid save has no problem', () => {
        expect(saveProblem(fixture('save-v1.json'))).toBeNull();
    });
});

describe('saveSummary', () => {
    const room = (id: string, tasks: number): RoomDef => ({
        id, name: id, background: 'bg', slots: [],
        tasks: Array.from({ length: tasks }, (_, i) => ({ id: `${id}${i}`, slot: 's', label: 'l', cost: 5 })),
    });
    const rooms = { living: room('living', 10), bedroom: room('bedroom', 8) };

    it('reports stars, stage and rooms in the order of the rooms parameter', () => {
        const s = decoded();
        s.rooms = { ...s.rooms, bedroom: { tasksDone: 2, chosen: {} } };
        expect(saveSummary(s, rooms)).toEqual({
            stars: 7,
            stage: 'E3',
            rooms: [{ id: 'living', done: 3, total: 10 }, { id: 'bedroom', done: 2, total: 8 }],
        });
    });

    it('clips done to the number of tasks and skips unknown rooms', () => {
        const s = decoded();
        s.rooms = { living: { tasksDone: 99, chosen: {} }, ghost: { tasksDone: 1, chosen: {} } };
        expect(saveSummary(s, rooms).rooms).toEqual([{ id: 'living', done: 10, total: 10 }]);
    });

    it('no learner means no stage', () => {
        expect(saveSummary({ ...decoded(), learner: null }, rooms).stage).toBeNull();
    });
});

describe('exportFileText', () => {
    it('writes the app marker and never throws on an unserialisable raw value', () => {
        const cyc: Record<string, unknown> = {};
        cyc.self = cyc;
        const text = exportFileText({ kind: 'raw', build: 'b', exportedAt: 'x', reason: 'corrupt', raw: cyc });
        expect(JSON.parse(text)).toMatchObject({ app: SAVE_FILE_APP, kind: 'raw', raw: '[object Object]' });
    });
});
