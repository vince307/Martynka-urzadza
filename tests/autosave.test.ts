// Origin: S-11 phase 2, test-plan risks #2 (a restart keeps progress) and #16 (autosave never loses or corrupts a save).
// Oracle: FR-020 (short debounce, write after a change), FR-021 (an unreadable save is never overwritten), plan Critical
// Implementation Details (never write what was not read, never write what cannot be read, never an unhandled rejection).
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAutosaver, errorName, loadSave, type Autosaver, type AutosaverOptions, type LoadOutcome, type SaveStore } from '../src/core/autosave';
import { decodeSave, encodeSave, type SessionSave } from '../src/core/save';
import type { SaveState } from '../src/core/types';

const fixture = (name: string): unknown => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const settle = (): Promise<void> => new Promise((r) => setImmediate(r));

const session = (stars: number): SessionSave => {
    const ok = decodeSave(fixture('save-v1-fresh.json'));
    if (ok.kind !== 'ok') throw new Error('fixture');
    return { ...ok.session, stars };
};

/** Store over a Map: counts writes, can fail, and can hold a write until the test resolves it. */
const makeStore = (initial?: unknown) => {
    const state = { value: initial, writes: [] as SaveState[], fail: false, readFails: false, hold: false };
    const pending: (() => void)[] = [];
    const store: SaveStore = {
        read: () => (state.readFails ? Promise.reject(new Error('lost')) : Promise.resolve(state.value)),
        write: (v) => {
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

        const future = { version: 2, stars: 1 };
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
    const never = (): SaveStore => ({ read: () => new Promise<unknown>(() => undefined), write: () => Promise.resolve() });

    it('names the error of a rejected read and falls back to Error for a thrown string', async () => {
        const named: SaveStore = { read: () => Promise.reject(Object.assign(new Error('x'), { name: 'UnknownError' })), write: () => Promise.resolve() };
        expect(await loadSave(named)).toEqual({ kind: 'unavailable', error: 'UnknownError' });
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- a non-Error rejection is the case under test
        const text: SaveStore = { read: () => Promise.reject('boom'), write: () => Promise.resolve() };
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
        expect(outcome).toEqual({ kind: 'unavailable', error: 'timeout' });
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
        const store: SaveStore = { read: () => new Promise<unknown>((_, rej) => (fail = rej)), write: () => Promise.resolve() };
        const pending = loadSave(store, limitOf(clock));
        clock.advance(5000);
        expect(await pending).toEqual({ kind: 'unavailable', error: 'timeout' });
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
        const store: SaveStore = { read: () => new Promise<unknown>((r) => (resolve = r)), write: (v) => f.store.write(v) };
        const pending = loadSave(store, limitOf(clock));
        clock.advance(5000);
        expect(await pending).toEqual({ kind: 'unavailable', error: 'timeout' });
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
            store: { read: () => Promise.resolve(undefined), write: () => Promise.reject(Object.assign(new Error('q'), { name: 'QuotaExceededError' })) },
            snapshot: () => session(1),
            timers: makeClock().timers,
            delayMs: 500,
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
