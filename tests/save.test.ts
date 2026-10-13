// Origin: S-11 phase 1, test-plan risks #2 (a restart keeps progress) and #10 (an unreadable save is never overwritten).
// Oracle: FR-021 (a failed migration keeps the old save) and the frozen v1 fixtures in tests/fixtures/, written by hand
// and never edited (a file save-v<N>.json saved by version N stays as it is; a new version adds its own fixture).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { endRound } from '../src/core/curriculum';
import { placeByChild, type SessionLearner } from '../src/core/placement';
import type { SkillResult } from '../src/core/mastery';
import { purchase } from '../src/core/rooms';
import { DEFAULT_PROFILE, SAVE_VERSION, decodeSave, encodeSave, rawExportText, validateSave, type SessionSave } from '../src/core/save';
import { startLearning } from '../src/core/curriculum';
import type { RoomDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { placementData } from '../src/data/placement';

const fixture = (name: string): unknown => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const clone = <T>(v: T): T => structuredClone(v);
const asRecord = (v: unknown): Record<string, unknown> => v as Record<string, unknown>;

const deepFreeze = <T extends object>(o: T): T => {
    for (const v of Object.values(o) as unknown[]) {
        if (typeof v === 'object' && v !== null) deepFreeze(v);
    }
    return Object.freeze(o);
};

const room: RoomDef = {
    id: 'living',
    name: 'Salon',
    background: 'bg',
    slots: [
        { id: 'floor', x: 0, y: 0, depth: 1, variants: ['a', 'b', 'c'] },
        { id: 'sofa', x: 0, y: 0, depth: 2, variants: ['a', 'b', 'c'] },
    ],
    tasks: [
        { id: 't1', slot: 'floor', label: 'fixFloor', cost: 5 },
        { id: 't2', slot: 'sofa', label: 'sofa', cost: 8 },
    ],
};

describe('frozen v1 fixtures decode to the expected session state', () => {
    it('a learner of E3 after some rounds, a furnished living room', () => {
        const result = decodeSave(fixture('save-v1.json'));
        expect(result).toEqual({
            kind: 'ok',
            migratedFrom: null,
            session: {
                stars: 7,
                rooms: { living: { tasksDone: 3, chosen: { floor: 1, sofa: 0, lamp: 2 } } },
                currentRoom: 'living',
                settings: { autoRead: false },
                learner: {
                    age: 8,
                    stage: 'E3',
                    stageOverriddenByParent: false,
                    warmupPending: false,
                    unlockedStep: { E1: 5, E2: 6, E3: 3, E4: 2, E5: 2, E6: 2 },
                    mastery: { 'E3.add.100': 4, 'E3.mult.table': 2 },
                    streak: { 'E3.add.100': 0, 'E3.mult.table': 1 },
                    history: [
                        { skillId: 'E3.add.100', ok: true, firstTry: true, at: 1760000000000 },
                        { skillId: 'E3.mult.table', ok: true, firstTry: false, at: 1760000001000, example: { prompt: '6 · 7 = ?', given: 36, answer: 42 } },
                    ],
                    weakStreak: 1,
                    easedRounds: 0,
                    pendingUnlock: 3,
                },
            },
        });
    });

    it('a fresh game: no learner, no stars, an untouched room', () => {
        expect(decodeSave(fixture('save-v1-fresh.json'))).toEqual({
            kind: 'ok',
            migratedFrom: null,
            session: { stars: 0, rooms: { living: { tasksDone: 0, chosen: {} } }, currentRoom: 'living', settings: { autoRead: null }, learner: null },
        });
    });

    it('a pending unlock saved for another stage than the learner is on decodes to null', () => {
        const raw = asRecord(clone(fixture('save-v1.json')));
        asRecord(raw.learner).pendingUnlock = { stage: 'E2', step: 3 };
        const result = decodeSave(raw);
        expect(result.kind === 'ok' && result.session.learner?.pendingUnlock).toBeNull();
    });
});

describe('round trip of a session built with the real core functions', () => {
    const placed = placeByChild(8, 9, placementData);
    const adaptation = startLearning(stages, placed.age, 9, placementData, balance.curriculum);
    const stage = stages[placed.stage];
    if (!stage) throw new Error('no stage');
    const skills = stage.steps.flatMap((s) => s.skills).slice(0, 3);
    let adapted = adaptation;
    for (let round = 0; round < 3; round++) {
        const results = skills.map((s, i): SkillResult => ({
            skillId: s.id,
            outcome: i === 1 && round === 1 ? 'second' : 'first',
            ...(i === 1 && round === 1 ? { example: { prompt: '2 + 3 = ?', given: 4, answer: 5 } } : {}),
        }));
        adapted = endRound(adapted, stage, results, 1760000000000 + round, 'round', balance).adaptation;
    }
    const learner: SessionLearner = { ...placed, ...adapted, pendingUnlock: adapted.unlockedStep[placed.stage] };
    const bought = purchase(room, { tasksDone: 0, chosen: {} }, 12, 2);
    if (!bought.ok) throw new Error('purchase refused');
    const session: SessionSave = {
        stars: bought.stars,
        rooms: { living: bought.state },
        currentRoom: 'living',
        settings: { autoRead: true },
        learner,
    };

    it('decodes to the same state after a structured clone (what IndexedDB does)', () => {
        const result = decodeSave(clone(encodeSave(session)));
        expect(result).toEqual({ kind: 'ok', migratedFrom: null, session });
    });

    it('a game without a learner round-trips and encodes the current version', () => {
        const fresh: SessionSave = { stars: 0, rooms: { living: { tasksDone: 0, chosen: {} } }, currentRoom: 'living', settings: { autoRead: null }, learner: null };
        const encoded = encodeSave(fresh);
        expect(encoded.version).toBe(SAVE_VERSION);
        expect(encoded.profileId).toBe(DEFAULT_PROFILE);
        expect(decodeSave(clone(encoded))).toEqual({ kind: 'ok', migratedFrom: null, session: fresh });
    });

    it('does not save a session-only field added to the learner', () => {
        const encoded = encodeSave({ ...session, learner: { ...learner, extra: 1 } as SessionLearner });
        expect(Object.keys(asRecord(encoded.learner)).sort()).toEqual(
            ['age', 'easedRounds', 'history', 'mastery', 'pendingUnlock', 'stage', 'stageOverriddenByParent', 'streak', 'unlockedStep', 'warmupPending', 'weakStreak'],
        );
    });

    it('saves a pending unlock with the stage of the learner', () => {
        const encoded = encodeSave(session);
        expect(encoded.learner?.pendingUnlock).toEqual({ stage: placed.stage, step: adapted.unlockedStep[placed.stage] });
    });
});

describe('what is not a readable save is unreadable, never a thrown error', () => {
    it.each([null, 'x', 7, [], {}, { version: '1' }, { version: 1.5 }])('corrupt: %j', (raw) => {
        expect(decodeSave(raw)).toEqual({ kind: 'unreadable', reason: 'corrupt' });
    });

    it('a save from a future version is left alone', () => {
        expect(decodeSave({ ...asRecord(fixture('save-v1.json')), version: 2 })).toEqual({ kind: 'unreadable', reason: 'future' });
    });

    it('version 0 has no migration step', () => {
        expect(decodeSave({ ...asRecord(fixture('save-v1.json')), version: 0 })).toEqual({ kind: 'unreadable', reason: 'unknown-version' });
    });

    const broken: [string, (raw: Record<string, unknown>) => void][] = [
        ['negative stars', (r) => { r.stars = -1; }],
        ['fractional stars', (r) => { r.stars = 1.5; }],
        ['unknown stage', (r) => { asRecord(r.learner).stage = 'E9'; }],
        ['variant 3', (r) => { asRecord(asRecord(r.rooms).living).chosen = { floor: 3 }; }],
        ['current room outside the rooms', (r) => { r.currentRoom = 'kitchen'; }],
        ['history entry with ok as text', (r) => { asRecord(r.learner).history = [{ skillId: 'a', ok: 'tak', firstTry: true, at: 1 }]; }],
        ['mastery below zero', (r) => { asRecord(r.learner).mastery = { a: -1 }; }],
        ['autoRead as text', (r) => { r.settings = { autoRead: 'tak' }; }],
        ['tasksDone fractional', (r) => { asRecord(asRecord(r.rooms).living).tasksDone = 0.5; }],
    ];
    it.each(broken)('a v1 save with %s is corrupt', (_name, mutate) => {
        const raw = asRecord(clone(fixture('save-v1.json')));
        mutate(raw);
        expect(validateSave(raw)).toBe(false);
        expect(decodeSave(raw)).toEqual({ kind: 'unreadable', reason: 'corrupt' });
    });

    it('the fixtures themselves pass validation', () => {
        expect(validateSave(fixture('save-v1.json'))).toBe(true);
        expect(validateSave(fixture('save-v1-fresh.json'))).toBe(true);
    });
});

describe('the migration chain', () => {
    const v0 = { version: 0, coins: 4, rooms: { living: { tasksDone: 0, chosen: {} } } };
    const step0 = (raw: unknown): unknown => {
        const o = asRecord(raw);
        return { version: 1, profileId: 'default', stars: o.coins, rooms: o.rooms, currentRoom: 'living', settings: { autoRead: null }, learner: null };
    };

    it('runs the steps from the saved version up and reports where it started', () => {
        expect(decodeSave(v0, { 0: step0 })).toEqual({
            kind: 'ok',
            migratedFrom: 0,
            session: { stars: 4, rooms: { living: { tasksDone: 0, chosen: {} } }, currentRoom: 'living', settings: { autoRead: null }, learner: null },
        });
    });

    it('a throwing step is a corrupt save, not an exception', () => {
        expect(decodeSave(v0, { 0: () => { throw new Error('boom'); } })).toEqual({ kind: 'unreadable', reason: 'corrupt' });
    });

    it('a missing step is an unknown version', () => {
        expect(decodeSave(v0, {})).toEqual({ kind: 'unreadable', reason: 'unknown-version' });
    });

    it('a step whose result is not valid v1 is corrupt', () => {
        expect(decodeSave(v0, { 0: (raw) => ({ ...asRecord(step0(raw)), stars: -3 }) })).toEqual({ kind: 'unreadable', reason: 'corrupt' });
    });
});

describe('the decoder does not mutate its input', () => {
    it('decodes a deeply frozen save', () => {
        const frozen = deepFreeze(clone(fixture('save-v1.json')) as object);
        expect(decodeSave(frozen).kind).toBe('ok');
    });
    it('the result shares no object with the input', () => {
        const raw = asRecord(clone(fixture('save-v1.json')));
        const result = decodeSave(raw);
        if (result.kind !== 'ok') throw new Error('unreadable');
        asRecord(asRecord(raw.rooms).living).tasksDone = 99;
        expect(result.session.rooms.living.tasksDone).toBe(3);
    });
});

describe('rawExportText never throws', () => {
    it('indents an object as JSON', () => {
        expect(rawExportText({ a: 1 })).toBe('{\n  "a": 1\n}');
    });
    it('falls back to String for a BigInt and a cycle', () => {
        expect(rawExportText({ n: 1n })).toBe('[object Object]');
        const cycle: Record<string, unknown> = {};
        cycle.self = cycle;
        expect(rawExportText(cycle)).toBe('[object Object]');
    });
});
