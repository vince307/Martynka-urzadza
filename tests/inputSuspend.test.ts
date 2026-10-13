// Input suspension counter (S-08 phase 2, plan-review F1): input comes back
// only when the count returns to zero, a handle releases once, and onRelease
// fires once per return to zero, before the target is enabled again.
import { describe, expect, it } from 'vitest';
import { createInputSuspender } from '../src/core/inputSuspend';

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
