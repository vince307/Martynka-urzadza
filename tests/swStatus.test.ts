// Origin: stale-tab-and-health phase 5, audit P-1 / B-8: a parent must learn whether offline play is ready,
// and a child's tab must know a newer build took over. Oracle: the phase table of the plan, decided on plain events.
import { describe, expect, it } from 'vitest';
import { initialSwStatus, stepSw, type SwEvent, type SwStatus } from '../src/core/swStatus';

const run = (events: SwEvent[], from: SwStatus = initialSwStatus): SwStatus => events.reduce(stepSw, from);
const view = (s: SwStatus): Pick<SwStatus, 'phase' | 'error' | 'takenOver'> => ({ phase: s.phase, error: s.error, takenOver: s.takenOver });

describe('stepSw', () => {
    it('first install goes registering, installing, ready', () => {
        const s = run([{ type: 'register', hadController: false }, { type: 'installing', id: 1 }]);
        expect(view(s)).toEqual({ phase: 'installing', error: null, takenOver: false });
        const done = run([{ type: 'state', id: 1, state: 'installed' }, { type: 'state', id: 1, state: 'activated' }], s);
        expect(view(done)).toEqual({ phase: 'ready', error: null, takenOver: false });
    });

    it('registering without a worker yet is registering', () => {
        expect(run([{ type: 'register', hadController: false }]).phase).toBe('registering');
    });

    it('an already active worker at registration is ready', () => {
        expect(run([{ type: 'register', hadController: true }, { type: 'active', id: 7 }]).phase).toBe('ready');
    });

    it('a failed update with an active worker stays ready and keeps the error name', () => {
        const s = run([
            { type: 'register', hadController: true },
            { type: 'active', id: 7 },
            { type: 'installing', id: 8 },
            { type: 'state', id: 8, state: 'redundant' },
        ]);
        expect(s.phase).toBe('ready');
        expect(s.error).toBe('InstallFailed');
    });

    it('a tracked installing worker that turns redundant with no active one is install-failed', () => {
        const s = run([{ type: 'register', hadController: false }, { type: 'installing', id: 1 }, { type: 'state', id: 1, state: 'redundant' }]);
        expect(view(s)).toEqual({ phase: 'install-failed', error: 'InstallFailed', takenOver: false });
    });

    it('a worker replaced by a newer installing one is not a failure', () => {
        const s = run([
            { type: 'register', hadController: false },
            { type: 'installing', id: 1 },
            { type: 'installing', id: 2 },
            { type: 'state', id: 1, state: 'redundant' },
        ]);
        expect(s.phase).toBe('installing');
        expect(s.error).toBeNull();
    });

    it('registerFailed keeps the error name', () => {
        const s = run([{ type: 'register', hadController: false }, { type: 'registerFailed', error: 'SecurityError' }]);
        expect(view(s)).toEqual({ phase: 'register-failed', error: 'SecurityError', takenOver: false });
    });

    it('controllerChange marks takeover only when the page had a controller', () => {
        expect(run([{ type: 'register', hadController: true }, { type: 'controllerChange' }]).takenOver).toBe(true);
        expect(run([{ type: 'register', hadController: false }, { type: 'controllerChange' }]).takenOver).toBe(false);
    });

    it('unsupported is its own phase', () => {
        expect(view(run([{ type: 'unsupported' }]))).toEqual({ phase: 'unsupported', error: null, takenOver: false });
    });
});
