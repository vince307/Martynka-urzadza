import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { E2E_HOOK_MARKER, checkE2EHook, e2eHookGuard } from '../vite/e2eHookGuard.mjs';

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
        expect(checkE2EHook(leaky, true)).toEqual({ ok: true, message: 'e2e hook: present (3 chunks checked)' });
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
});
