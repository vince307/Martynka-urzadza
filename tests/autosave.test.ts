// Origin: S-11 phase 2, test-plan risks #2 (a restart keeps progress) and #16 (autosave never loses or corrupts a save).
// Oracle: FR-020 (short debounce, write after a change), FR-021 (an unreadable save is never overwritten), plan Critical
// Implementation Details (never write what was not read, never write what cannot be read, never an unhandled rejection).
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { backupExtras } from './helpers';
import { createAutosaver, errorName, lateReadVerdict, loadSave, replaceGate, withTimeLimit, type Autosaver, type AutosaverOptions, type BackupRecord, type LoadOutcome, type SaveStore } from '../src/core/autosave';
import { SAVE_VERSION, decodeSave, encodeSave, type SessionSave } from '../src/core/save';
import type { SaveState } from '../src/core/types';
import { balance } from '../src/data/balance';

const fixture = (name: string): unknown => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const settle = (): Promise<void> => new Promise((r) => setImmediate(r));

/** Whether `p` has settled after a few turns: a missing time limit fails by assertion, not by the vitest timeout. */
const hasSettled = async (p: Promise<unknown>): Promise<boolean> => {
    let done = false;
    void p.then(() => (done = true), () => (done = true));
    await settle();
    await settle();
    return done;
};

const session = (stars: number): SessionSave => {
    const ok = decodeSave(fixture('save-v1-fresh.json'));
    if (ok.kind !== 'ok') throw new Error('fixture');
    return { ...ok.session, stars };
};

/** Store over a Map: counts writes, can fail, and can hold a write until the test resolves it. */
const makeStore = (initial?: unknown) => {
    const state = { value: initial, writes: [] as SaveState[], fail: false, readFails: false, hold: false, backupFails: false, writeHangs: false, backupHangs: false, lateReject: null as null | ((e: Error) => void), ops: [] as string[], all: [] as string[], notes: [] as BackupRecord[], noteHangs: false, noteFails: false, backups: [] as { raw: unknown; from: number }[] };
    const pending: (() => void)[] = [];
    const store: SaveStore = {
        read: () => (state.readFails ? Promise.reject(new Error('lost')) : Promise.resolve(state.value)),
        ...backupExtras,
        noteBackup: (record) => {
            state.all.push('noteBackup');
            state.notes.push(record);
            if (state.noteHangs) return new Promise<void>(() => undefined);
            if (state.noteFails) return Promise.reject(Object.assign(new Error('full'), { name: 'QuotaExceededError' }));
            return Promise.resolve();
        },
        backup: (raw, from) => {
            state.ops.push('backup');
            state.all.push('backup');
            if (state.backupHangs) return new Promise<'written'>(() => undefined);
            if (state.backupFails) return Promise.reject(Object.assign(new Error('full'), { name: 'QuotaExceededError' }));
            state.backups.push({ raw, from });
            return Promise.resolve('written' as const);
        },
        write: (v) => {
            state.ops.push('write');
            state.all.push('write');
            if (state.writeHangs) return new Promise<void>((_, reject) => void (state.lateReject = reject));
            if (state.fail) return Promise.reject(new Error('quota'));
            const commit = () => {
                state.value = v;
                state.writes.push(v);
            };
            if (!state.hold) {
                commit();
                return Promise.resolve();
            }
            return new Promise<void>((resolve) => pending.push(() => (commit(), resolve())));
        },
    };
    return { store, state, release: () => pending.splice(0).forEach((f) => f()) };
};

/** Manual clock: timers fire only when the test advances it. */
const makeClock = () => {
    let now = 0;
    let nextId = 1;
    const timers = new Map<number, { at: number; fn: () => void }>();
    return {
        timers: {
            setTimeout: (fn: () => void, ms: number): unknown => {
                const id = nextId++;
                timers.set(id, { at: now + ms, fn });
                return id;
            },
            clearTimeout: (id: unknown): void => void timers.delete(id as number),
        },
        now: (): number => now,
        pending: () => timers.size,
        advance: (ms: number): void => {
            now += ms;
            for (const [id, t] of [...timers]) {
                if (t.at <= now) {
                    timers.delete(id);
                    t.fn();
                }
            }
        },
    };
};

let rejections: unknown[];
const onRejection = (e: unknown): void => void rejections.push(e);
beforeEach(() => {
    rejections = [];
    process.on('unhandledRejection', onRejection);
});
afterEach(() => void process.off('unhandledRejection', onRejection));

const setup = (over: Partial<AutosaverOptions> & { initial?: unknown } = {}) => {
    const s = makeStore(over.initial);
    const clock = makeClock();
    const logs: unknown[][] = [];
    let current = session(1);
    const saver: Autosaver = createAutosaver({
        store: s.store,
        snapshot: () => current,
        timers: clock.timers,
        delayMs: 500,
        writeTimeoutMs: 5000,
        backupAttempts: 3,
        load: 'fresh',
        blockedBy: null,
        now: clock.now,
        log: (...a) => void logs.push(a),
        ...over,
    });
    return { ...s, clock, logs, saver, set: (stars: number) => void (current = session(stars)), setRaw: (v: SessionSave) => void (current = v) };
};

describe('loadSave', () => {
    it('reads once and reports fresh / loaded / unreadable / unavailable without ever writing', async () => {
        const fresh = makeStore(undefined);
        expect(await loadSave(fresh.store)).toEqual({ kind: 'fresh' });

        const v1 = makeStore(fixture('save-v1.json'));
        const loaded = await loadSave(v1.store);
        expect(loaded.kind).toBe('loaded');
        if (loaded.kind === 'loaded') expect(loaded.session.stars).toBe(7);

        const future = { version: 5, stars: 1 };
        const f = makeStore(future);
        const out: LoadOutcome = await loadSave(f.store);
        expect(out).toEqual({ kind: 'unreadable', reason: 'future', raw: future });

        const bad = { ...(fixture('save-v4.json') as Record<string, unknown>), stars: 'x' };
        expect(await loadSave(makeStore(bad).store)).toEqual({ kind: 'unreadable', reason: 'corrupt', raw: bad, from: 4, problem: 'stars' });

        const broken = makeStore(fixture('save-v1.json'));
        broken.state.readFails = true;
        expect(await loadSave(broken.store)).toEqual({ kind: 'unavailable', error: 'Error' });

        for (const s of [fresh, v1, f, broken]) expect(s.state.writes).toHaveLength(0);
    });
});

describe('loadSave failure cause and read limit (audit C-1, M-S4)', () => {
    const limitOf = (clock: ReturnType<typeof makeClock>) => ({ timers: clock.timers, timeoutMs: 5000 });
    const never = (): SaveStore => ({ read: () => new Promise<unknown>(() => undefined), ...backupExtras, backup: () => Promise.resolve('written' as const), write: () => Promise.resolve() });

    it('names the error of a rejected read and falls back to Error for a thrown string', async () => {
        const named: SaveStore = { read: () => Promise.reject(Object.assign(new Error('x'), { name: 'UnknownError' })), ...backupExtras, backup: () => Promise.resolve('written' as const), write: () => Promise.resolve() };
        expect(await loadSave(named)).toEqual({ kind: 'unavailable', error: 'UnknownError' });
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- a non-Error rejection is the case under test
        const text: SaveStore = { read: () => Promise.reject('boom'), ...backupExtras, backup: () => Promise.resolve('written' as const), write: () => Promise.resolve() };
        expect(await loadSave(text)).toEqual({ kind: 'unavailable', error: 'Error' });
    });

    it('without a limit keeps the other outcomes', async () => {
        expect(await loadSave(makeStore().store)).toEqual({ kind: 'fresh' });
        expect((await loadSave(makeStore(fixture('save-v1.json')).store)).kind).toBe('loaded');
    });

    it('a read that never answers becomes unavailable (timeout) exactly at the limit', async () => {
        const clock = makeClock();
        let outcome: LoadOutcome | undefined;
        void loadSave(never(), limitOf(clock)).then((o) => (outcome = o));
        clock.advance(4999);
        await settle();
        expect(outcome).toBeUndefined();
        clock.advance(1);
        await settle();
        expect(outcome).toMatchObject({ kind: 'unavailable', error: 'timeout' });
    });

    it('a read faster than the limit returns its result and leaves no timer', async () => {
        const clock = makeClock();
        const f = makeStore(fixture('save-v1.json'));
        const out = await loadSave(f.store, limitOf(clock));
        expect(out.kind).toBe('loaded');
        expect(clock.pending()).toBe(0);
    });

    it('a read that rejects after the limit stays a timeout and raises no unhandled rejection', async () => {
        const clock = makeClock();
        let fail!: (e: unknown) => void;
        const store: SaveStore = { read: () => new Promise<unknown>((_, rej) => (fail = rej)), ...backupExtras, backup: () => Promise.resolve('written' as const), write: () => Promise.resolve() };
        const pending = loadSave(store, limitOf(clock));
        clock.advance(5000);
        expect(await pending).toMatchObject({ kind: 'unavailable', error: 'timeout' });
        fail(new Error('late'));
        await Promise.resolve();
        await Promise.resolve();
        await settle();
        expect(rejections).toEqual([]);
    });

    it('a read that resolves after the limit does not change the outcome and nothing is written', async () => {
        const clock = makeClock();
        const f = makeStore(fixture('save-v1.json'));
        let resolve!: (v: unknown) => void;
        const store: SaveStore = { read: () => new Promise<unknown>((r) => (resolve = r)), ...backupExtras, backup: () => Promise.resolve('written' as const), write: (v) => f.store.write(v) };
        const pending = loadSave(store, limitOf(clock));
        clock.advance(5000);
        expect(await pending).toMatchObject({ kind: 'unavailable', error: 'timeout' });
        resolve(fixture('save-v1.json'));
        await settle();
        expect(f.state.writes).toHaveLength(0);
    });
});

describe('createAutosaver schedule', () => {
    it('coalesces changes into one write 500 ms after the last one', async () => {
        const t = setup();
        t.saver.markDirty();
        t.clock.advance(300);
        t.set(2);
        t.saver.markDirty();
        t.clock.advance(300);
        t.saver.markDirty();
        t.clock.advance(499);
        await settle();
        expect(t.state.writes).toHaveLength(0);
        t.set(3);
        t.clock.advance(1);
        await settle();
        expect(t.state.writes).toHaveLength(1);
        expect(t.state.writes[0].stars).toBe(3);
        expect(t.saver.status()).toMatchObject({ writes: 1, dirty: false, lastReason: 'change' });
    });

    it('flush writes now, cancels the timer and leaves no second write', async () => {
        const t = setup();
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.writes).toHaveLength(1);
        expect(t.clock.pending()).toBe(0);
        t.clock.advance(1000);
        await settle();
        expect(t.state.writes).toHaveLength(1);
        expect(t.saver.status().lastReason).toBe('now');
    });

    it('flush with nothing changed writes nothing', async () => {
        const t = setup();
        await t.saver.flush('hidden');
        expect(t.state.writes).toHaveLength(0);
    });

    it('a change during a write gives exactly one more write, with the newer snapshot', async () => {
        const t = setup();
        t.state.hold = true;
        t.saver.markDirty();
        const first = t.saver.flush('now');
        await settle();
        t.set(9);
        t.saver.markDirty();
        t.saver.markDirty();
        t.state.hold = false;
        t.release();
        await first;
        t.clock.advance(1000);
        await settle();
        expect(t.state.writes.map((w) => w.stars)).toEqual([1, 9]);
    });

    it('calls onFirstWrite exactly once, after the first successful write', async () => {
        let calls = 0;
        const t = setup({ onFirstWrite: () => void calls++ });
        t.state.fail = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(calls).toBe(0);
        t.state.fail = false;
        await t.saver.flush('now');
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(calls).toBe(1);
    });
});

describe('createAutosaver persistence result (audit M-S2)', () => {
    const dirtyFlush = async (t: ReturnType<typeof setup>): Promise<void> => {
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
    };

    it('starts unknown, also without onFirstWrite after a write', async () => {
        const t = setup();
        expect(t.saver.status().persistence).toBe('unknown');
        await dirtyFlush(t);
        expect(t.saver.status().persistence).toBe('unknown');
    });

    it('keeps the resolved result of onFirstWrite', async () => {
        const t = setup({ onFirstWrite: () => Promise.resolve('granted') });
        await dirtyFlush(t);
        expect(t.saver.status().persistence).toBe('granted');
    });

    it('a rejected onFirstWrite is error and reaches nobody as an unhandled rejection', async () => {
        const t = setup({ onFirstWrite: () => Promise.reject(new Error('no')) });
        await dirtyFlush(t);
        expect(t.saver.status().persistence).toBe('error');
        expect(rejections).toEqual([]);
    });
});

describe('createAutosaver never overwrites what it could not read (risk #2)', () => {
    for (const load of ['unreadable', 'unavailable'] as const) {
        it(`after a ${load} load nothing is ever written`, async () => {
            const t = setup({ load, blockedBy: load, initial: { version: 2 } });
            t.saver.markDirty();
            t.clock.advance(5000);
            await t.saver.flush('now');
            await t.saver.flush('hidden');
            expect(t.state.writes).toHaveLength(0);
            expect(t.state.value).toEqual({ version: 2 });
            expect(t.saver.status()).toMatchObject({ blocked: true, blockedBy: load, writes: 0 });
            expect(t.saver.status().skipped).toBeGreaterThan(0);
        });
    }

    it('block() during a scheduled write cancels it', async () => {
        const t = setup();
        t.saver.markDirty();
        t.saver.block('fatal');
        t.clock.advance(1000);
        await t.saver.flush('now');
        expect(t.state.writes).toHaveLength(0);
        expect(t.clock.pending()).toBe(0);
        expect(t.saver.status().blocked).toBe(true);
    });
});

describe('createAutosaver failures (risk #16)', () => {
    it('a rejected write is logged, stays dirty, raises no unhandled rejection and is retried by the next change', async () => {
        const t = setup();
        t.state.fail = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        expect(t.saver.status()).toMatchObject({ failures: 2, dirty: true, writes: 0 });
        expect(t.logs.length).toBeGreaterThanOrEqual(2);
        t.state.fail = false;
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        expect(t.saver.status()).toMatchObject({ writes: 1, dirty: false });
        await settle();
        expect(rejections).toEqual([]);
    });

    it('a snapshot that throws or a state that cannot be read back writes nothing', async () => {
        const boom = setup({
            snapshot: () => {
                throw new Error('registry');
            },
        });
        boom.saver.markDirty();
        await boom.saver.flush('now');
        expect(boom.saver.status()).toMatchObject({ failures: 1, writes: 0 });

        const bad = setup();
        bad.setRaw({ ...session(1), stars: -3 });
        bad.saver.markDirty();
        await bad.saver.flush('now');
        expect(bad.state.writes).toHaveLength(0);
        expect(bad.saver.status()).toMatchObject({ failures: 1, writes: 0 });
        expect(rejections).toEqual([]);
    });

    it('property: over random sequences the last stored value equals the snapshot of its write and decodes', async () => {
        for (let seed = 1; seed <= 25; seed++) {
            let x = seed * 2654435761;
            const rnd = (n: number): number => ((x = (Math.imul(x, 1103515245) + 12345) >>> 0) >>> 8) % n;
            const t = setup();
            const written: number[] = [];
            let stars = 0;
            for (let i = 0; i < 40; i++) {
                const op = rnd(5);
                if (op === 0) {
                    stars += 1;
                    t.set(stars);
                    t.saver.markDirty();
                } else if (op === 1) t.clock.advance(rnd(700));
                else if (op === 2) await t.saver.flush(rnd(2) ? 'now' : 'hidden');
                else if (op === 3) t.state.fail = !t.state.fail;
                else await settle();
                await settle();
            }
            t.state.fail = false;
            await t.saver.flush('now');
            for (const w of t.state.writes) written.push(w.stars);
            if (t.state.value !== undefined) {
                const d = decodeSave(t.state.value);
                expect(d.kind, `seed ${seed}`).toBe('ok');
                expect(written[written.length - 1], `seed ${seed}`).toBe(stars);
            } else expect(stars, `seed ${seed}`).toBe(0);
        }
        expect(rejections).toEqual([]);
    });
});

describe('autosave health status (audit C-2, M-S5)', () => {
    it('a start blocked as unavailable reports the reason and the load error; a later fatal block keeps the first reason', () => {
        const t = setup({ load: 'unavailable', blockedBy: 'unavailable', loadError: 'UnknownError' });
        expect(t.saver.status()).toMatchObject({ blocked: true, blockedBy: 'unavailable', lastError: 'UnknownError' });
        t.saver.block('fatal');
        expect(t.saver.status().blockedBy).toBe('unavailable');
    });

    it('block() on a healthy saver records fatal', () => {
        const t = setup();
        expect(t.saver.status()).toMatchObject({ blocked: false, blockedBy: null, lastError: null, lastWriteAt: null, consecutiveFailures: 0 });
        t.saver.block('fatal');
        expect(t.saver.status()).toMatchObject({ blocked: true, blockedBy: 'fatal' });
    });

    it('a write records its time and clears the streak; the last error name stays and the lifetime counter keeps counting', async () => {
        const t = setup();
        t.clock.advance(1234);
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.saver.status()).toMatchObject({ writes: 1, lastWriteAt: 1234, consecutiveFailures: 0, lastError: null });

        t.store.write = () => Promise.reject(Object.assign(new Error('quota'), { name: 'QuotaExceededError' }));
        for (let i = 0; i < 2; i++) {
            t.saver.markDirty();
            await t.saver.flush('now');
        }
        expect(t.saver.status()).toMatchObject({ failures: 2, consecutiveFailures: 2, lastError: 'QuotaExceededError', lastWriteAt: 1234 });

        t.clock.advance(100);
        t.store.write = () => Promise.resolve();
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.saver.status()).toMatchObject({ failures: 2, consecutiveFailures: 0, lastError: 'QuotaExceededError', lastWriteAt: 1334 });
    });

    it('a snapshot that does not validate is named InvalidSave', async () => {
        const t = setup();
        t.setRaw({ ...session(1), stars: -3 });
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.saver.status()).toMatchObject({ consecutiveFailures: 1, lastError: 'InvalidSave' });
    });

    it('errorName keeps only a name, never a message', () => {
        expect(errorName(new TypeError('secret'))).toBe('TypeError');
        expect(errorName({ name: 'QuotaExceededError', message: 'x' })).toBe('QuotaExceededError');
        expect(errorName('boom')).toBe('Error');
        expect(errorName(undefined)).toBe('Error');
        expect(errorName({ name: '' })).toBe('Error');
    });
});

describe('Autosaver.replace (S-12, test-plan risks #2 and #10): a replaced save is not overwritten by the old game', () => {
    it('waits for a write in flight, then writes the given state after it', async () => {
        const t = setup();
        t.state.hold = true;
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        t.state.hold = false; // the replace write itself is instant: only waiting for the held snapshot keeps the order
        const result = t.saver.replace(encodeSave(session(77)));
        await settle();
        t.release();
        expect(await result).toEqual({ ok: true });
        expect(t.state.writes.map((w) => w.stars)).toEqual([1, 77]);
    });

    it('turns every later write off after a success', async () => {
        const t = setup();
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        t.set(9);
        t.saver.markDirty();
        t.clock.advance(1000);
        await t.saver.flush('hidden');
        await t.saver.flush('now');
        expect(t.state.writes.map((w) => w.stars)).toEqual([5]);
        expect(t.saver.status().skipped).toBeGreaterThan(0);
        expect(t.saver.status().replace).toBe('done');
    });

    it('after a failed write reports the error name and autosave resumes with the snapshot', async () => {
        const t = setup();
        t.state.fail = true;
        const result = await t.saver.replace(encodeSave(session(5)));
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toBe('Error');
        expect(t.saver.status().replace).toBe('idle');
        expect(t.saver.status().failures).toBe(1);
        t.state.fail = false;
        t.set(3);
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.writes.map((w) => w.stars)).toEqual([3]);
    });

    it('names a thrown QuotaExceededError', async () => {
        const saver = createAutosaver({
            store: { read: () => Promise.resolve(undefined), ...backupExtras, backup: () => Promise.resolve('written' as const), write: () => Promise.reject(Object.assign(new Error('q'), { name: 'QuotaExceededError' })) },
            snapshot: () => session(1),
            timers: makeClock().timers,
            delayMs: 500,
            writeTimeoutMs: 5000,
            backupAttempts: 3,
            load: 'fresh',
            blockedBy: null,
            now: () => 0,
            log: () => undefined,
        });
        expect(await saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'QuotaExceededError' });
    });

    it('a failed replace of a dirty game lets the debounce timer write the snapshot without a flush', async () => {
        const t = setup();
        t.saver.markDirty();
        t.state.fail = true;
        const result = await t.saver.replace(encodeSave(session(5)));
        expect(result.ok).toBe(false);
        t.state.fail = false;
        t.set(8);
        t.clock.advance(500);
        await settle();
        expect(t.state.writes.map((w) => w.stars)).toEqual([8]);
    });

    it('refuses when fatal, writes nothing', async () => {
        const t = setup({ blockedBy: 'fatal' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.writes).toEqual([]);
    });

    it('refuses when unavailable (the device save may be healthy and unseen), writes nothing', async () => {
        const t = setup({ blockedBy: 'unavailable', load: 'unavailable' });
        const before = t.saver.status().replace;
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.writes).toEqual([]);
        expect(t.saver.status().replace).toBe(before);
    });

    it('works on an unreadable save (the way out)', async () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.writes.map((w) => w.stars)).toEqual([5]);
    });

    it('refuses an invalid state without writing', async () => {
        const t = setup();
        expect(await t.saver.replace({ version: 1 } as unknown as SaveState)).toEqual({ ok: false, error: 'InvalidSave' });
        expect(t.state.writes).toEqual([]);
    });

    it('a second replace, in flight or after success, is Busy and writes once', async () => {
        const t = setup();
        t.state.hold = true;
        const first = t.saver.replace(encodeSave(session(5)));
        expect(await t.saver.replace(encodeSave(session(6)))).toEqual({ ok: false, error: 'Busy' });
        t.state.hold = false;
        t.release();
        expect(await first).toEqual({ ok: true });
        expect(await t.saver.replace(encodeSave(session(7)))).toEqual({ ok: false, error: 'Busy' });
        expect(t.state.writes.map((w) => w.stars)).toEqual([5]);
    });

    it('current() is the encoded snapshot', () => {
        const t = setup();
        expect(t.saver.current()).toEqual(encodeSave(session(1)));
    });
});

describe('Autosaver.replace gate (plan save-reason-and-recovery phase 1): SIR-01, SIR-02, SIR-05', () => {
    it('a future save is never replaced, even with force; the store is untouched and the refusal is logged', async () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason: 'future' });
        expect(await t.saver.replace(encodeSave(session(5)), { force: true })).toEqual({ ok: false, error: 'Blocked' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.writes).toEqual([]);
        expect(t.saver.status().replace).toBe('idle');
        expect(t.logs.length).toBe(2);
    });

    it('a plain corrupt save (not migrated) is still replaced without force (the way out)', async () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason: 'corrupt' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.writes.map((w) => w.stars)).toEqual([5]);
    });

    // save-truth phase 2 (SRR-09, deliberate reversal of "a %s save is still replaced"): FR-021 keeps the old save until the parent confirms twice.
    it.each([
        ['unknown-version', undefined],
        ['migration-failed', undefined],
        ['corrupt', 3],
    ] as const)('a %s save (from %s) is refused without force and replaced with it', async (loadReason, loadFrom) => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason, ...(loadFrom === undefined ? {} : { loadFrom }) });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.writes).toEqual([]);
        expect(await t.saver.replace(encodeSave(session(6)), { force: true })).toEqual({ ok: true });
        expect(t.state.writes.map((w) => w.stars)).toEqual([6]);
    });

    it('the loadFrom of a migrated corrupt save is in the status, runtime only', () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason: 'corrupt', loadFrom: 2 });
        expect(t.saver.status().loadFrom).toBe(2);
        expect(setup().saver.status().loadFrom).toBeNull();
    });

    it('a corrupt save already at the current version is not "migrated": loadFrom = SAVE_VERSION is replaced freely', async () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason: 'corrupt', loadFrom: SAVE_VERSION });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
    });

    it('replace logs every refusal and a busy call (SRR-10)', async () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason: 'future' });
        await t.saver.replace(encodeSave(session(5)));
        expect(t.logs.length).toBe(1);

        const u = setup();
        const first = u.saver.replace(encodeSave(session(5)));
        expect(await u.saver.replace(encodeSave(session(6)))).toEqual({ ok: false, error: 'Busy' });
        expect(u.logs.some((l) => String(l[0]).includes('Busy'))).toBe(true);
        await first;

        const v = setup();
        expect(await v.saver.replace({ version: 1 } as unknown as SaveState)).toEqual({ ok: false, error: 'InvalidSave' });
        expect(v.logs.some((l) => String(l[0]).includes('InvalidSave') && JSON.stringify(l).includes('version'))).toBe(true);
    });

    it('unavailable needs force AND a second consecutive start: the first start is never replaced (SRR-08)', async () => {
        const first = setup({ blockedBy: 'unavailable', load: 'unavailable', loadError: 'SecurityError', unavailableStarts: 1 });
        expect(first.saver.status().unavailableStarts).toBe(1);
        expect(await first.saver.replace(encodeSave(session(5)), { force: true })).toEqual({ ok: false, error: 'Blocked' });
        expect(first.state.writes).toEqual([]);

        const t = setup({ blockedBy: 'unavailable', load: 'unavailable', loadError: 'SecurityError', unavailableStarts: balance.save.forceAfterStarts });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.writes).toEqual([]);
        expect(await t.saver.replace(encodeSave(session(6)), { force: true })).toEqual({ ok: true });
        expect(t.state.writes.map((w) => w.stars)).toEqual([6]);
        expect(t.logs.length).toBe(2);
    });

    it('a timeout read is never replaced, and a failed forced write does not unlock it (loadError, not lastError)', async () => {
        const t = setup({ blockedBy: 'unavailable', load: 'unavailable', loadError: 'timeout' });
        expect(await t.saver.replace(encodeSave(session(5)), { force: true })).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.writes).toEqual([]);

        const u = setup({ blockedBy: 'unavailable', load: 'unavailable', loadError: 'SecurityError', unavailableStarts: 2 });
        u.state.fail = true;
        expect(await u.saver.replace(encodeSave(session(5)), { force: true })).toEqual({ ok: false, error: 'Error' });
        expect(u.saver.status().lastError).toBe('Error');
        expect(u.saver.status().loadError).toBe('SecurityError');
        expect(u.saver.status().loadReason).toBeNull();
    });

    it('the status keeps loadReason and loadError from the start', () => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason: 'future' });
        expect(t.saver.status()).toMatchObject({ loadReason: 'future', loadError: null });
    });

    it('replaceGate covers every combination', () => {
        const reasons = [null, 'corrupt', 'future', 'unknown-version', 'migration-failed'] as const;
        const errors = [null, 'timeout', 'TimeoutError', 'SecurityError'] as const;
        const blocks = [null, 'unreadable', 'unavailable', 'fatal'] as const;
        for (const blockedBy of blocks)
            for (const loadReason of reasons)
                for (const loadError of errors)
                    for (const force of [false, true])
                      for (const unavailableStarts of [0, 1, 2, 3])
                      for (const loadFrom of [null, SAVE_VERSION, 2]) {
                        // save-truth phase 2: the kept-old-save reasons need force (corrupt only after a migration step).
                        const keeps = loadReason === 'unknown-version' || loadReason === 'migration-failed' || (loadReason === 'corrupt' && loadFrom === 2);
                        const expected =
                            blockedBy === 'fatal' ? 'Blocked'
                            : blockedBy === 'unreadable' ? (loadReason === 'future' ? 'Blocked' : keeps && !force ? 'Blocked' : 'ok')
                            : blockedBy === 'unavailable' ? (loadError === 'timeout' || loadError === 'TimeoutError' || !force || unavailableStarts < balance.save.forceAfterStarts ? 'Blocked' : 'ok')
                            : 'ok';
                        expect(replaceGate({ blockedBy, loadReason, loadError, loadFrom, unavailableStarts }, force), JSON.stringify({ blockedBy, loadReason, loadError, loadFrom, unavailableStarts, force })).toBe(expected);
                    }
    });
});


// Phase 2 (S-15): a v1 save is copied to `backup-v1` before the first v2 write; a failed copy blocks that write.
describe('backup before the first write after a migration', () => {
    const v1 = fixture('save-v1.json');
    const migrated = { from: 1, raw: v1 };

    it('loadSave hands the raw value over with a migrated save, and names a throwing step migration-failed', async () => {
        const loaded = await loadSave(makeStore(v1).store);
        expect(loaded).toMatchObject({ kind: 'loaded', migratedFrom: 1, raw: v1 });
        const hostile = { version: 1, get stars(): number { throw new Error('boom'); } };
        const out = await loadSave(makeStore(hostile).store);
        expect(out.kind).toBe('unreadable');
        if (out.kind === 'unreadable') {
            expect(out.reason).toBe('migration-failed');
            expect(out.raw).toBe(hostile);
        }
    });

    // save-truth phase 5: reversed (copy BEFORE the write became copy AFTER it: the progress never waits on the old bytes).
    it('copies the raw v1 once, AFTER the first write, and never again', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.set(2);
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        t.set(3);
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['write', 'backup', 'write']);
        expect(t.state.backups).toEqual([{ raw: v1, from: 1 }]);
        expect(t.state.writes).toHaveLength(2);
    });

    // save-truth phase 5: reversed. A failing copy no longer blocks the progress write; it is counted once per try and retried after later writes.
    it('a failing copy before the attempt limit does not hold the write, counts once per try, and stays retryable', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.writes).toHaveLength(1);
        expect(t.saver.status()).toMatchObject({ consecutiveFailures: 0, failures: 1, lastError: 'QuotaExceededError', blockedBy: null, writes: 1, dirty: false, backup: 'failed', backupError: 'QuotaExceededError' });
        t.set(2);
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.saver.status().failures).toBe(2);
        t.state.backupFails = false;
        t.set(3);
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup', 'write', 'backup', 'write', 'backup']);
        expect(t.state.writes).toHaveLength(3);
        expect(t.saver.status()).toMatchObject({ writes: 3, backup: 'done' });
    });

    it('the third failed copy in a session gives the copy up, once, and says so in the log (SV2-01); the progress was written every time', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        for (const stars of [4, 5, 6, 7]) {
            t.set(stars);
            t.saver.markDirty();
            await t.saver.flush('now');
            await settle();
        }
        expect(t.state.ops).toEqual(['write', 'backup', 'write', 'backup', 'write', 'backup', 'write']);
        expect(t.state.writes.map((w) => w.stars)).toEqual([4, 5, 6, 7]);
        expect(t.saver.status()).toMatchObject({ backup: 'skipped', backupError: 'QuotaExceededError', writes: 4, consecutiveFailures: 0, dirty: false });
        expect(t.logs.filter((l) => String(l[0]).includes('without the v1 copy'))).toHaveLength(1);
    });

    it('a copy that fails once and then works comes after the first v2 write', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        t.state.backupFails = false;
        t.set(2);
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup', 'write', 'backup']);
        expect(t.saver.status().backup).toBe('done');
    });

    // save-truth phase 5: reversed ("writes v2 without trying the copy again" gave the copy up at the first hidden flush; now it stays owed).
    it('after a failed copy the page-hide flush writes progress and keeps the copy owed', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        t.set(2);
        t.saver.markDirty();
        await t.saver.flush('hidden');
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup', 'write']);
        expect(t.saver.status()).toMatchObject({ backup: 'failed', writes: 2 });
    });

    it('a page-hide flush that is the first attempt writes first, then tries the copy', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('hidden');
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup']);
        expect(t.saver.status()).toMatchObject({ backup: 'failed', writes: 1 });
    });

    it('a copy that hangs counts as a timeout failure of the copy, and the write was not held', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupHangs = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.saver.status()).toMatchObject({ backup: 'pending', writes: 1 });
        t.clock.advance(5000);
        await settle();
        await settle();
        expect(t.saver.status()).toMatchObject({ backup: 'failed', backupError: 'timeout', writes: 1 });
    });

    it('a save that was not migrated is written without a copy', async () => {
        const t = setup({ load: 'fresh' });
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['write']);
    });

    it('replace takes the pending copy once and never waits on a failing one', async () => {
        const t = setup({ migrated, load: 'loaded' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.ops).toEqual(['write', 'backup']);
        expect(t.state.backups).toEqual([{ raw: v1, from: 1 }]);
        expect(t.saver.status().backup).toBe('done');
    });

    it('replace with a failing copy still replaces and marks the copy skipped', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.ops).toEqual(['write', 'backup']);
        expect(t.saver.status()).toMatchObject({ backup: 'skipped', backupError: 'QuotaExceededError', replace: 'done' });
    });

    it('replace of a save that was not migrated never copies', async () => {
        const t = setup({ load: 'fresh' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.ops).toEqual(['write']);
        expect(t.saver.status().backup).toBe('none');
    });

    it('the status says which version the save was moved from', () => {
        expect(setup({ migrated, load: 'loaded' }).saver.status().migratedFrom).toBe(1);
        expect(setup().saver.status().migratedFrom).toBeNull();
    });

    it('the copy is a fact only after the write: pending at the start, done once v2 and the copy are written (SV2-03)', async () => {
        const t = setup({ migrated, load: 'loaded' });
        expect(t.saver.status().backup).toBe('pending');
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.saver.status()).toMatchObject({ backup: 'done', writes: 1 });
    });

    // save-truth phase 2: reversed, a migration-failed load is no longer replaceable without force (it keeps the old save).
    it('a migration-failed load needs force, like unknown-version, and a future one never', () => {
        expect(replaceGate({ blockedBy: 'unreadable', loadReason: 'migration-failed', loadError: null }, false)).toBe('Blocked');
        expect(replaceGate({ blockedBy: 'unreadable', loadReason: 'migration-failed', loadError: null }, true)).toBe('ok');
        expect(replaceGate({ blockedBy: 'unreadable', loadReason: 'future', loadError: null }, true)).toBe('Blocked');
    });
});

// salon-load-health phase 2 (audit M-3, F3, F4): a migrated save is written at start, the v2 copy goes the same way.
describe('write at start after a migration (audit M-3)', () => {
    const v2 = fixture('save-v2.json');
    const migrated = { from: 2, raw: v2 };

    it('a migrated start writes without a change: the save first, then the copy, reason migration', async () => {
        const t = setup({ migrated, load: 'loaded' });
        expect(t.state.ops).toEqual([]);
        expect(t.saver.status()).toMatchObject({ migrationWrittenAt: null, dirty: true });
        t.clock.advance(500);
        await settle();
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup']);
        expect(t.state.backups).toEqual([{ raw: v2, from: 2 }]);
        expect(t.saver.status()).toMatchObject({ lastReason: 'migration', migrationWrittenAt: t.clock.now(), backup: 'done', dirty: false, writes: 1 });
    });

    it('a start that was not migrated arms nothing and writes nothing', async () => {
        const t = setup({ load: 'loaded' });
        expect(t.clock.pending()).toBe(0);
        t.clock.advance(5000);
        await settle();
        expect(t.state.ops).toEqual([]);
        expect(t.saver.status().migrationWrittenAt).toBeNull();
    });

    it('a blocked start arms nothing even when migrated', () => {
        const t = setup({ migrated, load: 'unreadable', blockedBy: 'unreadable' });
        expect(t.clock.pending()).toBe(0);
    });

    // save-truth phase 5: reversed. A failed copy no longer keeps the device save untouched; the progress write comes first.
    it('a failed copy does not hold the start write: migrationWrittenAt is set, the copy stays owed and is retried', async () => {
        const t = setup({ migrated, load: 'loaded', initial: v2 });
        t.state.backupFails = true;
        t.clock.advance(500);
        await settle();
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup']);
        expect(t.saver.status()).toMatchObject({ backup: 'failed', writes: 1 });
        expect(t.saver.status().migrationWrittenAt).not.toBeNull();
        t.state.backupFails = false;
        t.set(2);
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup', 'write', 'backup']);
        expect(t.saver.status().backup).toBe('done');
    });

    it('a failed write leaves migrationWrittenAt null', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.fail = true;
        t.clock.advance(500);
        await settle();
        await settle();
        expect(t.saver.status()).toMatchObject({ migrationWrittenAt: null, writes: 0 });
    });

    it('a hidden flush before the timer writes at once', async () => {
        const t = setup({ migrated, load: 'loaded' });
        await t.saver.flush('hidden');
        await settle();
        expect(t.state.ops).toEqual(['write', 'backup']);
        expect(t.saver.status().migrationWrittenAt).not.toBeNull();
    });

    it('a v2 copy and the log name the real versions (F4)', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        for (const stars of [2, 3, 4]) {
            t.set(stars);
            t.saver.markDirty();
            await t.saver.flush('now');
            await settle();
        }
        const line = t.logs.find((l) => String(l[0]).includes('without the v2 copy'));
        expect(line?.[0]).toBe('autosave: writing v4 without the v2 copy');
        expect(line?.[1]).toMatchObject({ from: 2, attempts: 3 });
    });

    // save-truth phase 5: reversed. A replace whose own write fails never reaches the copy; the copy stays owed for a later write.
    it('F3: a replace whose own write fails leaves the copy owed and untried', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.state.fail = true;
        const result = await t.saver.replace(encodeSave(session(5)));
        expect(result.ok).toBe(false);
        expect(t.saver.status()).toMatchObject({ backup: 'pending', replace: 'idle' });
        expect(t.logs.some((l) => String(l[0]).includes('without the v2 copy'))).toBe(false);
        t.state.fail = false;
        await t.saver.flush('now');
        await settle();
        expect(t.state.ops.filter((o) => o === 'backup').length).toBeGreaterThanOrEqual(1);
    });

    it('F4: a copy that fails and a save that is written is skipped with the real attempt count in the log', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.saver.status().backup).toBe('skipped');
        expect(t.logs.find((l) => String(l[0]).includes('without the v2 copy'))?.[1]).toMatchObject({ attempts: 1 });
    });
});

// save-truth phase 5 (SVB-01, V-6, V-7, P-1): the progress is written first, the copy follows and is bounded.
describe('copy after the write, bounded retry of the first write (save-truth p5)', () => {
    const v2 = fixture('save-v2.json');
    const migrated = { from: 2, raw: v2 };

    it('a hidden flush after a failed copy writes progress and keeps the copy owed', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        t.set(4);
        t.saver.markDirty();
        await t.saver.flush('hidden');
        await settle();
        expect(t.state.writes.map((w) => w.stars)).toEqual([1, 4]);
        expect(t.saver.status()).toMatchObject({ backup: 'failed', writes: 2 });
        expect(t.state.ops).toEqual(['write', 'backup', 'write']);
    });

    it('a failed first write after a migration is retried without markDirty, at most migrationWriteRetries times', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.fail = true;
        for (let i = 0; i < 12; i++) {
            t.clock.advance(500);
            await settle();
            await settle();
        }
        expect(t.state.ops.filter((o) => o === 'write')).toHaveLength(1 + balance.save.migrationWriteRetries);
        t.state.fail = false;
        t.clock.advance(5000);
        await settle();
        expect(t.state.writes).toHaveLength(0);
        // a store that works again, once a change arms the saver, writes
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        await settle();
        expect(t.state.writes).toHaveLength(1);
    });

    it('a retried first write that works stops the retries', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.fail = true;
        t.clock.advance(500);
        await settle();
        await settle();
        t.state.fail = false;
        t.clock.advance(500);
        await settle();
        await settle();
        t.clock.advance(5000);
        await settle();
        expect(t.state.writes).toHaveLength(1);
        expect(t.saver.status().migrationWrittenAt).not.toBeNull();
    });

    it('a write that leaves the copy owed notes `lost` first, and a later copy is attempted after the write', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.all).toEqual(['noteBackup', 'write', 'backup']);
        expect(t.state.notes[0]).toMatchObject({ from: 2, result: 'lost' });
        // the copy is tried after later writes, never again before them, and the note is made once
        t.state.backupFails = false;
        t.set(3);
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.all).toEqual(['noteBackup', 'write', 'backup', 'write', 'backup']);
        expect(t.saver.status().backup).toBe('done');
    });

    it('a hanging noteBackup does not hold the write', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.noteHangs = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.writes).toHaveLength(1);
        expect(t.saver.status().writes).toBe(1);
    });

    it('a failing noteBackup does not hold the write either, and an unhandled rejection never escapes', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.noteFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.writes).toHaveLength(1);
        expect(rejections).toEqual([]);
    });

    it('a hanging copy does not hold the next progress write', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupHangs = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        t.set(6);
        t.saver.markDirty();
        await t.saver.flush('hidden');
        expect(t.state.writes.map((w) => w.stars)).toEqual([1, 6]);
    });

    it('the copy is given up once at backupAttempts, with a lost record, and never asked for again (V-6, V-7)', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        for (let i = 2; i < 8; i++) {
            t.set(i);
            t.saver.markDirty();
            await t.saver.flush('now');
            await settle();
        }
        expect(t.state.ops.filter((o) => o === 'backup')).toHaveLength(3);
        const status = t.saver.status();
        expect(status).toMatchObject({ backup: 'skipped', failures: 3 });
        expect(t.logs.filter((l) => String(l[0]).includes('without the v2 copy'))).toHaveLength(1);
        expect(t.state.notes.at(-1)).toMatchObject({ from: 2, result: 'lost', error: 'QuotaExceededError' });
    });

    it('a copy that timed out is given up as `uncertain`', async () => {
        const t = setup({ migrated, load: 'loaded', backupAttempts: 1 });
        t.state.backupHangs = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await settle();
        await settle();
        expect(t.saver.status().backup).toBe('skipped');
        expect(t.state.notes.at(-1)).toMatchObject({ result: 'uncertain', error: 'timeout' });
    });

    it('replace over an owed failing copy notes `lost` first, writes, then gives the copy up', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.all.slice(0, 3)).toEqual(['noteBackup', 'write', 'backup']);
        expect(t.state.notes[0]).toMatchObject({ result: 'lost' });
        expect(t.saver.status().backup).toBe('skipped');
    });

    it('the copy source is the loaded raw value, never the stored one', async () => {
        const t = setup({ migrated, load: 'loaded', initial: { version: 99, other: true } });
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.state.backups).toEqual([{ raw: v2, from: 2 }]);
    });
});

describe('createAutosaver time limit (save-v2-backup-health, SV2-02)', () => {
    it('withTimeLimit rejects a never-answering promise as a timeout and clears its timer when the work answers', async () => {
        const clock = makeClock();
        const hung = withTimeLimit(new Promise<number>(() => undefined), clock.timers, 5000);
        const rejected = hung.then(() => 'ok', (e: unknown) => errorName(e));
        clock.advance(4999);
        clock.advance(1);
        expect(await rejected).toBe('timeout');
        await expect(withTimeLimit(Promise.resolve(3), clock.timers, 5000)).resolves.toBe(3);
        expect(clock.pending()).toBe(0);
    });

    it('a hung write is a timeout failure: flush settles, the stage is named, the state stays dirty and the next change tries again', async () => {
        const t = setup();
        t.state.writeHangs = true;
        t.saver.markDirty();
        const flushed = t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        expect(await hasSettled(flushed)).toBe(true);
        await flushed;
        expect(t.saver.status()).toMatchObject({ consecutiveFailures: 1, writes: 0, dirty: true, lastError: 'timeout', lastFailure: { stage: 'write', error: 'timeout' } });
        t.state.writeHangs = false;
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        expect(t.state.writes).toHaveLength(1);
    });

    // save-truth phase 5: reversed ("writes nothing" became "the write goes first, the copy times out beside it").
    it('a hung copy of a migrated save is a timeout failure at the backup stage, after the write', async () => {
        const t = setup({ migrated: { from: 1, raw: fixture('save-v1.json') } });
        t.state.backupHangs = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await settle();
        await settle();
        expect(t.saver.status().lastFailure).toEqual({ stage: 'backup', error: 'timeout' });
        expect(t.state.ops).toEqual(['write', 'backup']);
    });

    it('replace behind a write that never answers settles within two limits as a timeout', async () => {
        const t = setup();
        t.state.writeHangs = true;
        t.saver.markDirty();
        void t.saver.flush('now');
        await settle();
        const result = t.saver.replace(encodeSave(session(5)));
        await settle();
        t.clock.advance(5000);
        await settle();
        t.clock.advance(5000);
        expect(await hasSettled(result)).toBe(true);
        expect(await result).toEqual({ ok: false, error: 'timeout' });
        expect(t.saver.status()).toMatchObject({ replace: 'idle', lastFailure: { stage: 'replace', error: 'timeout' } });
    });

    it('a replace that times out re-arms the debounce so the live game is written after it', async () => {
        const t = setup();
        t.state.writeHangs = true;
        const result = t.saver.replace(encodeSave(session(5)));
        await settle();
        t.clock.advance(5000);
        expect(await result).toEqual({ ok: false, error: 'timeout' });
        t.state.writeHangs = false;
        t.set(8);
        t.clock.advance(500);
        await settle();
        expect(t.state.writes.map((w) => w.stars)).toEqual([8]);
    });

    it('an abandoned write that rejects later reaches nobody', async () => {
        const t = setup();
        t.state.writeHangs = true;
        t.saver.markDirty();
        const flushed = t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await flushed;
        t.state.lateReject?.(new Error('late'));
        await settle();
        await settle();
        expect(rejections).toEqual([]);
    });
});

describe('loadSave waitLonger (SRR-02)', () => {
    const slowStore = () => {
        const calls = { reads: 0 };
        let answer!: (v: unknown) => void;
        const store: SaveStore = {
            read: () => {
                calls.reads += 1;
                return new Promise<unknown>((resolve) => (answer = resolve));
            },
            ...backupExtras, backup: () => Promise.resolve('written' as const),
            write: () => Promise.resolve(),
        };
        return { store, calls, answer: (v: unknown) => answer(v) };
    };
    const timedOut = async (f: ReturnType<typeof slowStore>, clock: ReturnType<typeof makeClock>) => {
        const pending = loadSave(f.store, { timers: clock.timers, timeoutMs: 5000 });
        clock.advance(5000);
        const out = await pending;
        if (out.kind !== 'unavailable' || !out.waitLonger) throw new Error('expected a waitLonger');
        return out.waitLonger;
    };

    it('waits on the SAME read: a late save is decoded and the store is read once', async () => {
        const clock = makeClock();
        const f = slowStore();
        const waitLonger = await timedOut(f, clock);
        const second = waitLonger(20000);
        f.answer(fixture('save-v1.json'));
        expect((await second).kind).toBe('loaded');
        expect(f.calls.reads).toBe(1);
    });

    it('a late fresh store and a late unreadable save are told apart like a normal read', async () => {
        const clock = makeClock();
        const a = slowStore();
        const waitA = await timedOut(a, clock);
        const pa = waitA(20000);
        a.answer(undefined);
        expect(await pa).toEqual({ kind: 'fresh' });
        const b = slowStore();
        const waitB = await timedOut(b, clock);
        const pb = waitB(20000);
        b.answer({ version: 99, profileId: 'default' });
        expect(await pb).toMatchObject({ kind: 'unreadable', reason: 'future' });
    });

    it('a second limit is a plain timeout with no further waitLonger', async () => {
        const clock = makeClock();
        const f = slowStore();
        const waitLonger = await timedOut(f, clock);
        const second = waitLonger(20000);
        clock.advance(20000);
        const out = await second;
        expect(out).toEqual({ kind: 'unavailable', error: 'timeout' });
        expect(clock.pending()).toBe(0);
    });

    it('only a timeout carries waitLonger', async () => {
        const broken: SaveStore = { read: () => Promise.reject(new Error('x')), ...backupExtras, backup: () => Promise.resolve('written' as const), write: () => Promise.resolve() };
        expect(await loadSave(broken, { timers: makeClock().timers, timeoutMs: 5000 })).toEqual({ kind: 'unavailable', error: 'Error' });
    });
});

const newerError = (): Error => Object.assign(new Error('stored save is newer'), { name: 'NewerSave' });

describe('a store that refuses with NewerSave blocks saving for good (P-5)', () => {
    it('blocks with the runtime reason newer, tries the write once and never again', async () => {
        const t = setup();
        let calls = 0;
        t.store.write = () => (calls++, Promise.reject(newerError()));
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        await settle();
        expect(calls).toBe(1);
        expect(t.saver.status()).toMatchObject({ blockedBy: 'newer', blocked: true, lastFailure: { stage: 'write', error: 'NewerSave' } });
        t.saver.markDirty();
        t.clock.advance(5000);
        await t.saver.flush('now');
        await t.saver.flush('hidden');
        await settle();
        expect(calls).toBe(1);
        expect(t.clock.pending()).toBe(0);
        expect(t.saver.status().skipped).toBeGreaterThan(0);
        expect(t.logs.length).toBe(1);
    });

    it('the first write after a migration that meets a newer save blocks, keeps the copy rule, and never retries', async () => {
        const v2 = fixture('save-v2.json');
        const t = setup({ migrated: { from: 2, raw: v2 }, load: 'loaded' });
        let writes = 0;
        t.store.write = () => (writes++, Promise.reject(newerError()));
        t.clock.advance(500);
        await settle();
        await settle();
        expect(writes).toBe(1);
        expect(t.saver.status()).toMatchObject({ blockedBy: 'newer', migrationWrittenAt: null });
        t.clock.advance(60000);
        await t.saver.flush('hidden');
        expect(writes).toBe(1);
    });

    it('replace meets NewerSave: returns the error, blocks, arms nothing and does not stay busy', async () => {
        const t = setup();
        t.store.write = () => Promise.reject(newerError());
        expect(await t.saver.replace(encodeSave(session(9)))).toEqual({ ok: false, error: 'NewerSave' });
        expect(t.saver.status()).toMatchObject({ blockedBy: 'newer', replace: 'idle' });
        t.saver.markDirty();
        expect(t.clock.pending()).toBe(0);
    });

    it('once blocked as newer, replace is refused even with force and the store is not touched', async () => {
        const t = setup();
        t.saver.block('newer');
        expect(await t.saver.replace(encodeSave(session(5)), { force: true })).toEqual({ ok: false, error: 'Blocked' });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: false, error: 'Blocked' });
        expect(t.state.ops).toEqual([]);
    });

    it('replaceGate says Blocked for newer with and without force', () => {
        expect(replaceGate({ blockedBy: 'newer', loadReason: null, loadError: null }, true)).toBe('Blocked');
        expect(replaceGate({ blockedBy: 'newer', loadReason: null, loadError: null }, false)).toBe('Blocked');
    });

    it('any other write error is still retried as before', async () => {
        const t = setup();
        t.state.fail = true;
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        expect(t.saver.status()).toMatchObject({ blockedBy: null, consecutiveFailures: 1, dirty: true });
        t.state.fail = false;
        await t.saver.flush('now');
        expect(t.saver.status().writes).toBe(1);
    });
});

const otherWriterError = (): Error => Object.assign(new Error('another page saved later'), { name: 'OtherWriterSave' });

const previousPageError = (): Error => Object.assign(new Error('an earlier document of this tab saved later'), { name: 'PreviousPageSave' });

// save-truth p7 (T-3, T-1)
describe('a PreviousPageSave refusal and an older-writer note (save-truth p7)', () => {
    it('PreviousPageSave blocks as otherTab like OtherWriterSave, tells the listener once, and the log names the previous page', async () => {
        const told: string[] = [];
        const t = setup({ onBlocked: (reason) => void told.push(reason) });
        let calls = 0;
        t.store.write = () => (calls++, Promise.reject(previousPageError()));
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        await settle();
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(calls).toBe(1);
        expect(t.saver.status()).toMatchObject({ blockedBy: 'otherTab', lastFailure: { stage: 'write', error: 'PreviousPageSave' } });
        expect(told).toEqual(['otherTab']);
        expect(JSON.stringify(t.logs)).toContain('previous page');
    });

    it('noteOlderWriter sets the runtime flag and logs once, however often it is told', () => {
        const t = setup();
        expect(t.saver.status().olderWriterSeen).toBe(false);
        t.saver.noteOlderWriter();
        t.saver.noteOlderWriter();
        expect(t.saver.status().olderWriterSeen).toBe(true);
        expect(t.logs.filter((l) => String(l[0]).includes('older'))).toHaveLength(1);
    });

    it('the flag is runtime only: the encoded save has no such key', () => {
        const t = setup();
        t.saver.noteOlderWriter();
        expect(JSON.stringify(t.saver.current())).not.toContain('olderWriter');
    });
});

describe('a store that refuses with OtherWriterSave blocks saving for good (stale tab)', () => {
    it('blocks with the runtime reason otherTab, tries once, never again, and tells the listener once', async () => {
        const told: string[] = [];
        const t = setup({ onBlocked: (reason) => void told.push(reason) });
        let calls = 0;
        t.store.write = () => (calls++, Promise.reject(otherWriterError()));
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        await settle();
        expect(calls).toBe(1);
        expect(t.saver.status()).toMatchObject({ blockedBy: 'otherTab', blocked: true, lastFailure: { stage: 'write', error: 'OtherWriterSave' } });
        t.saver.markDirty();
        t.clock.advance(5000);
        await t.saver.flush('now');
        await t.saver.flush('hidden');
        await settle();
        expect(calls).toBe(1);
        expect(t.clock.pending()).toBe(0);
        expect(told).toEqual(['otherTab']);
    });

    it('NewerSave tells the listener once with newer', async () => {
        const told: string[] = [];
        const t = setup({ onBlocked: (reason) => void told.push(reason) });
        t.store.write = () => Promise.reject(newerError());
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        await settle();
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(told).toEqual(['newer']);
    });

    it('a load block and an ordinary failure never tell the listener', async () => {
        const told: string[] = [];
        const blocked = setup({ blockedBy: 'unreadable', onBlocked: (reason) => void told.push(reason) });
        blocked.saver.markDirty();
        await blocked.saver.flush('now');
        const failing = setup({ onBlocked: (reason) => void told.push(reason) });
        failing.state.fail = true;
        failing.saver.markDirty();
        await failing.saver.flush('now');
        expect(told).toEqual([]);
    });

    it('a listener that throws never breaks the write path', async () => {
        const t = setup({ onBlocked: () => { throw new Error('listener'); } });
        t.store.write = () => Promise.reject(otherWriterError());
        t.saver.markDirty();
        await expect(t.saver.flush('now')).resolves.toBeUndefined();
        expect(t.saver.status().blockedBy).toBe('otherTab');
        expect(rejections).toEqual([]);
    });

    it('replace meets OtherWriterSave in the store only as a refusal reported to the dialog, without telling the listener', async () => {
        const told: string[] = [];
        const t = setup({ onBlocked: (reason) => void told.push(reason) });
        t.store.write = () => Promise.reject(newerError());
        expect(await t.saver.replace(encodeSave(session(9)))).toEqual({ ok: false, error: 'NewerSave' });
        expect(told).toEqual([]);
    });

    it('replaceGate says Blocked for otherTab with and without force', () => {
        expect(replaceGate({ blockedBy: 'otherTab', loadReason: null, loadError: null }, true)).toBe('Blocked');
        expect(replaceGate({ blockedBy: 'otherTab', loadReason: null, loadError: null }, false)).toBe('Blocked');
    });
});

describe('what the status keeps for the parent view (save-truth p6: SVB-01 line, SVB-03, SRR-11, V1)', () => {
    const v2 = fixture('save-v2.json');
    const record: BackupRecord = { from: 2, result: 'lost', error: 'QuotaExceededError', at: 7 };

    it('withTimeLimit tells an observer how a write that answered after the limit ended, and never changes the result', async () => {
        const clock = makeClock();
        const seen: string[] = [];
        let landLate: () => void = () => undefined;
        const lands = withTimeLimit(new Promise<void>((resolve) => void (landLate = resolve)), clock.timers, 100, (outcome) => void seen.push(outcome));
        const landed = lands.then(() => 'ok', (e: unknown) => errorName(e));
        clock.advance(100);
        expect(await landed).toBe('timeout');
        expect(seen).toEqual([]);
        landLate();
        await settle();
        expect(seen).toEqual(['landed']);

        let failLate: (e: Error) => void = () => undefined;
        const fails = withTimeLimit(new Promise<void>((_, reject) => void (failLate = reject)), clock.timers, 100, (outcome) => void seen.push(outcome));
        const failed = fails.then(() => 'ok', (e: unknown) => errorName(e));
        clock.advance(100);
        expect(await failed).toBe('timeout');
        failLate(new Error('late'));
        await settle();
        expect(seen).toEqual(['landed', 'failed']);

        // work that answers in time never reaches the observer
        await withTimeLimit(Promise.resolve(1), clock.timers, 100, (outcome) => void seen.push(outcome));
        await settle();
        expect(seen).toEqual(['landed', 'failed']);
    });

    it('a write that answers after the limit is lateWrite landed, a late rejection is failed, the next good write clears it', async () => {
        const t = setup();
        let landLate: () => void = () => undefined;
        t.store.write = () => new Promise<void>((resolve) => void (landLate = resolve));
        t.saver.markDirty();
        const flushed = t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await flushed;
        expect(t.saver.status()).toMatchObject({ lastFailure: { stage: 'write', error: 'timeout' }, lateWrite: null });
        landLate();
        await settle();
        expect(t.saver.status().lateWrite).toBe('landed');

        let failLate: (e: Error) => void = () => undefined;
        t.store.write = () => new Promise<void>((_, reject) => void (failLate = reject));
        t.saver.markDirty();
        const again = t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await again;
        failLate(Object.assign(new Error('late'), { name: 'QuotaExceededError' }));
        await settle();
        expect(t.saver.status().lateWrite).toBe('failed');
        t.store.write = () => Promise.resolve();
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.saver.status().lateWrite).toBeNull();
    });

    it('a fatal block keeps the error name it was given (first block wins), and none when it got none', () => {
        const a = setup();
        a.saver.block('fatal', 'TypeError');
        a.saver.block('fatal', 'RangeError');
        expect(a.saver.status()).toMatchObject({ blockedBy: 'fatal', fatalError: 'TypeError' });
        const b = setup();
        b.saver.block('fatal');
        expect(b.saver.status().fatalError).toBeNull();
        const c = setup({ blockedBy: 'unreadable' });
        c.saver.block('fatal', 'TypeError');
        expect(c.saver.status()).toMatchObject({ blockedBy: 'unreadable', fatalError: null });
    });

    it('the stored record of the copy is carried into the status, null without one', () => {
        expect(setup({ backupRecord: record }).saver.status().backupRecord).toEqual(record);
        expect(setup().saver.status().backupRecord).toBeNull();
    });

    it('failed copies are counted apart, and the last error of a write stays the last write error', async () => {
        const t = setup({ migrated: { from: 2, raw: v2 }, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.saver.status()).toMatchObject({ backupFailures: 1, lastError: 'QuotaExceededError', lastWriteError: null });
        t.state.fail = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await settle();
        expect(t.saver.status()).toMatchObject({ lastWriteError: 'Error' });
    });
});

// save-truth p8 (T-2, T-5)
describe('noticeOtherWriter and the refusal code (save-truth p8)', () => {
    it('blocks as otherTab, tells the listener once with OtherWriterSave, and a later markDirty writes nothing', async () => {
        const told: [string, string][] = [];
        const t = setup({ onBlocked: (reason, error) => void told.push([reason, error]) });
        t.saver.noticeOtherWriter();
        t.saver.noticeOtherWriter();
        expect(t.saver.status()).toMatchObject({ blocked: true, blockedBy: 'otherTab' });
        expect(told).toEqual([['otherTab', 'OtherWriterSave']]);
        const before = t.saver.status().writes;
        t.saver.markDirty();
        t.clock.advance(500);
        await settle();
        await t.saver.flush('now');
        expect(t.saver.status().writes).toBe(before);
    });

    it('a notice after another block does not tell the listener a second time', async () => {
        const told: string[] = [];
        const t = setup({ onBlocked: (reason) => void told.push(reason) });
        t.store.write = () => Promise.reject(otherWriterError());
        t.saver.markDirty();
        await t.saver.flush('now');
        t.saver.noticeOtherWriter();
        expect(told).toEqual(['otherTab']);
    });

    it('a refused write passes the error name of the refusal to the listener', async () => {
        const told: string[] = [];
        const t = setup({ onBlocked: (_reason, error) => void told.push(error) });
        t.store.write = () => Promise.reject(previousPageError());
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(told).toEqual(['PreviousPageSave']);
    });
});

describe('readBackups pass-through (save-truth p9)', () => {
    it('returns the store copies and never rejects when the read fails', async () => {
        const t = setup();
        t.store.readBackups = () => Promise.resolve([{ from: 1, raw: { n: 1 } }]);
        expect(await t.saver.readBackups()).toEqual([{ from: 1, raw: { n: 1 } }]);
        t.store.readBackups = () => Promise.reject(new Error('boom'));
        expect(await t.saver.readBackups()).toEqual([]);
    });
});

describe('lateReadVerdict (SVB-02)', () => {
    it('stays slow only for a read that timed out again', () => {
        expect(lateReadVerdict({ kind: 'unavailable', error: 'timeout' })).toBe('still-slow');
        expect(lateReadVerdict({ kind: 'unavailable', error: 'TimeoutError' })).toBe('still-slow');
    });

    it('settles for a read refused with a named error, and for every other outcome', () => {
        expect(lateReadVerdict({ kind: 'unavailable', error: 'UnknownError' })).toBe('settle');
        expect(lateReadVerdict({ kind: 'fresh' })).toBe('settle');
        expect(lateReadVerdict({ kind: 'unreadable', reason: 'corrupt', raw: null })).toBe('settle');
    });
});
