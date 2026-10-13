// Input suspension counter (S-08 phase 2, plan-review F1): input comes back
// only when the count returns to zero, a handle releases once, and onRelease
// fires once per return to zero, before the target is enabled again.
import { describe, expect, it } from 'vitest';
import { createInputSuspender, openInputSession } from '../src/core/inputSuspend';

describe('createInputSuspender', () => {
    it('suspend disables the target and the last resume enables it again', () => {
        const target = { enabled: true };
        const s = createInputSuspender(target);
        expect(s.suspended()).toBe(false);
        const resume = s.suspend();
        expect(target.enabled).toBe(false);
        expect(s.suspended()).toBe(true);
        resume();
        expect(target.enabled).toBe(true);
        expect(s.suspended()).toBe(false);
    });

    it('two suspends need two resumes', () => {
        const target = { enabled: true };
        const s = createInputSuspender(target);
        const a = s.suspend();
        const b = s.suspend();
        a();
        expect(target.enabled).toBe(false);
        expect(s.suspended()).toBe(true);
        b();
        expect(target.enabled).toBe(true);
    });

    it('resuming the same handle twice does not release another holder', () => {
        const target = { enabled: true };
        const s = createInputSuspender(target);
        const a = s.suspend();
        s.suspend();
        a();
        a();
        expect(target.enabled).toBe(false);
        expect(s.suspended()).toBe(true);
    });

    it('onRelease fires once on return to zero, not on an intermediate resume or a double resume', () => {
        const target = { enabled: true };
        let calls = 0;
        const s = createInputSuspender(target, () => {
            calls += 1;
        });
        const a = s.suspend();
        const b = s.suspend();
        a();
        a();
        expect(calls).toBe(0);
        b();
        expect(calls).toBe(1);
        b();
        expect(calls).toBe(1);
    });

    it('onRelease runs before the target is enabled', () => {
        const target = { enabled: true };
        const seen: boolean[] = [];
        const s = createInputSuspender(target, () => seen.push(target.enabled));
        s.suspend()();
        expect(seen).toEqual([false]);
        expect(target.enabled).toBe(true);
    });

    it('fires onRelease again after a second suspend and resume cycle', () => {
        const target = { enabled: true };
        let calls = 0;
        const s = createInputSuspender(target, () => {
            calls += 1;
        });
        s.suspend()();
        s.suspend()();
        expect(calls).toBe(2);
    });

    it('works without onRelease', () => {
        const target = { enabled: true };
        const s = createInputSuspender(target);
        expect(() => s.suspend()()).not.toThrow();
        expect(target.enabled).toBe(true);
    });
});

describe('createInputSuspender when onRelease throws', () => {
    it('rethrows but still enables the target and leaves the counter at zero', () => {
        const target = { enabled: true };
        const boom = new Error('release failed');
        let first = true;
        const s = createInputSuspender(target, () => {
            if (!first) return;
            first = false;
            throw boom;
        });
        const resume = s.suspend();
        expect(() => resume()).toThrow(boom);
        expect(target.enabled).toBe(true);
        expect(s.suspended()).toBe(false);
        s.suspend()();
        expect(target.enabled).toBe(true);
    });
});

describe('openInputSession', () => {
    it('suspends on creation and run returns the result without releasing', () => {
        const target = { enabled: true };
        const session = openInputSession(createInputSuspender(target));
        expect(target.enabled).toBe(false);
        expect(session.active()).toBe(true);
        expect(session.run(() => 42)).toBe(42);
        expect(target.enabled).toBe(false);
        expect(session.active()).toBe(true);
    });

    it('releases and rethrows the same error when the callback throws', () => {
        const target = { enabled: true };
        const s = createInputSuspender(target);
        const session = openInputSession(s);
        const boom = new Error('callback failed');
        let caught: unknown;
        try {
            session.run(() => {
                throw boom;
            });
        } catch (e) {
            caught = e;
        }
        expect(caught).toBe(boom);
        expect(target.enabled).toBe(true);
        expect(session.active()).toBe(false);
        expect(s.suspended()).toBe(false);
    });

    it('end twice releases once and does not free another holder', () => {
        const target = { enabled: true };
        const s = createInputSuspender(target);
        const session = openInputSession(s);
        const other = s.suspend();
        session.end();
        session.end();
        expect(target.enabled).toBe(false);
        expect(s.suspended()).toBe(true);
        other();
        expect(target.enabled).toBe(true);
    });

    it('run after end runs the callback without suspending again', () => {
        const target = { enabled: true };
        const session = openInputSession(createInputSuspender(target));
        session.end();
        expect(session.run(() => 'ok')).toBe('ok');
        expect(target.enabled).toBe(true);
        expect(session.active()).toBe(false);
    });
});
