// Origin: S-12 phase 2, test-plan risk #7 (an imported file is validated before it replaces the save).
// Oracle: research section 2 of save-export-import-reset: a parsable but wrong file must never be accepted
// ("JSON.parse succeeded" is not a valid file); frozen fixtures tests/fixtures/save-v1*.json are the valid inputs.
import { backupExtras } from './helpers';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createAutosaver, type AutosaveStatus, type BlockReason } from '../src/core/autosave';
import { SAVE_VERSION, decodeSave, encodeSave, freshSession, saveProblem, validateSave, type SessionSave } from '../src/core/save';
import { SAVE_FILE_APP, deviceSaveView, exportFileText, parseImport, saveSummary } from '../src/core/saveFile';
import { ROOMS } from '../src/data/rooms';
import type { RoomDef, SaveState } from '../src/core/types';
import { TEST_ROOM_PARTS } from './roomFixtures';

const fixture = (name: string): Record<string, unknown> =>
    JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;
const clone = <T>(v: T): T => structuredClone(v);
const MAX = 1_000_000;
const v1 = (): SaveState => fixture('save-v1.json') as unknown as SaveState;
const v3 = (): SaveState => fixture('save-v4.json') as unknown as SaveState;
const decoded = (): SessionSave => {
    const d = decodeSave(v1());
    if (d.kind !== 'ok') throw new Error('fixture must decode');
    return d.session;
};
const envelope = (save: unknown): string =>
    JSON.stringify({ app: SAVE_FILE_APP, kind: 'save', build: 'abc1234', exportedAt: '2026-10-13T10:00:00.000Z', save });

describe('parseImport and the v1 -> v2 format change (S-15)', () => {
    it('a file exported by a v1 build imports with the starting variants', () => {
        const r = parseImport(envelope(v1()), MAX);
        expect(r.kind === 'ok' && r.session.variants).toEqual({ roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] });
    });

    it('a v2 file imports with its variants', () => {
        const v2 = fixture('save-v2.json');
        const r = parseImport(envelope(v2), MAX);
        expect(r.kind === 'ok' && r.session.variants.puzzlesDone).toEqual(['logic.e3.a', 'logic.e3.b']);
    });
});

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
        ['version', (r) => { r.version = 2; }, 'version'],
        ['variants', (r) => { r.variants = { roundsSince: -1 }; }, 'variants'],
        ['profileId', (r) => { r.profileId = 1; }, 'profileId'],
        ['stars', (r) => { r.stars = 1.5; }, 'stars'],
        ['rooms', (r) => { r.rooms = []; }, 'rooms'],
        ['currentRoom', (r) => { r.currentRoom = 'kitchen'; }, 'currentRoom'],
        ['settings', (r) => { r.settings = { autoRead: 'tak' }; }, 'settings'],
        ['learner', (r) => { (r.learner as Record<string, unknown>).stage = 'E9'; }, 'learner'],
    ];
    it.each(broken)('names %s', (_n, mutate, key) => {
        const r = clone(fixture('save-v4.json'));
        mutate(r);
        expect(saveProblem(r)).toBe(key);
        expect(validateSave(r)).toBe(false);
    });

    it.each([null, 'x', 7, [], {}, fixture('save-v4.json'), fixture('save-v3.json'), fixture('save-v2.json'), fixture('save-v2-fresh.json'), fixture('save-v1.json')])('same verdict: %j', (value) => {
        expect(validateSave(value)).toBe(saveProblem(value) === null);
    });

    it('a valid save has no problem', () => {
        expect(saveProblem(fixture('save-v4.json'))).toBeNull();
        expect(saveProblem(fixture('save-v2.json'))).toBe('version');
    });
});

describe('saveSummary', () => {
    const room = (id: string, tasks: number): RoomDef => ({
        id, name: id, ...TEST_ROOM_PARTS, slots: [],
        tasks: Array.from({ length: tasks }, (_, i) => ({ kind: 'slot' as const, id: `${id}${i}`, slot: 's', label: 'l', cost: 5 })),
    });
    const rooms = { living: room('living', 10), bedroom: room('bedroom', 8) };

    it('reports stars, stage and rooms in the order of the rooms parameter', () => {
        const s = decoded();
        s.rooms = { ...s.rooms, bedroom: { tasksDone: 2, chosen: {} } };
        expect(saveSummary(s, rooms)).toMatchObject({
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

    it('mismatch: a salon that fits the game is false, an over-count is true (R-4)', () => {
        const fits = { ...decoded(), rooms: { salon: { tasksDone: 3, chosen: { sofa: 0 as const } } } };
        expect(saveSummary(fits, ROOMS).mismatch).toBe(false);
        const over = { ...decoded(), rooms: { salon: { tasksDone: 99, chosen: {} } } };
        expect(saveSummary(over, ROOMS).mismatch).toBe(true);
        expect(saveSummary({ ...decoded(), rooms: { salon: { tasksDone: 7, chosen: { curtains: 1 as const } } } }, ROOMS).mismatch).toBe(true);
    });

    it('mismatch: a room this build does not know is not shown to a parent', () => {
        const old = { ...decoded(), rooms: { living: { tasksDone: 3, chosen: { sofa: 0 as const } } } };
        expect(saveSummary(old, ROOMS).mismatch).toBe(false);
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

describe('deviceSaveView (S12-01): the dialogs never show a fresh in-memory session as the device save', () => {
    const rooms = { living: ((): RoomDef => ({ id: 'living', slots: [], tasks: new Array(10).fill(null) }) as unknown as RoomDef)() };

    const st = (blockedBy: BlockReason | null, loadReason: AutosaveStatus['loadReason'] = null, loadError: string | null = null, unavailableStarts = 2) => ({ blockedBy, loadReason, loadError, unavailableStarts });

    it('a healthy save gives the summary', () => {
        const view = deviceSaveView(st(null), v3(), rooms);
        expect(view).toEqual({ kind: 'summary', summary: saveSummary(decoded(), rooms) });
    });

    it('a healthy but undecodable state is broken', () => {
        expect(deviceSaveView(st(null), { version: 1 } as unknown as SaveState, rooms)).toEqual({ kind: 'broken' });
    });

    it('a plain corrupt save is named, never summarised (overwriting stays allowed)', () => {
        expect(deviceSaveView(st('unreadable', 'corrupt'), v3(), rooms)).toEqual({ kind: 'unreadable' });
        expect(deviceSaveView({ ...st('unreadable', 'corrupt'), loadFrom: SAVE_VERSION }, v3(), rooms)).toEqual({ kind: 'unreadable' });
    });

    // save-truth phase 2 (SRR-09, deliberate reversal): these keep the old save until a second confirmation.
    it.each([['unknown-version', undefined], ['migration-failed', undefined], ['corrupt', 2]] as const)('an unreadable (%s, from %s) save is blocked and forceable', (reason, loadFrom) => {
        const status = loadFrom === undefined ? st('unreadable', reason) : { ...st('unreadable', reason), loadFrom };
        expect(deviceSaveView(status, v3(), rooms)).toEqual({ kind: 'blocked', cause: 'unreadable', forceable: true });
    });

    it('a future save is blocked, never forceable', () => {
        expect(deviceSaveView(st('unreadable', 'future'), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'future', forceable: false });
    });

    it('a timeout read is blocked, never forceable', () => {
        expect(deviceSaveView(st('unavailable', null, 'timeout'), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'timeout', forceable: false });
        // IndexedDB's own DOMException for a transaction that ran out of time: the save may be healthy too (impl-review F1).
        expect(deviceSaveView(st('unavailable', null, 'TimeoutError'), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'timeout', forceable: false });
    });

    it('a refused read on the first start is named unavailable-first and not forceable; from the second start it is forceable (SRR-08)', () => {
        expect(deviceSaveView(st('unavailable', null, 'SecurityError', 1), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'unavailable-first', forceable: false });
        expect(deviceSaveView(st('unavailable', null, 'SecurityError', 0), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'unavailable-first', forceable: false });
        expect(deviceSaveView(st('unavailable', null, 'SecurityError', 2), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'unavailable', forceable: true });
        // A timeout keeps its own cause whatever the count.
        expect(deviceSaveView(st('unavailable', null, 'timeout', 1), v3(), rooms)).toMatchObject({ cause: 'timeout' });
    });

    it('a refused read is blocked and forceable; fatal is not', () => {
        expect(deviceSaveView(st('unavailable', null, 'SecurityError'), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'unavailable', forceable: true });
        expect(deviceSaveView(st('fatal'), v3(), rooms)).toEqual({ kind: 'blocked', cause: 'fatal', forceable: false });
    });

    it('forceable agrees with Autosaver.replace({ force: true }) for every combination (lockstep)', async () => {
        const reasons = [null, 'corrupt', 'future', 'unknown-version', 'migration-failed'] as const;
        const errors = [null, 'timeout', 'TimeoutError', 'SecurityError'] as const;
        for (const blockedBy of ['unreadable', 'unavailable', 'fatal'] as const)
            for (const loadReason of reasons)
                for (const loadError of errors)
                  for (const unavailableStarts of [1, 2]) {
                    const writes: SaveState[] = [];
                    const saver = createAutosaver({
                        store: { read: () => Promise.resolve(undefined), ...backupExtras, backup: () => Promise.resolve('written' as const), write: (v) => (writes.push(v), Promise.resolve()) },
                        snapshot: () => decoded(),
                        timers: { setTimeout: () => 0, clearTimeout: () => undefined },
                        delayMs: 500,
                        writeTimeoutMs: 5000,
                        backupAttempts: 3,
                        load: 'fresh',
                        blockedBy,
                        now: () => 0,
                        log: () => undefined,
                        ...(loadReason ? { loadReason } : {}),
                        ...(loadError ? { loadError } : {}),
                        unavailableStarts,
                    });
                    const view = deviceSaveView(saver.status(), v3(), rooms);
                    await saver.replace(v3(), { force: true });
                    const wrote = writes.length === 1;
                    const forceable = view.kind === 'blocked' && view.forceable;
                    const open = view.kind === 'unreadable';
                    expect(wrote, JSON.stringify({ blockedBy, loadReason, loadError, unavailableStarts })).toBe(forceable || open);
                }
    });
});

describe('deviceSaveView newer (P-5)', () => {
    it('a newer-save block is blocked, never forceable', () => {
        const rooms = { living: { id: 'living', tasks: [] } as unknown as RoomDef };
        const current = encodeSave(freshSession('living'));
        expect(deviceSaveView({ blockedBy: 'newer', loadReason: null, loadError: null }, current, rooms)).toEqual({ kind: 'blocked', cause: 'newer', forceable: false });
    });
});

describe('deviceSaveView otherTab (stale tab)', () => {
    it('an other-writer block is blocked, never forceable', () => {
        const rooms = { living: { id: 'living', tasks: [] } as unknown as RoomDef };
        const current = encodeSave(freshSession('living'));
        expect(deviceSaveView({ blockedBy: 'otherTab', loadReason: null, loadError: null }, current, rooms)).toEqual({ kind: 'blocked', cause: 'otherTab', forceable: false });
    });
});

describe('an exported old-version copy imports again (save-truth p9, SV2-04)', () => {
    it('a raw backup-v1 envelope parses back to a current-format session', () => {
        const text = exportFileText({ kind: 'raw', build: 'abc1234', exportedAt: '2026-10-17T10:00:00.000Z', reason: 'backup-v1', raw: v1() });
        const r = parseImport(text, MAX);
        expect(r.kind).toBe('ok');
        if (r.kind === 'ok') expect(encodeSave(r.session).version).toBe(SAVE_VERSION);
    });
});
