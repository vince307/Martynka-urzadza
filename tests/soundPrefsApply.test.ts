import { describe, expect, it, vi } from 'vitest';
import { applySoundPrefs } from '../src/core/soundPrefsApply';

const prefs = { effects: false, music: true };

const deps = (write: boolean) => {
    const calls: string[] = [];
    return {
        calls,
        deps: {
            service: { setPrefs: vi.fn(() => void calls.push('service')) },
            store: { write: vi.fn(() => { calls.push('store'); return write; }) },
            setPrefs: vi.fn(() => void calls.push('prefs')),
            setKept: vi.fn((kept: boolean) => void calls.push(`kept:${kept}`)),
        },
    };
};

describe('applySoundPrefs (FU-16)', () => {
    it('a kept write sets the prefs, the service, and kept true', () => {
        const { deps: d, calls } = deps(true);
        expect(applySoundPrefs(prefs, d)).toBe(true);
        expect(d.setPrefs).toHaveBeenCalledWith(prefs);
        expect(d.service.setPrefs).toHaveBeenCalledWith(prefs);
        expect(calls).toContain('kept:true');
    });
    it('a refused write still applies the choice for this session but reports kept false in the registry', () => {
        const { deps: d } = deps(false);
        expect(applySoundPrefs(prefs, d)).toBe(false);
        expect(d.service.setPrefs).toHaveBeenCalledWith(prefs);
        expect(d.setKept).toHaveBeenCalledWith(false);
    });
    it('works without a sound service', () => {
        const { deps: d } = deps(true);
        expect(applySoundPrefs(prefs, { ...d, service: undefined })).toBe(true);
    });
});
