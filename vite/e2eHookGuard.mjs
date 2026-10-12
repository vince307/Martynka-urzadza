// Keeps the e2e test hook out of production. The marker is the property the hook
// puts on window (src/testing/e2eHook.ts); it must appear in no production chunk
// and in every chunk set built with E2E_HOOK=1 (otherwise the hook vanished and
// the e2e project would fail with a confusing error).
export const E2E_HOOK_MARKER = '__martynkaE2E';

/**
 * @param {{ fileName: string; code: string }[]} chunks
 * @param {boolean} expectHook
 * @returns {{ ok: boolean; message: string }}
 */
export const checkE2EHook = (chunks, expectHook) => {
    const withMarker = chunks.filter((c) => c.code.includes(E2E_HOOK_MARKER)).map((c) => c.fileName);
    const state = expectHook ? 'present' : 'absent';
    if (!expectHook && withMarker.length > 0) {
        return { ok: false, message: `e2e hook leaked into the production bundle (${E2E_HOOK_MARKER} in ${withMarker.join(', ')})` };
    }
    if (expectHook && withMarker.length === 0) {
        return { ok: false, message: `E2E_HOOK=1 but ${E2E_HOOK_MARKER} is in no chunk: the hook was dropped from the e2e build` };
    }
    return { ok: true, message: `e2e hook: ${state} (${chunks.length} chunks checked)` };
};

/** Vite plugin: runs checkE2EHook on the finished bundle and fails the build on a violation. */
export const e2eHookGuard = () => ({
    name: 'martynka-e2e-hook-guard',
    apply: 'build',
    generateBundle(_options, bundle) {
        const chunks = Object.values(bundle)
            .filter((item) => item.type === 'chunk')
            .map((item) => ({ fileName: item.fileName, code: item.code }));
        const result = checkE2EHook(chunks, process.env.E2E_HOOK === '1');
        if (!result.ok) {
            this.error(result.message);
        }
        console.log(result.message);
    },
});
