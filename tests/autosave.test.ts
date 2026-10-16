// Origin: S-11 phase 2, test-plan risks #2 (a restart keeps progress) and #16 (autosave never loses or corrupts a save).
// Oracle: FR-020 (short debounce, write after a change), FR-021 (an unreadable save is never overwritten), plan Critical
// Implementation Details (never write what was not read, never write what cannot be read, never an unhandled rejection).
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAutosaver, errorName, loadSave, replaceGate, withTimeLimit, type Autosaver, type AutosaverOptions, type LoadOutcome, type SaveStore } from '../src/core/autosave';
import { decodeSave, encodeSave, type SessionSave } from '../src/core/save';
import type { SaveState } from '../src/core/types';

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
    const state = { value: initial, writes: [] as SaveState[], fail: false, readFails: false, hold: false, backupFails: false, writeHangs: false, backupHangs: false, lateReject: null as null | ((e: Error) => void), ops: [] as string[], backups: [] as { raw: unknown; from: number }[] };
    const pending: (() => void)[] = [];
    const store: SaveStore = {
        read: () => (state.readFails ? Promise.reject(new Error('lost')) : Promise.resolve(state.value)),
        backup: (raw, from) => {
            state.ops.push('backup');
            if (state.backupHangs) return new Promise<void>(() => undefined);
            if (state.backupFails) return Promise.reject(Object.assign(new Error('full'), { name: 'QuotaExceededError' }));
            state.backups.push({ raw, from });
            return Promise.resolve();
        },
        write: (v) => {
            state.ops.push('write');
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

        const broken = makeStore(fixture('save-v1.json'));
        broken.state.readFails = true;
        expect(await loadSave(broken.store)).toEqual({ kind: 'unavailable', error: 'Error' });

        for (const s of [fresh, v1, f, broken]) expect(s.state.writes).toHaveLength(0);
    });
});

describe('loadSave failure cause and read limit (audit C-1, M-S4)', () => {
    const limitOf = (clock: ReturnType<typeof makeClock>) => ({ timers: clock.timers, timeoutMs: 5000 });
    const never = (): SaveStore => ({ read: () => new Promise<unknown>(() => undefined), backup: () => Promise.resolve(), write: () => Promise.resolve() });

    it('names the error of a rejected read and falls back to Error for a thrown string', async () => {
        const named: SaveStore = { read: () => Promise.reject(Object.assign(new Error('x'), { name: 'UnknownError' })), backup: () => Promise.resolve(), write: () => Promise.resolve() };
        expect(await loadSave(named)).toEqual({ kind: 'unavailable', error: 'UnknownError' });
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- a non-Error rejection is the case under test
        const text: SaveStore = { read: () => Promise.reject('boom'), backup: () => Promise.resolve(), write: () => Promise.resolve() };
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
        const store: SaveStore = { read: () => new Promise<unknown>((_, rej) => (fail = rej)), backup: () => Promise.resolve(), write: () => Promise.resolve() };
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
        const store: SaveStore = { read: () => new Promise<unknown>((r) => (resolve = r)), backup: () => Promise.resolve(), write: (v) => f.store.write(v) };
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
            store: { read: () => Promise.resolve(undefined), backup: () => Promise.resolve(), write: () => Promise.reject(Object.assign(new Error('q'), { name: 'QuotaExceededError' })) },
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

    it.each(['corrupt', 'unknown-version', 'migration-failed'] as const)('a %s save is still replaced (the way out)', async (loadReason) => {
        const t = setup({ blockedBy: 'unreadable', load: 'unreadable', loadReason });
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.writes.map((w) => w.stars)).toEqual([5]);
    });

    it('unavailable needs force: without it nothing is written, with it the write happens and is logged', async () => {
        const t = setup({ blockedBy: 'unavailable', load: 'unavailable', loadError: 'SecurityError' });
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

        const u = setup({ blockedBy: 'unavailable', load: 'unavailable', loadError: 'SecurityError' });
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
                    for (const force of [false, true]) {
                        const expected =
                            blockedBy === 'fatal' ? 'Blocked'
                            : blockedBy === 'unreadable' ? (loadReason === 'future' ? 'Blocked' : 'ok')
                            : blockedBy === 'unavailable' ? (loadError === 'timeout' || loadError === 'TimeoutError' || !force ? 'Blocked' : 'ok')
                            : 'ok';
                        expect(replaceGate({ blockedBy, loadReason, loadError }, force), JSON.stringify({ blockedBy, loadReason, loadError, force })).toBe(expected);
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

    it('copies the raw v1 once, BEFORE the first write, and never again', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.set(2);
        t.saver.markDirty();
        await t.saver.flush('now');
        t.set(3);
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['backup', 'write', 'write']);
        expect(t.state.backups).toEqual([{ raw: v1, from: 1 }]);
        expect(t.state.writes).toHaveLength(2);
    });

    it('a failing copy before the attempt limit writes nothing, counts as a failure with the copy error, and stays retryable', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.writes).toHaveLength(0);
        expect(t.state.value).toBeUndefined();
        expect(t.saver.status()).toMatchObject({ consecutiveFailures: 1, lastError: 'QuotaExceededError', blockedBy: null, writes: 0, dirty: true, backup: 'failed', backupError: 'QuotaExceededError' });
        await t.saver.flush('now');
        expect(t.saver.status().consecutiveFailures).toBe(2);
        expect(t.state.writes).toHaveLength(0);
        t.state.backupFails = false;
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['backup', 'backup', 'backup', 'write']);
        expect(t.state.writes).toHaveLength(1);
        expect(t.saver.status()).toMatchObject({ consecutiveFailures: 0, writes: 1, backup: 'done' });
    });

    it('the third failed copy in a session writes v2 without the copy, once, and says so in the log (SV2-01)', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.set(4);
        t.saver.markDirty();
        await t.saver.flush('now');
        await t.saver.flush('now');
        expect(t.state.writes).toHaveLength(0);
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['backup', 'backup', 'backup', 'write']);
        expect(t.state.writes.map((w) => w.stars)).toEqual([4]);
        expect(t.saver.status()).toMatchObject({ backup: 'skipped', backupError: 'QuotaExceededError', writes: 1, consecutiveFailures: 0, dirty: false });
        expect(t.logs.filter((l) => String(l[0]).includes('without the v1 copy'))).toHaveLength(1);
        // later changes write plainly and never ask for the copy again
        t.set(5);
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['backup', 'backup', 'backup', 'write', 'write']);
    });

    it('a copy that fails once and then works still comes before the first v2 write', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        t.state.backupFails = false;
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['backup', 'backup', 'write']);
        expect(t.saver.status().backup).toBe('done');
    });

    it('after a failed copy the page-hide flush writes v2 without trying the copy again', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('now');
        await t.saver.flush('hidden');
        expect(t.state.ops).toEqual(['backup', 'write']);
        expect(t.saver.status()).toMatchObject({ backup: 'skipped', writes: 1 });
    });

    it('a page-hide flush that is the first attempt still tries the copy, and writes v2 even when it fails', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.saver.markDirty();
        await t.saver.flush('hidden');
        expect(t.state.ops).toEqual(['backup', 'write']);
        expect(t.saver.status()).toMatchObject({ backup: 'skipped', writes: 1 });
    });

    it('a copy that hangs counts as a timeout failure of the copy', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupHangs = true;
        t.saver.markDirty();
        const flushed = t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await flushed;
        expect(t.saver.status()).toMatchObject({ backup: 'failed', backupError: 'timeout', writes: 0 });
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
        expect(t.state.ops).toEqual(['backup', 'write']);
        expect(t.state.backups).toEqual([{ raw: v1, from: 1 }]);
        expect(t.saver.status().backup).toBe('done');
    });

    it('replace with a failing copy still replaces and marks the copy skipped', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.state.ops).toEqual(['backup', 'write']);
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

    it('the copy is a fact only after the write: pending at the start, done once v2 is written (SV2-03)', async () => {
        const t = setup({ migrated, load: 'loaded' });
        expect(t.saver.status().backup).toBe('pending');
        t.saver.markDirty();
        await t.saver.flush('now');
        expect(t.saver.status()).toMatchObject({ backup: 'done', writes: 1 });
    });

    it('a migration-failed load is replaceable like corrupt, never like future', () => {
        expect(replaceGate({ blockedBy: 'unreadable', loadReason: 'migration-failed', loadError: null }, false)).toBe('ok');
    });
});

// salon-load-health phase 2 (audit M-3, F3, F4): a migrated save is written at start, the v2 copy goes the same way.
describe('write at start after a migration (audit M-3)', () => {
    const v2 = fixture('save-v2.json');
    const migrated = { from: 2, raw: v2 };

    it('a migrated start writes without a change: the copy first, then the save, reason migration', async () => {
        const t = setup({ migrated, load: 'loaded' });
        expect(t.state.ops).toEqual([]);
        expect(t.saver.status()).toMatchObject({ migrationWrittenAt: null, dirty: true });
        t.clock.advance(500);
        await settle();
        await settle();
        expect(t.state.ops).toEqual(['backup', 'write']);
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

    it('a failed copy keeps the device save untouched and migrationWrittenAt null; the next tries go on as before', async () => {
        const t = setup({ migrated, load: 'loaded', initial: v2 });
        t.state.backupFails = true;
        t.clock.advance(500);
        await settle();
        await settle();
        expect(t.state.ops).toEqual(['backup']);
        expect(t.state.value).toBe(v2);
        expect(t.saver.status()).toMatchObject({ migrationWrittenAt: null, backup: 'failed', writes: 0, dirty: true });
        t.state.backupFails = false;
        await t.saver.flush('now');
        expect(t.state.ops).toEqual(['backup', 'backup', 'write']);
        expect(t.saver.status().migrationWrittenAt).not.toBeNull();
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
        expect(t.state.ops).toEqual(['backup', 'write']);
        expect(t.saver.status().migrationWrittenAt).not.toBeNull();
    });

    it('a v2 copy and the log name the real versions (F4)', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        await t.saver.flush('hidden');
        const line = t.logs.find((l) => String(l[0]).includes('without the v2 copy'));
        expect(line?.[0]).toBe('autosave: writing v4 without the v2 copy');
        expect(line?.[1]).toMatchObject({ from: 2, attempts: 1 });
    });

    it('F3: a replace whose copy fails and whose own write fails leaves the copy owed and counted', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        t.state.fail = true;
        const result = await t.saver.replace(encodeSave(session(5)));
        expect(result.ok).toBe(false);
        expect(t.saver.status()).toMatchObject({ backup: 'failed', backupError: 'QuotaExceededError', replace: 'idle' });
        expect(t.logs.some((l) => String(l[0]).includes('without the v2 copy'))).toBe(false);
        t.state.fail = false;
        await t.saver.flush('now');
        expect(t.state.ops.filter((o) => o === 'backup').length).toBeGreaterThanOrEqual(2);
    });

    it('F4: a copy that fails and a save that is written is skipped with the real attempt count in the log', async () => {
        const t = setup({ migrated, load: 'loaded' });
        t.state.backupFails = true;
        expect(await t.saver.replace(encodeSave(session(5)))).toEqual({ ok: true });
        expect(t.saver.status().backup).toBe('skipped');
        expect(t.logs.find((l) => String(l[0]).includes('without the v2 copy'))?.[1]).toMatchObject({ attempts: 1 });
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

    it('a hung copy of a migrated save is a timeout failure at the backup stage and writes nothing', async () => {
        const t = setup({ migrated: { from: 1, raw: fixture('save-v1.json') } });
        t.state.backupHangs = true;
        t.saver.markDirty();
        const flushed = t.saver.flush('now');
        await settle();
        t.clock.advance(5000);
        await flushed;
        expect(t.saver.status().lastFailure).toEqual({ stage: 'backup', error: 'timeout' });
        expect(t.state.ops).toEqual(['backup']);
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
            backup: () => Promise.resolve(),
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
        const broken: SaveStore = { read: () => Promise.reject(new Error('x')), backup: () => Promise.resolve(), write: () => Promise.resolve() };
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
