import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { E2E_HOOK_MARKER, E2E_HOOK_MARKERS, E2E_REQUIRED_MARKERS, checkE2EHook, e2eHookGuard } from '../vite/e2eHookGuard.mjs';

const clean = [
    { fileName: '_app/index-a.js', code: 'console.log(1)' },
    { fileName: '_app/phaser-b.js', code: 'var x=2' },
];
const leaky = [...clean, { fileName: '_app/index-c.js', code: `window.${E2E_HOOK_MARKER}={}` }];

describe('e2e hook guard', () => {
    it('passes a production bundle without the marker and says so', () => {
        expect(checkE2EHook(clean, false)).toEqual({ ok: true, message: 'e2e hook: absent (2 chunks checked)' });
    });

    it('fails a production bundle that contains the marker and names the chunk', () => {
        const result = checkE2EHook(leaky, false);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('_app/index-c.js');
    });

    it('requires the marker in the e2e build', () => {
        const full = [...clean, { fileName: '_app/index-e.js', code: E2E_HOOK_MARKERS.map((m) => `x("${m}")`).join(';') }];
        expect(checkE2EHook(full, true)).toEqual({ ok: true, message: 'e2e hook: present (3 chunks checked)' });
        expect(checkE2EHook(clean, true).ok).toBe(false);
    });

    it('the plugin fails the build through this.error and ignores assets', () => {
        const errors: string[] = [];
        const plugin = e2eHookGuard();
        const bundle = {
            'a.js': { type: 'chunk', fileName: 'a.js', code: E2E_HOOK_MARKER },
            'a.png': { type: 'asset', fileName: 'a.png' },
        };
        const ctx = { error: (m: string): never => { errors.push(m); throw new Error(m); } };
        expect(() => plugin.generateBundle.call(ctx, {}, bundle)).toThrow(/leaked/);
        expect(errors).toHaveLength(1);
    });

    it('guards the property the hook really installs (a rename on one side would make the guard pass blindly)', () => {
        const hook = readFileSync(new URL('../src/testing/e2eHook.ts', import.meta.url), 'utf8');
        expect(hook).toContain(`'${E2E_HOOK_MARKER}'`);
    });

    it('lists every marker with the hook marker first', () => {
        expect(E2E_HOOK_MARKERS).toEqual([E2E_HOOK_MARKER, 'e2eMonth', 'e2eFail', 'e2e-forced-failure', 'e2eStars', 'e2eSave', 'e2eSkills', 'e2eArt', 'e2eDay', 'e2eVariant', 'legacy-salon']);
        expect(E2E_REQUIRED_MARKERS).toEqual(E2E_HOOK_MARKERS);
    });

    it.each(E2E_HOOK_MARKERS.map((m) => [m] as const))('fails a production chunk holding only %s and names it', (marker) => {
        const result = checkE2EHook([...clean, { fileName: '_app/index-d.js', code: `x("${marker}")` }], false);
        expect(result.ok).toBe(false);
        expect(result.message).toContain(marker);
        expect(result.message).toContain('_app/index-d.js');
    });

    it.each(['unreadable', 'corrupt', 'unavailable', 'hang', 'writefail', 'writehang', 'backupfail', 'backuphang', 'slow'] as const)('fails a production chunk holding the ?e2eSave=%s seam (S-11 F4)', (seam) => {
        const result = checkE2EHook([...clean, { fileName: '_app/index-s.js', code: `new URLSearchParams(location.search).get("e2eSave")==="${seam}"` }], false);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('_app/index-s.js');
    });

    it.each(['missing', 'corrupt'] as const)('fails a production chunk holding the ?e2eArt=%s seam', (seam) => {
        const result = checkE2EHook([...clean, { fileName: '_app/index-a.js', code: `new URLSearchParams(location.search).get("e2eArt")==="${seam}"` }], false);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('_app/index-a.js');
    });

    it('fails the e2e build when e2eArt is missing from it (the seam was dropped)', () => {
        const withoutArt = [...leaky, ...E2E_HOOK_MARKERS.filter((m) => m !== 'e2eArt').map((m, i) => ({ fileName: `_app/m${i}.js`, code: `x("${m}")` }))];
        const result = checkE2EHook(withoutArt, true);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('e2eArt');
    });

    it('fails the e2e build when a required marker is missing, with an injected list', () => {
        const required = [E2E_HOOK_MARKER, 'e2e-forced-failure'];
        const result = checkE2EHook(leaky, true, required);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('e2e-forced-failure');
        const full = [...leaky, { fileName: '_app/index-e.js', code: 'throw new Error("e2e-forced-failure")' }];
        expect(checkE2EHook(full, true, required)).toEqual({ ok: true, message: 'e2e hook: present (4 chunks checked)' });
    });

    it('requires every marker in the e2e build by default (a hook with only the first one is a dropped hook)', () => {
        const result = checkE2EHook(leaky, true);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('e2eMonth');
    });

    it('every marker appears literally in the hook source', () => {
        const hook = readFileSync(new URL('../src/testing/e2eHook.ts', import.meta.url), 'utf8');
        for (const marker of E2E_HOOK_MARKERS) {
            expect(hook, marker).toContain(marker);
        }
    });
});
