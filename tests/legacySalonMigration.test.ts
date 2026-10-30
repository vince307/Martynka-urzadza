// Origin: salon-load-health phase 1 (audit H-1, M-2, L-1). Oracle: the S-16a remap rules (nothing the child bought is lost,
// stars are never taken, a gifted piece gets a `chosen` entry), written here as literals; the input is the raw v2 save as
// IndexedDB would hand it over, and every case goes through `decodeSave` (the real migration chain), not a bare call.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEGACY_SALON_V2, LIFT_V2_SALON, SALON_V3_TARGET, carryV2Salon } from '../src/core/migrations/legacySalon';
import { MIGRATIONS, decodeSave, encodeSave, freshSession } from '../src/core/save';
import { houseOf } from './helpers';
import { SALON } from '../src/data/rooms';

const fixture = (name: string): Record<string, unknown> =>
    JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as Record<string, unknown>;

/** A raw v2 save whose salon is `salon` (anything, malformed too). */
const v2With = (salon: unknown, extraRooms: Record<string, unknown> = {}): Record<string, unknown> => ({
    ...fixture('save-v2-fresh.json'),
    stars: 7,
    rooms: { salon, ...extraRooms },
    currentRoom: 'salon',
});

const OLD_SLOTS = ['floor', 'walls', 'curtains', 'sofa', 'rug', 'table', 'lamp', 'shelf', 'plant', 'picture'];
/** An old save that bought the first `n` old tasks; old piece i has variant (i + 1) % 3. */
const oldSalon = (n: number): { tasksDone: number; chosen: Record<string, number> } => ({
    tasksDone: n,
    chosen: Object.fromEntries(OLD_SLOTS.slice(0, n).map((slot, i) => [slot, (i + 1) % 3])),
});

const salonOf = (raw: unknown): unknown => {
    const r = decodeSave(raw);
    if (r.kind !== 'ok') throw new Error(`unreadable: ${JSON.stringify(r)}`);
    return r.session.rooms.salon;
};

const sofa1 = { sofa: 1 };
const EXPECTED: [number, number, Record<string, number>][] = [
    [1, 1, {}],
    [2, 2, { sofa: 0 }],
    [3, 3, { sofa: 0, rug: 0 }],
    [4, 4, { sofa: 1, rug: 0, 'coffee-table': 0 }],
    [5, 5, { ...sofa1, rug: 2, 'coffee-table': 0, cabinet: 0 }],
    [6, 6, { ...sofa1, rug: 2, 'coffee-table': 0, cabinet: 0, armchair: 0 }],
    [7, 6, { ...sofa1, rug: 2, 'coffee-table': 0, cabinet: 0, armchair: 0 }],
    [8, 7, { ...sofa1, rug: 2, 'coffee-table': 0, cabinet: 2, armchair: 0, 'wall-frames': 0 }],
    [9, 7, { ...sofa1, rug: 2, 'coffee-table': 0, cabinet: 2, armchair: 0, 'wall-frames': 0 }],
    [10, 7, { ...sofa1, rug: 2, 'coffee-table': 0, cabinet: 2, armchair: 0, 'wall-frames': 1 }],
];

describe('MIGRATIONS[2] lifts the old salon (v2 -> v3)', () => {
    it('is registered next to the v1 step', () => {
        expect(Object.keys(MIGRATIONS).sort()).toEqual(['1', '2', '3', '4']);
    });

    it.each(EXPECTED)('old tasksDone %i becomes %i with the carried variants', (n, done, chosen) => {
        expect(salonOf(v2With(oldSalon(n)))).toEqual({ tasksDone: done, chosen });
    });

    it('never touches the stars, the learner or other rooms, and does not mutate its input', () => {
        const raw = v2With(oldSalon(6), { living: { tasksDone: 2, chosen: { floor: 1 } } });
        const snapshot = structuredClone(raw);
        const r = decodeSave(raw);
        expect(r).toMatchObject({ kind: 'ok', migratedFrom: 2 });
        if (r.kind !== 'ok') return;
        expect(r.session.stars).toBe(7);
        expect(r.session.rooms.living).toEqual({ tasksDone: 2, chosen: { floor: 1 } });
        expect(raw).toEqual(snapshot);
    });

    it('C-2r: a frozen v1 save with the old salon goes v1 -> v5 and keeps what was bought', () => {
        const r = decodeSave(fixture('save-v1-legacy-salon.json'));
        expect(r).toMatchObject({ kind: 'ok', migratedFrom: 1 });
        if (r.kind !== 'ok') return;
        expect(r.session.stars).toBe(7);
        expect(r.session.rooms.salon).toEqual({ tasksDone: 6, chosen: { sofa: 1, rug: 2, 'coffee-table': 0, cabinet: 0, armchair: 0 } });
        const encoded = encodeSave(r.session);
        expect(encoded).toMatchObject({ version: 5, generation: 0, writer: '' });
    });

    it('a salon already in the new shape only gets the new version', () => {
        const salon = { tasksDone: 3, chosen: { sofa: 2, rug: 1 } };
        expect(salonOf(v2With(salon))).toEqual(salon);
        expect(LIFT_V2_SALON(v2With(salon))).toEqual({ ...v2With(salon), version: 3 });
    });

    it('a fresh salon and a save without the salon come through whole', () => {
        expect(salonOf(v2With({ tasksDone: 0, chosen: {} }))).toEqual({ tasksDone: 0, chosen: {} });
        const noSalon = { ...v2With(null), rooms: { living: { tasksDone: 1, chosen: { floor: 0 } } }, currentRoom: 'living' };
        expect(LIFT_V2_SALON(noSalon)).toEqual({ ...noSalon, version: 3 });
    });

    it('M-2: a slot of a later build (not an old key) is left alone', () => {
        const salon = { tasksDone: 8, chosen: { sofa: 1, rug: 0, 'coffee-table': 0, cabinet: 0, armchair: 0, 'wall-frames': 0, 'armchair-2': 1 } };
        expect(salonOf(v2With(salon))).toEqual(salon);
    });

    it('an old salon that also holds an unknown key keeps that key out of the old list but in the data', () => {
        const salon = { tasksDone: 4, chosen: { floor: 1, walls: 2, curtains: 0, sofa: 1, mystery: 2 } };
        const out = salonOf(v2With(salon)) as { tasksDone: number; chosen: Record<string, number> };
        expect(out.tasksDone).toBe(4);
        expect(out.chosen).toEqual({ mystery: 2, sofa: 1, rug: 0, 'coffee-table': 0 });
    });

    it.each([
        ['rooms is null', { ...v2With(oldSalon(3)), rooms: null }],
        ['rooms is a list', { ...v2With(oldSalon(3)), rooms: [] }],
        ['salon is a list', v2With([])],
        ['salon is null', v2With(null)],
        ['chosen is null', v2With({ tasksDone: 3, chosen: null })],
        ['tasksDone is -1', v2With({ tasksDone: -1, chosen: { floor: 0 } })],
        ['tasksDone is a string', v2With({ tasksDone: '3', chosen: { floor: 0 } })],
        ['tasksDone is 1.5', v2With({ tasksDone: 1.5, chosen: { floor: 0 } })],
    ])('the step is total: %s gives corrupt, never migration-failed', (_name, raw) => {
        expect(() => LIFT_V2_SALON(raw)).not.toThrow();
        expect(decodeSave(raw)).toEqual({ kind: 'unreadable', reason: 'corrupt', from: 2, problem: expect.any(String) as string });
    });

    it('is idempotent', () => {
        const once = LIFT_V2_SALON(v2With(oldSalon(6)));
        expect(LIFT_V2_SALON(once)).toEqual(once);
    });
});

describe('the frozen tables', () => {
    it('L-1: the old list is a frozen literal (the live data no longer carries it)', () => {
        expect(LEGACY_SALON_V2.tasks).toEqual([
            { slot: 'floor', cost: 5 }, { slot: 'walls', cost: 6 }, { slot: 'curtains', cost: 7 }, { slot: 'sofa', cost: 8 },
            { slot: 'rug', cost: 9 }, { slot: 'table', cost: 10 }, { slot: 'lamp', cost: 11 }, { slot: 'shelf', cost: 12 },
            { slot: 'plant', cost: 13 }, { slot: 'picture', cost: 15 },
        ]);
        expect(LEGACY_SALON_V2.renames).toEqual({ table: 'coffee-table', shelf: 'cabinet', picture: 'wall-frames' });
        expect(LEGACY_SALON_V2.tasks.map((t) => t.slot)).toEqual(OLD_SLOTS);
    });

    it('L-1: the v3 target is the first 7 tasks of the live salon (it may grow at the end, the snapshot may not)', () => {
        expect(SALON_V3_TARGET).toEqual(SALON.tasks.slice(0, 7).map((t) => ({ slot: t.kind === 'slot' ? t.slot : null, cost: t.cost })));
        expect(SALON_V3_TARGET).toHaveLength(7);
        expect(SALON.tasks.length).toBeGreaterThan(SALON_V3_TARGET.length);
    });

    it('a v3 save with chosen.curtains is decoded unchanged (curtains is a live slot id since S-16d)', () => {
        const session = freshSession(houseOf('salon'));
        session.rooms.salon = { tasksDone: 8, chosen: { sofa: 0, curtains: 1 } };
        const r = decodeSave(JSON.parse(JSON.stringify(encodeSave(session))));
        expect(r.kind).toBe('ok');
        if (r.kind !== 'ok') return;
        expect(r.session.rooms.salon).toEqual({ tasksDone: 8, chosen: { sofa: 0, curtains: 1 } });
    });

    it('a lifted v2 salon never carries curtains', () => {
        for (let n = 0; n <= OLD_SLOTS.length; n++) {
            const salon = salonOf(v2With(oldSalon(n))) as { chosen: Record<string, number> };
            expect(Object.keys(salon.chosen), String(n)).not.toContain('curtains');
        }
    });
});

describe('M-4 / R-3: the load that moved the salon says so (runtime note, nothing saved)', () => {
    it.each(EXPECTED)('old tasksDone %i: carried from %i to the new prefix, the lifted value is the same as MIGRATIONS[2]', (n, done) => {
        const raw = v2With(oldSalon(n));
        const r = carryV2Salon(raw);
        expect(r.carried).toEqual({ from: n, to: done });
        expect(r.value).toEqual(LIFT_V2_SALON(raw));
    });

    it('says nothing for a salon already in the new shape, an untouched one, and anything it does not recognise', () => {
        expect(carryV2Salon(v2With({ tasksDone: 3, chosen: { sofa: 1, rug: 0 } })).carried).toBeNull();
        expect(carryV2Salon(v2With({ tasksDone: 0, chosen: {} })).carried).toBeNull();
        expect(carryV2Salon(v2With('nope')).carried).toBeNull();
        expect(carryV2Salon(null).carried).toBeNull();
        expect(carryV2Salon(fixture('save-v2-fresh.json')).carried).toBeNull();
    });

    it('MIGRATIONS[2] output is byte-identical to the value of carryV2Salon for every v2 fixture', () => {
        for (const name of ['save-v2.json', 'save-v2-fresh.json', 'save-v2-legacy-salon.json']) {
            const raw = fixture(name);
            expect(JSON.stringify(MIGRATIONS[2](raw)), name).toBe(JSON.stringify(carryV2Salon(raw).value));
        }
    });

    it('decodeSave reports the note for v2 and v1 saves with the old salon, and null for the rest', () => {
        const v2 = decodeSave(v2With(oldSalon(6)));
        expect(v2.kind === 'ok' && v2.salonCarried).toEqual({ from: 6, to: 6 });
        const v1 = decodeSave(fixture('save-v1-legacy-salon.json'));
        expect(v1.kind === 'ok' && v1.salonCarried).toEqual({ from: 6, to: 6 });
        for (const name of ['save-v2-fresh.json', 'save-v3.json', 'save-v4.json', 'save-v1.json']) {
            const r = decodeSave(fixture(name));
            expect(r.kind === 'ok' && r.salonCarried, name).toBeNull();
        }
    });

    it('the note is not part of what is saved: encodeSave of the carried session has no such key', () => {
        const r = decodeSave(v2With(oldSalon(6)));
        if (r.kind !== 'ok') throw new Error('unreadable');
        expect(JSON.stringify(encodeSave(r.session))).not.toContain('salonCarried');
    });
});
